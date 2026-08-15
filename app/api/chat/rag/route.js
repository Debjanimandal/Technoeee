/**
 * app/api/chat/rag/route.js
 *
 * POST /api/chat/rag
 *
 * Uses NVIDIA NIM API (OpenAI-compatible) with meta/llama-3.3-70b-instruct
 * Base URL: https://integrate.api.nvidia.com/v1
 *
 * Body: {
 *   question: string,
 *   studentContext: {
 *     courseCode: string | null,
 *     courseName: string | null,
 *     currentTopic: string | null,
 *     enrolledCourses: string[],
 *     progressPercent: number,
 *   },
 *   history: Array<{ role: 'user'|'model', text: string }>,
 * }
 *
 * Response: {
 *   answer: string,
 *   sources: Array<{ topicName, courseName, moduleTitle, sourceType }>,
 *   insightSignal: string | null,
 *   isGrounded: boolean,
 * }
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
const { searchChunks } = require('@/lib/rag/contentIndex');

// NVIDIA NIM — OpenAI-compatible endpoint
const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Model priority — fastest first for good UX, large model as fallback
const MODEL_PRIORITY = [
  'meta/llama-3.1-8b-instruct',       // Fast: ~5-10s, great for RAG Q&A
  'mistralai/mistral-7b-instruct-v0.3', // Fast alternative
  'meta/llama-3.3-70b-instruct',        // Slow but highest quality fallback
];

// ─── Prompt Builder ─────────────────────────────────────────────────────────

function buildSystemPrompt(retrievedChunks, studentContext) {
  const { courseName, currentTopic, enrolledCourses, progressPercent } = studentContext;

  let contextBlock = '';
  if (retrievedChunks.length > 0) {
    contextBlock = retrievedChunks
      .map((r, i) => {
        const c = r.chunk;
        return `[Source ${i + 1}] Course: ${c.courseName} | Module: ${c.moduleTitle} | Topic: ${c.topicName} (${c.sourceType})\n${c.text}`;
      })
      .join('\n\n---\n\n');
  }

  let studentCtx = '';
  if (courseName) studentCtx += `\n- Currently studying: ${courseName}`;
  if (currentTopic) studentCtx += `\n- Current topic: ${currentTopic}`;
  if (progressPercent) studentCtx += `\n- Course progress: ${progressPercent}%`;
  if (enrolledCourses?.length > 0) studentCtx += `\n- Enrolled in: ${enrolledCourses.join(', ')}`;

  const hasContext = retrievedChunks.length > 0;

  return `You are TechnoEEE's AI Academic Assistant — a knowledgeable, encouraging, and precise tutor for engineering and computer science students.

## Your Role
You help students understand academic concepts from their TechnoEEE courses. You answer questions clearly, with structured explanations, examples, and step-by-step reasoning.

## Student Context${studentCtx || '\n- No course context provided'}

## Retrieved Course Material
${hasContext ? contextBlock : '(No relevant course material found for this question)'}

## Instructions
1. If retrieved course material is provided above, BASE YOUR ANSWER primarily on that content. Quote or paraphrase from it directly. Be specific — mention the exact concept names from the material.
2. If the retrieved material is not directly relevant, still give a helpful academic answer, but clearly state: "This answer is based on general knowledge, not your specific course material."
3. Structure your answers with clear headings, bullet points, or numbered steps where appropriate.
4. Use concrete examples. If the student asks for an example, give a real one.
5. Be encouraging but academically precise. Do not oversimplify.
6. End with 1 follow-up question or suggestion to deepen understanding, unless the student's question was simple.
7. Never use emojis. Keep the tone professional and academic.

## Insight Detection (internal — do not show to student)
At the very END of your response, on a new line, append exactly one of these tags (nothing else on that line):
[INSIGHT:needs_explanation] — student is confused about a concept
[INSIGHT:needs_example] — student asked for an example
[INSIGHT:concept_confusion] — student is confusing two related concepts
[INSIGHT:confident] — student appears to already understand and is confirming
[INSIGHT:needs_revision] — student has gotten something wrong or needs to review
[INSIGHT:general_question] — general inquiry, no specific struggle detected`;
}

// ─── Insight Extractor ──────────────────────────────────────────────────────

const INSIGHT_PATTERN = /\[INSIGHT:([\w_]+)\]\s*$/m;

function extractInsight(rawAnswer) {
  const match = rawAnswer.match(INSIGHT_PATTERN);
  const insightSignal = match ? match[1] : 'general_question';
  const cleanAnswer = rawAnswer.replace(INSIGHT_PATTERN, '').trim();
  return { cleanAnswer, insightSignal };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, studentContext = {}, history = [] } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured. NVIDIA_API_KEY missing.' }, { status: 503 });
    }

    // 1. Retrieve relevant content chunks
    const retrievedChunks = searchChunks(
      question,
      4,
      studentContext.courseCode || null
    );

    // 2. Build system prompt with retrieved context + student context
    const systemPrompt = buildSystemPrompt(retrievedChunks, studentContext);

    // 3. Build OpenAI-format messages
    // Convert history (role: 'model' → role: 'assistant' for OpenAI format)
    const historyMessages = history.slice(-6).map(turn => ({
      role: turn.role === 'model' ? 'assistant' : 'user',
      content: turn.text,
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: question },
    ];

    // 4. Try models in priority order
    let rawAnswer = null;
    let lastError = null;
    let usedModel = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const completion = await nvidia.chat.completions.create({
          model: modelName,
          messages,
          temperature: 0.6,
          max_tokens: 900,
          top_p: 0.95,
        });

        rawAnswer = completion.choices?.[0]?.message?.content || '';
        usedModel = modelName;
        break;
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`[RAG] Model ${modelName} failed:`, modelErr?.message?.split('\n')[0]);
      }
    }

    if (!rawAnswer) {
      throw lastError || new Error('All AI models unavailable');
    }

    // 5. Extract insight signal (hidden tag from response)
    const { cleanAnswer, insightSignal } = extractInsight(rawAnswer);

    // 6. Build source attribution list
    const sources = retrievedChunks.map(r => ({
      topicName: r.chunk.topicName,
      courseName: r.chunk.courseName,
      moduleTitle: r.chunk.moduleTitle,
      sourceType: r.chunk.sourceType,
      score: Math.round(r.score * 100),
    }));

    return NextResponse.json({
      answer: cleanAnswer,
      sources,
      insightSignal,
      isGrounded: retrievedChunks.length > 0,
      model: usedModel, // useful for debugging
    });

  } catch (err) {
    console.error('[RAG API Error]', err);
    const message = err?.message || 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
