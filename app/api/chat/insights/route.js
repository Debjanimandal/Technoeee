/**
 * app/api/chat/insights/route.js
 *
 * POST /api/chat/insights
 *
 * Saves a structured learning insight to Supabase.
 * Called automatically by the chatbot after each AI response.
 *
 * Body: {
 *   userId: string,
 *   courseCode: string,
 *   topicName: string | null,
 *   insightType: string,   // one of: needs_explanation | needs_example | concept_confusion | confident | needs_revision | general_question
 *   summary: string,       // the student's original question (trimmed)
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service-role key if available, otherwise anon key.
// For saving insights, anon key with RLS policy is fine.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Insight types that are meaningful to persist (skip trivial ones)
const MEANINGFUL_INSIGHTS = new Set([
  'needs_explanation',
  'needs_example',
  'concept_confusion',
  'needs_revision',
]);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, courseCode, topicName, insightType, summary } = body;

    // Only persist insights that indicate a learning struggle
    if (!userId || !courseCode || !MEANINGFUL_INSIGHTS.has(insightType)) {
      return NextResponse.json({ saved: false, reason: 'skipped' });
    }

    const { error } = await supabase.from('ai_learning_insights').insert({
      user_id: userId,
      course_code: courseCode,
      topic_name: topicName || null,
      insight_type: insightType,
      summary: (summary || '').substring(0, 500), // cap at 500 chars
    });

    if (error) {
      // Table may not exist yet — don't crash the chatbot
      console.warn('[Insights] Supabase insert skipped:', error.message);
      return NextResponse.json({ saved: false, reason: error.message });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('[Insights API Error]', err);
    return NextResponse.json({ saved: false, reason: err.message });
  }
}

export async function GET(request) {
  // Convenience: get recent insights for a user (used by analytics later)
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseCode = searchParams.get('courseCode');

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    let query = supabase
      .from('ai_learning_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (courseCode) query = query.eq('course_code', courseCode);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ insights: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
