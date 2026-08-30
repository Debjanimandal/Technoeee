/**
 * app/api/video-chat/route.js
 * POST /api/video-chat
 *
 * YouTube-style "Ask about this video" AI chat using:
 *  - nvidia/nemotron-3-nano-omni  — multimodal video+audio+text reasoning
 *  - RAG from Supabase pgvector (or TF-IDF fallback) for course material
 *  - Conversation history (last 10 turns)
 *
 * Video access strategy:
 *  Google Drive  → convert to direct download URL (/uc?export=download&id=...)
 *  Supabase URL  → pass directly
 *  Other URLs    → pass directly
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

const { vectorSearchChunks, isVectorStoreReady } = require("@/lib/rag/vectorSearch");
const { searchChunks } = require("@/lib/rag/contentIndex");

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

/**
 * Convert Google Drive share/view URL to a direct download URL.
 * e.g. https://drive.google.com/file/d/FILE_ID/view?... → https://drive.google.com/uc?export=download&id=FILE_ID
 */
function toDirectVideoUrl(url) {
  if (!url) return null;
  // Already a direct download URL
  if (url.includes("drive.google.com/uc?")) return url;
  // Match /file/d/FILE_ID/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  // Return as-is for Supabase or other sources
  return url;
}

export async function POST(request) {
  try {
    const {
      question = "",
      videoUrl = "",
      videoTopic = "",
      videoSummary = "",
      courseName = "",
      partLabel = "",
      conversationHistory = [],
    } = await request.json();

    if (!question.trim()) {
      return NextResponse.json({ answer: "Please ask a question." });
    }

    // ── RAG: retrieve relevant course chunks ──────────────────────────────────
    let ragContext = "";
    try {
      const searchQuery = [videoTopic, question].filter(Boolean).join(" ").slice(0, 300);
      const vectorReady = await isVectorStoreReady();
      const chunks = vectorReady
        ? await vectorSearchChunks(searchQuery, 4, null)
        : searchChunks(searchQuery, 4, null);

      if (chunks.length > 0) {
        ragContext = chunks
          .map((c) => `[${c.topicName || c.module_title}]: ${(c.content || c.chunk_text || "").slice(0, 400)}`)
          .join("\n\n");
      }
    } catch (ragErr) {
      console.warn("[VideoChat RAG]", ragErr.message);
    }

    // ── Conversation history ──────────────────────────────────────────────────
    const historyText = conversationHistory
      .slice(-8)
      .map((m) => `${m.role === "user" ? "Student" : "AI Tutor"}: ${m.content}`)
      .join("\n");

    // ── Detect quiz request ───────────────────────────────────────────────────
    const isQuizRequest = /quiz|mcq|multiple.?choice|test me|questions|question me/i.test(question);

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemPrompt = `You are an expert AI video tutor for the course "${courseName}".
You are analyzing a lecture video titled "${videoTopic}"${partLabel ? ` (${partLabel})` : ""}.

WHAT YOU KNOW ABOUT THIS VIDEO:
${videoSummary ? `Video Summary: ${videoSummary}` : "No summary available."}
${ragContext ? `\nAdditional course material:\n${ragContext}` : ""}

YOUR CAPABILITIES:
1. Summarize the video (structured bullet points)
2. Explain which topic is covered at which point/timestamp in the video
3. Explain any concept from the video in simple terms with examples
4. Answer follow-up questions about content covered in the video
5. Generate interactive MCQ quizzes based on the video content

QUIZ FORMAT RULE — CRITICAL:
If the student asks for a quiz, test, MCQ, or questions, you MUST respond with ONLY this exact JSON format and nothing else — no markdown, no explanation, no extra text:
{"type":"quiz","title":"Quiz on <topic>","questions":[{"q":"Question text?","options":["Option A text","Option B text","Option C text","Option D text"],"answer":0},{"q":"...","options":["...","...","...","..."],"answer":2}]}
- "answer" is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)
- Generate a minimum of 5 questions, more if specifically requested
- Questions must be based on actual video and course content, not generic knowledge
- All 4 options must be plausible, with only one clearly correct answer

GENERAL RULES:
- Use **bold** for key terms in text responses
- Use bullet points for lists
- Keep answers focused and academic
- If you cannot determine something from the video, say so clearly

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}` : ""}`;

    // ── Build multimodal message ──────────────────────────────────────────────
    const directVideoUrl = toDirectVideoUrl(videoUrl);

    // Build content array — video_url if we have a URL, then text question
    const userContent = [];

    if (directVideoUrl) {
      userContent.push({
        type: "video_url",
        video_url: { url: directVideoUrl },
      });
    }

    userContent.push({
      type: "text",
      text: question.trim(),
    });

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: directVideoUrl ? userContent : question.trim() },
    ];

    // ── LLM call — nvidia/nemotron-3-nano-omni ───────────────────────────────
    let answer;
    try {
      const completion = await nvidia.chat.completions.create({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        messages,
        temperature: 0.4,
        max_tokens: 600,
        modalities: ["text"],  // Request text output (video input, text output)
      });
      answer = completion.choices[0]?.message?.content?.trim();
    } catch (videoErr) {
      console.warn("[VideoChat] Multimodal call failed, falling back to text-only:", videoErr.message);
      // Fallback: text-only call with the same system prompt + question
      const fallback = await nvidia.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.trim() },
        ],
        temperature: 0.6,
        max_tokens: 500,
      });
      answer = fallback.choices[0]?.message?.content?.trim();
    }

    return NextResponse.json({
      answer: answer || "I could not generate a response. Please try again.",
    });

  } catch (err) {
    console.error("[VideoChat Error]", err);
    return NextResponse.json({ answer: "Something went wrong. Please try again." });
  }
}
