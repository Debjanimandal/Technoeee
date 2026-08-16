/**
 * app/api/interview/report/route.js
 * POST /api/interview/report
 *
 * Generates an AI-written qualitative assessment of the interview
 * by analyzing the full conversation transcript via NVIDIA NIM.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(request) {
  try {
    const { conversationHistory = [], interviewType = 'Technical', behavioralScores = {} } = await request.json();

    if (conversationHistory.length < 2) {
      return NextResponse.json({
        assessment: {
          strengths: ['Started the interview session'],
          weaknesses: ['Too few responses to evaluate thoroughly'],
          topicsToRevise: ['Core ' + interviewType + ' concepts'],
          suggestedNextSteps: ['Practice with longer interview sessions', 'Review fundamentals'],
          overallVerdict: 'The interview was too short to generate a meaningful evaluation. Try completing a full session.',
        },
      });
    }

    const transcript = conversationHistory
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an expert interview evaluator. Analyze the following ${interviewType} interview transcript and provide a structured JSON assessment.

Interview Transcript:
${transcript}

Behavioral data:
- Eye Contact: ${behavioralScores.eyeContact ?? 'N/A'}%
- Posture: ${behavioralScores.posture ?? 'N/A'}%
- Speaking pace: ${behavioralScores.avgWpm ?? 'N/A'} words per minute

Instructions:
- Be specific - reference actual things said in the transcript
- Be honest and constructive, not overly harsh or overly kind
- Focus on knowledge depth, reasoning quality, and communication clarity
- Identify specific topics/concepts that need improvement

Return ONLY valid JSON in this exact format:
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "topicsToRevise": ["topic 1", "topic 2"],
  "suggestedNextSteps": ["concrete action 1", "concrete action 2"],
  "overallVerdict": "2-3 sentence honest summary of the candidate's performance"
}`;

    const completion = await nvidia.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the evaluation JSON now.' },
      ],
      temperature: 0.4,
      max_tokens: 700,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const assessment = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ assessment });
      } catch (_) {}
    }

    // Fallback assessment if JSON parsing fails
    return NextResponse.json({
      assessment: {
        strengths: ['Engaged with the interview process', 'Provided verbal responses'],
        weaknesses: ['Answers could be more detailed and specific'],
        topicsToRevise: [interviewType + ' core concepts'],
        suggestedNextSteps: ['Review fundamentals', 'Practice explaining concepts with examples', 'Do more mock interviews'],
        overallVerdict: 'The interview was completed. Review the transcript and work on providing more specific, example-driven answers.',
      },
    });

  } catch (err) {
    console.error('[Interview Report Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
