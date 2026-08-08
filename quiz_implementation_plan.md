# Topic Quiz System — Implementation Plan

## Goal

Add a functional **topic-level quiz** to every topic that currently has at least one video. Each quiz contains **5 MCQ questions with 4 options**. The quiz is **visible but locked** until all videos in that topic are marked as completed.

## Scope

- **48 topic slots** across **8 courses** need quiz questions.
- Only **topic quizzes** — no module mandatory quiz or grand quiz changes.

---

## User Review Required

> [!IMPORTANT]
> This is a large content generation task (48 topics × 5 questions = **240 unique MCQ questions**). Every question must be contextually accurate to its specific topic. Please confirm the plan before we proceed.

> [!WARNING]
> Quiz state (completed videos, quiz answers) is currently stored **in-memory only** (`useState`). Once the page refreshes, progress resets. This plan does NOT add persistent backend storage — that's a separate task on the roadmap (Supabase).

---

## Proposed Changes

### Phase 1: Quiz Component (UI)

#### [NEW] `components/TopicQuiz.js`

A new React component that handles the quiz experience:

- **Props**: `questions` (array of 5 MCQs), `isLocked` (boolean), `topicKey` (string), `onComplete` (callback)
- **Locked State**: Shows all 5 questions with options visible but grayed out, with a lock overlay and a message: *"Complete all videos to unlock this quiz"*
- **Unlocked State**: User can select one option per question. A "Submit Quiz" button appears after all 5 are answered.
- **Result State**: After submission, shows score (e.g., "4/5"), highlights correct/incorrect answers in green/red, and marks the quiz as completed.
- **Design**: Premium card-based layout with smooth animations, matching the existing app aesthetic.

---

### Phase 2: Quiz Data in JSON

#### [MODIFY] `public/real_courses_data.json`

Add a `quiz` array to each topic's `topicDetails` entry. Each quiz item has:

```json
{
  "question": "What does SVM stand for?",
  "options": ["Support Vector Machine", "Simple Vector Model", "Supervised Variable Mapping", "Standard Variance Method"],
  "answer": 0
}
```

- `answer` is the **0-based index** of the correct option.
- Each topic gets exactly **5** such objects.
- Questions are **specific to the topic content** — not generic filler.

**Topic-to-Question Mapping** (all 48 topics, grouped by course):

| Course | Module | Topic | Question Theme |
|--------|--------|-------|----------------|
| **TIU-UCS-T214** (OOP C++) | M1 | Introduction to OOP | OOP paradigm basics, procedural vs OOP, encapsulation, polymorphism, inheritance |
| | M2 | Class | Class definition, objects, access specifiers, constructors, member functions |
| **TIU-PC-UCS-T22101** (COA) | M1 | Flynn's Taxonomy: SISD | SISD architecture, single instruction stream, examples |
| | M1 | SIMD | SIMD parallel processing, vector processors |
| | M1 | MISD | MISD architecture, fault tolerance |
| | M1 | MIMD; CISC and RISC | CISC vs RISC differences, pipeline stages |
| | M1 | Performance metrics | Speedup, throughput, CPI, clock rate |
| | M4 | Hierarchical memory | Memory hierarchy levels, registers vs cache |
| | M4 | Cache memory: mapping | Direct mapping, associative mapping, set-associative |
| | M4 | replacement | LRU, FIFO, LFU replacement policies |
| | M4 | Virtual memory | Page tables, TLB, page faults |
| | M4 | mapping (VM) | Virtual-to-physical address translation |
| | M4 | I/O Systems | I/O subsystem types, DMA, interrupts |
| **TIU-UCS-T350** (AI) | M2 | BFS | Breadth-first search properties, time complexity, completeness |
| | M2 | DFS | Depth-first search, stack-based, space complexity |
| | M2 | Depth limited search | Depth limit parameter, completeness issues |
| | M2 | Bidirectional search | Two-frontier approach, meeting in the middle |
| | M2 | Comparing strategies | Time vs space complexity comparison |
| | M2 | Greedy best-first | Heuristic function, greedy selection |
| | M2 | A* search | f(n) = g(n) + h(n), admissibility, optimality |
| **TIU-UCS-T321** (DAA) | M1 | Intro to algorithm design | Algorithm definition, characteristics, pseudocode |
| | M1 | Asymptotic notations | Big O, Omega, Theta definitions |
| | M1 | Complexity best case | Best case analysis, Insertion sort best case |
| | M1 | Worst/average case | Worst case Insertion sort, average case analysis |
| | M2 | Divide-and-Conquer | Merge sort steps, divide-conquer-combine |
| **TIU-UCS-T301** (DBMS) | M1 | General introduction | Database definition, advantages over file system |
| | M1 | File System disadvantages | Data redundancy, inconsistency, isolation |
| | M1 | Database-DBMS distinction | Database vs DBMS definitions |
| | M1 | Role of DBA | DBA responsibilities, privileges |
| | M1 | Approaches to building DB | Top-down, bottom-up approaches |
| | M1 | Data models | Hierarchical, network, relational models |
| | M1 | DBMS | DBMS functions, components |
| | M1 | Three-schema architecture | Physical, logical, view levels |
| | M1 | Data Independency | Logical vs physical data independence |
| | M1 | Integrity constraints | Domain, key, referential integrity |
| | M7 | Transaction Fundamentals | Transaction definition, OLTP |
| | M7 | Concurrency issues | Lost update, dirty read, phantom read |
| | M7 | Need for transactions | Why transactions are necessary |
| | M7 | ACID properties | Atomicity, Consistency, Isolation, Durability |
| **TIU-UCS-T451** (ML) | M1 | Definition/Types of ML | Supervised vs unsupervised, KNN basics |
| | M2 | Classification/Regression | Binary classification, R-squared, RMSE |
| | M3 | Least Squares/Perceptron | Linear regression, perceptron model |
| | M3 | MLP/SVM/Naive Bayes | SVM hyperplane, Naive Bayes theorem, kernel methods |
| | M5 | Decision Trees/CART | ID3 algorithm, entropy, information gain |
| **TIU-UCS-T304** (CN) | M2 | Data link layer | Design issues, framing, error detection |
| | M3 | Network Layer | Routing, IP addressing, subnetting |
| **TIU-UCS-T351** (Automata) | M1 | Introduction | Automata basics, formal languages, alphabet/string |
| | M2 | CFG and CFL | Production rules, derivation, parse trees |

