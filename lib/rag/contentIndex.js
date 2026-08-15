/**
 * lib/rag/contentIndex.js
 *
 * Server-side only — builds a searchable index from real_courses_data.json
 * using TF-IDF cosine similarity. No external dependencies needed.
 *
 * Each "chunk" is one topicDetails entry (notes + summary text) tagged with
 * its full academic context (course → module → topic).
 */

// Node-safe require — this file only ever runs on the server (API routes)
const coursesData = require('../../public/data/real_courses_data.json');

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ContentChunk
 * @property {string} id              - Unique chunk identifier
 * @property {string} courseCode      - e.g. "TIU-PC-UCS-T22101"
 * @property {string} courseName      - e.g. "Computer Organization and Architecture"
 * @property {string} moduleTitle     - e.g. "MODULE 1: Introduction to Computer Systems"
 * @property {string} topicName       - e.g. "Von Neumann and Harvard Models"
 * @property {string} sourceType      - "notes" | "summary"
 * @property {string} text            - The actual content text
 */

// ─── Build Corpus ───────────────────────────────────────────────────────────

/**
 * Determine which module a topic belongs to.
 * @param {object} course
 * @param {string} topicKey
 * @returns {string}
 */
function findModuleForTopic(course, topicKey) {
  if (!course.modules) return 'General';
  const norm = (s) => s.toLowerCase().trim();
  const nk = norm(topicKey);
  for (const mod of course.modules) {
    if (!mod.topics) continue;
    for (const t of mod.topics) {
      if (norm(t) === nk || nk.includes(norm(t)) || norm(t).includes(nk)) {
        return mod.title;
      }
    }
  }
  return course.modules[0]?.title || 'General';
}

/**
 * Extract all text chunks from a single topicDetails value.
 * Handles both the OOP format (plain object) and COA format (array of video objects).
 * @param {object|Array} topicData
 * @returns {{ notes: string|null, summaries: string[] }}
 */
function extractTexts(topicData) {
  const summaries = [];
  let notes = null;

  if (Array.isArray(topicData)) {
    // COA-style: array of { title, summary, videoUrl, notes?, ... }
    for (const entry of topicData) {
      if (entry.summary) summaries.push(entry.summary);
      if (entry.notes && !notes) notes = entry.notes; // take first available notes block
    }
  } else if (topicData && typeof topicData === 'object') {
    // OOP-style: { summary, videoUrl, notes?, summary2?, ... }
    if (topicData.summary) summaries.push(topicData.summary);
    if (topicData.summary2) summaries.push(topicData.summary2);
    if (topicData.notes) notes = topicData.notes;
  }

  return { notes, summaries };
}

/**
 * Build the full chunk corpus from all courses.
 * @returns {ContentChunk[]}
 */
function buildCorpus() {
  const chunks = [];

  for (const course of coursesData) {
    if (!course.topicDetails) continue;

    for (const [topicKey, topicData] of Object.entries(course.topicDetails)) {
      const moduleTitle = findModuleForTopic(course, topicKey);
      const { notes, summaries } = extractTexts(topicData);
      const baseId = `${course.subject_code}::${topicKey}`;

      // 1. Notes chunk — most valuable for RAG (long, detailed academic text)
      if (notes && notes.trim().length > 50) {
        // Split long notes into ~800-char chunks for better relevance scoring
        const parts = splitIntoChunks(notes, 800);
        parts.forEach((part, i) => {
          chunks.push({
            id: `${baseId}::notes::${i}`,
            courseCode: course.subject_code,
            courseName: course.course_name,
            moduleTitle,
            topicName: topicKey,
            sourceType: 'notes',
            text: part,
          });
        });
      }

      // 2. Summary chunk — shorter but gives good overview
      if (summaries.length > 0) {
        chunks.push({
          id: `${baseId}::summary`,
          courseCode: course.subject_code,
          courseName: course.course_name,
          moduleTitle,
          topicName: topicKey,
          sourceType: 'summary',
          text: summaries.join(' '),
        });
      }
    }
  }

  return chunks;
}

/**
 * Split text into overlapping chunks of approximately `maxLen` characters.
 */
function splitIntoChunks(text, maxLen = 800) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];
  let currentLen = 0;

  for (const word of words) {
    if (currentLen + word.length + 1 > maxLen && current.length > 0) {
      chunks.push(current.join(' '));
      // Overlap: keep last 20 words for context continuity
      current = current.slice(-20);
      currentLen = current.join(' ').length;
    }
    current.push(word);
    currentLen += word.length + 1;
  }

  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}

