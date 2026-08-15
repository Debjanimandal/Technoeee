/**
 * lib/rag/vectorSearch.js
 *
 * Server-side only — semantic vector search using:
 * - NVIDIA nv-embedqa-e5-v5 for embedding (1024-dim, optimized for Q&A)
 * - Supabase pgvector for similarity search
 *
 * Falls back to TF-IDF (contentIndex.js) if:
 *   - knowledge_chunks table is empty
 *   - NVIDIA embedding API fails
 *   - Supabase RPC fails
 */

const { createClient } = require('@supabase/supabase-js');

// Server-side Supabase client (uses env vars, safe for API routes)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ─── Embedding API ──────────────────────────────────────────────────────────

/**
 * Call NVIDIA nv-embedqa-e5-v5 to embed text(s).
 *
 * @param {string[]} texts     Array of texts to embed
 * @param {'query'|'passage'} inputType  'query' for search queries, 'passage' for documents
 * @returns {Promise<number[][]>}         Array of 1024-dim embedding vectors
 */
async function embedTexts(texts, inputType = 'query') {
  if (!process.env.NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY not set');
  if (!texts || texts.length === 0) return [];

  const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: 'nvidia/nv-embedqa-e5-v5',
      input_type: inputType,
      encoding_format: 'float',
      truncate: 'END',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  // data.data is sorted by index, so order is preserved
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

// ─── Vector Search ──────────────────────────────────────────────────────────

/**
 * Embed a query and search for the most similar knowledge chunks in Supabase.
 *
 * @param {string} query           Student's question
 * @param {number} topK            Number of results (default 4)
 * @param {string|null} courseCode Optional course filter
 * @returns {Promise<Array<{chunk: object, score: number}>>}
 */
async function vectorSearchChunks(query, topK = 4, courseCode = null) {
  // 1. Embed the query
  const [queryEmbedding] = await embedTexts([query], 'query');

  // 2. Call Supabase match_knowledge_chunks RPC
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.25,
    match_count: topK,
    filter_course: courseCode || null,
  });

  if (error) throw new Error(`Supabase RPC error: ${error.message}`);
  if (!data || data.length === 0) return [];

  // 3. Map to same shape as TF-IDF results for drop-in compatibility
  return data.map(row => ({
    chunk: {
      id: row.chunk_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      moduleTitle: row.module_title,
      topicName: row.topic_name,
      sourceType: row.source_type,
      text: row.chunk_text,
    },
    score: row.similarity,
  }));
}

/**
 * Check if the knowledge_chunks table has been populated.
 * Used to decide whether to use vector search or fall back to TF-IDF.
 */
async function isVectorStoreReady() {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true });
    if (error) return false;
    return (count || 0) > 0;
  } catch {
    return false;
  }
}

module.exports = { vectorSearchChunks, embedTexts, isVectorStoreReady };
