/**
 * scripts/ingestEmbeddings.js
 *
 * ONE-TIME setup script — run with:
 *   node scripts/ingestEmbeddings.js
 *
 * What it does:
 *   1. Reads all content chunks from real_courses_data.json (via contentIndex logic)
 *   2. Batches them and calls NVIDIA nv-embedqa-e5-v5 for embeddings
 *   3. Upserts all chunks + embeddings into Supabase knowledge_chunks table
 *
 * Prerequisites:
 *   - Run supabase_pgvector.sql in Supabase Dashboard first
 *   - .env.local must have NVIDIA_API_KEY and NEXT_PUBLIC_SUPABASE_* vars
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Config ─────────────────────────────────────────────────────────────────

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BATCH_SIZE = 20; // texts per embedding API call (safe for free tier)
const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5';

if (!NVIDIA_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Load & Parse Course Data ────────────────────────────────────────────────

const coursesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/data/real_courses_data.json'), 'utf8')
);

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','it','its','this','that','are','was','were','be','been','have',
  'has','had','do','does','did','will','would','could','should','as','by',
]);

function findModuleForTopic(course, topicKey) {
  if (!course.modules) return 'General';
  const norm = s => s.toLowerCase().trim();
  const nk = norm(topicKey);
  for (const mod of course.modules) {
    if (!mod.topics) continue;
    for (const t of mod.topics) {
      if (norm(t) === nk || nk.includes(norm(t)) || norm(t).includes(nk)) return mod.title;
    }
  }
  return course.modules[0]?.title || 'General';
}

function splitIntoChunks(text, maxLen = 800) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [], currentLen = 0;
  for (const word of words) {
    if (currentLen + word.length + 1 > maxLen && current.length > 0) {
      chunks.push(current.join(' '));
      current = current.slice(-15);
      currentLen = current.join(' ').length;
    }
    current.push(word);
    currentLen += word.length + 1;
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}

function extractTexts(topicData) {
  const summaries = [];
  let notes = null;
  if (Array.isArray(topicData)) {
    for (const entry of topicData) {
      if (entry.summary) summaries.push(entry.summary);
      if (entry.notes && !notes) notes = entry.notes;
    }
  } else if (topicData && typeof topicData === 'object') {
    if (topicData.summary) summaries.push(topicData.summary);
    if (topicData.summary2) summaries.push(topicData.summary2);
    if (topicData.notes) notes = topicData.notes;
  }
  return { notes, summaries };
}

function buildAllChunks() {
  const chunks = [];
  for (const course of coursesData) {
    if (!course.topicDetails) continue;
    for (const [topicKey, topicData] of Object.entries(course.topicDetails)) {
      const moduleTitle = findModuleForTopic(course, topicKey);
      const { notes, summaries } = extractTexts(topicData);
      const baseId = `${course.subject_code}::${topicKey}`;

      if (notes && notes.trim().length > 50) {
        splitIntoChunks(notes, 800).forEach((part, i) => {
          chunks.push({
            chunk_id: `${baseId}::notes::${i}`,
            course_code: course.subject_code,
            course_name: course.course_name,
            module_title: moduleTitle,
            topic_name: topicKey,
            source_type: 'notes',
            chunk_text: part,
          });
        });
      }

      if (summaries.length > 0) {
        chunks.push({
          chunk_id: `${baseId}::summary`,
          course_code: course.subject_code,
          course_name: course.course_name,
          module_title: moduleTitle,
          topic_name: topicKey,
          source_type: 'summary',
          chunk_text: summaries.join(' '),
        });
      }
    }
  }
  return chunks;
}

// ─── NVIDIA Embedding API ────────────────────────────────────────────────────

async function embedBatch(texts) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: 'passage',
      encoding_format: 'float',
      truncate: 'END',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main Ingestion ──────────────────────────────────────────────────────────

async function ingest() {
  console.log('\n TechnoEEE — RAG Embeddings Ingestion');
  console.log('=========================================');

  // Build chunks
  const chunks = buildAllChunks();
  console.log(`\n  Found ${chunks.length} content chunks across ${coursesData.length} courses`);

  // Batch embed
  const batches = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Processing ${batches.length} batches of up to ${BATCH_SIZE} each\n`);

  const enriched = []; // chunks with embeddings

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const texts = batch.map(c => c.chunk_text);

    process.stdout.write(`  Batch ${i + 1}/${batches.length} — embedding ${texts.length} chunks... `);

    let embeddings;
    let retries = 3;
    while (retries > 0) {
      try {
        embeddings = await embedBatch(texts);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`\n    Retrying (${err.message.slice(0, 80)})...`);
        await sleep(3000);
      }
    }

    batch.forEach((chunk, j) => {
      enriched.push({ ...chunk, embedding: JSON.stringify(embeddings[j]) });
    });

    console.log('done');

    // Rate limit: pause between batches
    if (i < batches.length - 1) await sleep(500);
  }

  // Upsert into Supabase
  console.log('\n  Upserting into Supabase knowledge_chunks...');
  const chunkSize = 50; // supabase upsert limit per call

  for (let i = 0; i < enriched.length; i += chunkSize) {
    const slice = enriched.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('knowledge_chunks')
      .upsert(slice, { onConflict: 'chunk_id' });

    if (error) {
      console.error(`  Supabase upsert error (batch ${Math.floor(i/chunkSize)+1}):`, error.message);
      throw error;
    }
    process.stdout.write(`  Stored ${Math.min(i + chunkSize, enriched.length)}/${enriched.length} chunks\r`);
  }

  console.log(`\n  All ${enriched.length} chunks stored successfully!\n`);
  console.log('  Next step: Run the ivfflat index SQL in Supabase Dashboard:');
  console.log('  CREATE INDEX knowledge_chunks_embedding_idx');
  console.log('    ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)');
  console.log('    WITH (lists = 10);\n');
  console.log('  RAG is now using semantic vector search.\n');
}

ingest().catch(err => {
  console.error('\n  Ingestion failed:', err.message);
  process.exit(1);
});