// ─── TF-IDF Implementation ─────────────────────────────────────────────────

/** Tokenize text into lowercase words, stripping punctuation */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/** Standard English stop-words to ignore */
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','it','its','this','that','these','those','are','was','were','be',
  'been','being','have','has','had','do','does','did','will','would','could',
  'should','may','might','can','as','by','from','so','if','then','than',
  'also','more','some','any','all','each','about','which','when','where',
  'how','what','who','not','no','we','they','their','our','you','your',
  'i','my','he','she','his','her','us','them','we','into','through',
]);

function filterTokens(tokens) {
  return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2);
}

/**
 * Build a term frequency map for a list of tokens.
 */
function buildTF(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const total = tokens.length;
  for (const t in tf) tf[t] /= total;
  return tf;
}

/**
 * Build IDF scores across all chunks.
 * @param {ContentChunk[]} corpus
 * @returns {Map<string, number>}
 */
function buildIDF(corpus) {
  const df = {}; // document frequency
  const N = corpus.length;

  for (const chunk of corpus) {
    const terms = new Set(filterTokens(tokenize(chunk.text)));
    for (const t of terms) df[t] = (df[t] || 0) + 1;
  }

  const idf = new Map();
  for (const [term, freq] of Object.entries(df)) {
    idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);
  }
  return idf;
}

/**
 * Compute TF-IDF vector for a document.
 */
function tfidfVector(tokens, idf) {
  const tf = buildTF(tokens);
  const vec = {};
  for (const [term, tfVal] of Object.entries(tf)) {
    const idfVal = idf.get(term) || 0;
    if (idfVal > 0) vec[term] = tfVal * idfVal;
  }
  return vec;
}

/**
 * Cosine similarity between two TF-IDF vectors.
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  for (const [term, val] of Object.entries(vecA)) {
    dot += val * (vecB[term] || 0);
    magA += val * val;
  }
  for (const val of Object.values(vecB)) magB += val * val;
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Build Index (once per server process) ─────────────────────────────────

let _corpus = null;
let _idf = null;
let _chunkVectors = null;

function ensureIndex() {
  if (_corpus) return;

  _corpus = buildCorpus();
  _idf = buildIDF(_corpus);

  // Pre-compute TF-IDF vectors for all chunks
  _chunkVectors = _corpus.map(chunk => {
    const tokens = filterTokens(tokenize(chunk.text));
    return tfidfVector(tokens, _idf);
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Search for the top-K most relevant chunks for a query.
 *
 * @param {string} query           - The student's question
 * @param {number} topK            - Number of chunks to return (default 4)
 * @param {string|null} courseCode - Optional: restrict search to one course
 * @returns {Array<{chunk: ContentChunk, score: number}>}
 */
function searchChunks(query, topK = 4, courseCode = null) {
  ensureIndex();

  const queryTokens = filterTokens(tokenize(query));
  if (queryTokens.length === 0) return [];

  const queryVec = tfidfVector(queryTokens, _idf);

  const scored = _corpus
    .map((chunk, i) => {
      // Optional course filter — but allow fallback to all courses if score is low
      if (courseCode && chunk.courseCode !== courseCode) {
        return { chunk, score: cosineSimilarity(queryVec, _chunkVectors[i]) * 0.5 };
      }
      return { chunk, score: cosineSimilarity(queryVec, _chunkVectors[i]) };
    })
    .filter(r => r.score > 0.01) // minimum relevance threshold
    .sort((a, b) => b.score - a.score);

  // De-duplicate: don't return two chunks from the same topic
  const seen = new Set();
  const results = [];
  for (const r of scored) {
    const key = `${r.chunk.courseCode}::${r.chunk.topicName}::${r.chunk.sourceType}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(r);
    }
    if (results.length >= topK) break;
  }

  return results;
}

/**
 * Get corpus statistics (useful for debugging).
 */
function getIndexStats() {
  ensureIndex();
  return {
    totalChunks: _corpus.length,
    courses: [...new Set(_corpus.map(c => c.courseCode))],
    topicsCovered: [...new Set(_corpus.map(c => c.topicName))].length,
  };
}

module.exports = { searchChunks, getIndexStats };
