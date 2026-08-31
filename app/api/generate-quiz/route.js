import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function POST(req) {
  try {
    const { 
      courseName, 
      topic, 
      contextText, 
      quizType, 
      previousQuestions = [] 
    } = await req.json();

    if (!NVIDIA_API_KEY) {
      throw new Error("Missing NVIDIA_API_KEY environment variable.");
    }

    // Determine quantity based on quiz type
    let numQuestions = 5;
    if (quizType === 'module') numQuestions = 20;
    if (quizType === 'grand') numQuestions = 50;
    
    // Safety cap for API timeout prevention
    // Llama 3 / Nemotron might struggle or timeout with 20-50 questions in one shot
    // For demo purposes, we will cap at 15 for a single request if they ask for more,
    // though the real app might need batching logic if we truly want 50.
    if (numQuestions > 15) numQuestions = 15;

    const systemPrompt = `You are an expert academic quiz generator for the course "${courseName}".
Your task is to generate a dynamic multiple-choice quiz about: "${topic}".

STRICT INSTRUCTIONS:
1. Generate exactly ${numQuestions} questions.
2. 80% of the questions MUST be derived directly from the provided Context Material.
3. 20% of the questions can test general outside knowledge related to this specific topic.
4. Each question MUST have exactly 4 options (A, B, C, D).
5. Only ONE option should be correct.
6. Provide a concise educational explanation for the correct answer.
7. CRITICAL: Do NOT generate any questions that match or are highly similar to the following previously asked questions:
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `   - ${q}`).join('\n') : '   (No previous history, generate any valid questions)'}

OUTPUT FORMAT:
You MUST output ONLY valid JSON matching this exact structure, with no markdown formatting, no \`\`\`json wrappers, and no extra text:
[
  {
    "question": "The question text here?",
    "options": [
      { "id": "A", "text": "Option A text" },
      { "id": "B", "text": "Option B text" },
      { "id": "C", "text": "Option C text" },
      { "id": "D", "text": "Option D text" }
    ],
    "correct_answers": ["A"],
    "explanations": ["Explanation for why A is correct."]
  }
]`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context Material:\n${contextText || 'No specific context provided. Rely on general knowledge for this topic.'}` }
    ];

    const response = await fetch(NVIDIA_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", // Using Nemotron model
        messages,
        temperature: 0.7, 
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let rawOutput = data.choices?.[0]?.message?.content?.trim() || "[]";
    
    // Strip possible markdown fences
    rawOutput = rawOutput.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    
    let questions;
    try {
      questions = JSON.parse(rawOutput);
    } catch (parseErr) {
      console.error("Failed to parse LLM JSON:", rawOutput);
      throw new Error("LLM returned invalid JSON format.");
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[GenerateQuiz] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
