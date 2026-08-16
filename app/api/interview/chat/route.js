/**
 * app/api/interview/chat/route.js
 * POST /api/interview/chat
 *
 * Generates the next interview question dynamically using:
 * 1. RAG context from Supabase pgvector (knowledge_chunks)
 * 2. Full conversation history
 * 3. NVIDIA NIM Llama-3.1-8b as the AI interviewer brain
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const { vectorSearchChunks, isVectorStoreReady } = require('@/lib/rag/vectorSearch');
const { searchChunks } = require('@/lib/rag/contentIndex');


const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Phase-specific behavior instructions for the AI
const PHASE_INSTRUCTIONS = {
  opening:    'Introduce yourself very briefly (1 sentence) then ask a warm, simple opening question.',
  warmup:     'Ask a foundational question to gauge baseline knowledge. Keep it accessible.',
  exploration:'Analyze the previous answer and either probe deeper or move to a related concept. React to what they said.',
  deep_probe: 'Investigate a gap or strength you noticed. Challenge an assumption or ask for a concrete example.',
  breadth:    'Check knowledge in a different area. Ask about a topic not yet covered to test overall breadth.',
  closing:    'Wrap up naturally with one final thought-provoking question, then close the interview.',
};

export async function POST(request) {
  try {
    const {
      interviewType,
      topic,
      conversationHistory = [],
      currentAnswer = '',
      questionNumber = 0,
      interviewPhase = 'warmup',
    } = await request.json();

    // ── RAG: retrieve relevant course material ──────────────────────────────
    let ragContext = '';
    try {
      const searchQuery = [topic, interviewType, currentAnswer].filter(Boolean).join(' ').slice(0, 300);
      const vectorReady = await isVectorStoreReady();
      const chunks = vectorReady
        ? await vectorSearchChunks(searchQuery, 3, null)
        : searchChunks(searchQuery, 3, null);

      if (chunks.length > 0) {
        ragContext = chunks
          .map(c => `[Topic: ${c.topicName || c.module_title}]\n${(c.content || c.chunk_text || '').slice(0, 300)}`)
          .join('\n\n');
      }
    } catch (ragErr) {
      console.warn('[Interview RAG]', ragErr.message);
    }

    // ── Build conversation context (last 8 turns) ───────────────────────────
    const historyText = conversationHistory
      .slice(-8)
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const phaseInstruction = PHASE_INSTRUCTIONS[interviewPhase] || PHASE_INSTRUCTIONS.exploration;

    // ── System prompt ────────────────────────────────────────────────────────
    const systemPrompt = `You are a professional, experienced hiring manager conducting a ${interviewType} interview${topic ? ` focused on ${topic}` : ''}.

YOUR JOB: Evaluate the candidate. Do NOT teach, explain, or give hints.

Behavior rules:
- Vague/incomplete answer -> probe deeper: "Can you elaborate on that?" or "What exactly do you mean?"
- Wrong/weak answer -> check foundation: "Let's step back. How would you define...?"  
- Strong answer -> increase difficulty: "Interesting. Now consider a scenario where..."
- Topic explored -> transition: "Good. Let's shift to..." or "Moving on"
- Keep questions SHORT (1-2 sentences maximum)
- Sound natural, not robotic
- Never ask multiple questions at once
- Do NOT start every response with "Great!" or "Excellent!"
- Do NOT reveal correct answers

Phase directive: ${phaseInstruction}
${ragContext ? `\nCourse material context (use to ask relevant questions):\n${ragContext}\n` : ''}
CRITICAL: Return ONLY the next question or statement. No labels, no preamble, nothing else.`;

    // ── Messages ─────────────────────────────────────────────────────────────
    const messages = [{ role: 'system', content: systemPrompt }];

    if (historyText) {
      messages.push({ role: 'user', content: `Interview so far:\n${historyText}` });
    }

    if (currentAnswer && currentAnswer.trim().length > 3) {
      messages.push({
        role: 'user',
        content: `Candidate just answered: "${currentAnswer.trim()}"\n\nGenerate the next interview question or follow-up.`,
      });
    } else if (questionNumber === 0) {
      messages.push({
        role: 'user',
        content: `Start the interview. Generate the opening statement and first question.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `The candidate did not respond. Handle the silence naturally and continue the interview.`,
      });
    }

    // ── LLM call ─────────────────────────────────────────────────────────────
    const completion = await nvidia.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages,
      temperature: 0.72,
      max_tokens: 120,
    });

    const nextQuestion = completion.choices[0]?.message?.content?.trim()
      || 'Could you walk me through your reasoning on that?';

    // ── Advance interview phase ───────────────────────────────────────────────
    let nextPhase = interviewPhase;
    if (questionNumber >= 1 && interviewPhase === 'opening')     nextPhase = 'warmup';
    if (questionNumber >= 2 && interviewPhase === 'warmup')      nextPhase = 'exploration';
    if (questionNumber >= 5 && interviewPhase === 'exploration')  nextPhase = 'deep_probe';
    if (questionNumber >= 8 && interviewPhase === 'deep_probe')  nextPhase = 'breadth';
    if (questionNumber >= 11)                                     nextPhase = 'closing';
    const isEnding = questionNumber >= 13;

    return NextResponse.json({ nextQuestion, nextPhase, isEnding });

  } catch (err) {
    console.error('[Interview Chat Error]', err);
    return NextResponse.json({
      nextQuestion: 'Could you elaborate on your previous answer?',
      nextPhase: 'exploration',
      isEnding: false,
    });
  }
}