---

### Phase 3: Wire Quiz into Page

#### [MODIFY] `app/learn/[courseId]/page.js`

1. **Import** the new `TopicQuiz` component.
2. **Compute `isQuizLocked`**: Check if all video completion keys for the current topic exist in `completedItems`:
   - 1 video → `completedItems.includes(topicKey)`
   - 2 videos → above + `completedItems.includes(topicKey + "_2")`
   - 3 videos → above + `completedItems.includes(topicKey + "_3")`
3. **Determine the Quiz tab index**: The Quiz tab is always the **last** item in the sub-timeline array. Its index varies depending on how many video tabs + notes tab exist.
4. **Render `<TopicQuiz>`** when the Quiz tab is selected and quiz data exists for the topic:
   ```jsx
   <TopicQuiz
     questions={course.topicDetails[selectedTopic].quiz}
     isLocked={isQuizLocked}
     topicKey={selectedTopic}
     onComplete={(score) => { /* mark quiz done */ }}
   />
   ```

---

## Execution Strategy

Because generating 240 accurate MCQs across 48 topics is large, we will:

1. **Build the `TopicQuiz` component first** — get the UI working with a test quiz.
2. **Generate quiz data in batches** using a Python script that writes directly to `real_courses_data.json`, grouped by course:
   - Batch 1: TIU-UCS-T214 (OOP) — 2 topics, 10 questions
   - Batch 2: TIU-PC-UCS-T22101 (COA) — 11 topics, 55 questions
   - Batch 3: TIU-UCS-T350 (AI) — 7 topics, 35 questions
   - Batch 4: TIU-UCS-T321 (DAA) — 5 topics, 25 questions
   - Batch 5: TIU-UCS-T301 (DBMS) — 14 topics, 70 questions
   - Batch 6: TIU-UCS-T451 (ML) — 5 topics, 25 questions
   - Batch 7: TIU-UCS-T304 (CN) — 2 topics, 10 questions
   - Batch 8: TIU-UCS-T351 (Automata) — 2 topics, 10 questions
3. **Wire it all up** in `page.js`.
4. **Test and push**.

---

## Verification Plan

### Automated
- `npm run build` — ensure no compilation errors.

### Manual
- Open a topic with 1 video → verify quiz is locked.
- Mark video complete → verify quiz unlocks.
- Open a topic with 3 videos (ML Module 3 Topic 2) → verify quiz only unlocks after all 3 are complete.
- Answer quiz → verify score display and correct/incorrect highlighting.
- Verify questions match their topic (e.g., SVM questions appear under SVM topic, not under DBMS).
