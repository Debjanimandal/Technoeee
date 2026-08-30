"use client";
import { useState, useRef, useEffect } from "react";

const QUICK_CHIPS = [
  "Summarise this video",
  "Create a quiz on this video",
  "What topics are covered and at which point?",
  "Explain the key concepts",
];

// ── Markdown text renderer ────────────────────────────────────────────────────
function MarkdownText({ text }) {
  if (!text || typeof text !== "string") return null;
  return (
    <div style={{ lineHeight: "1.65", fontSize: "13px" }}>
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: "5px" }} />;
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const isNum = /^\d+\.\s/.test(trimmed);
        const content = isBullet ? trimmed.slice(2) : isNum ? trimmed.replace(/^\d+\.\s/, "") : trimmed;
        const renderBold = (str) =>
          str.split(/\*\*(.*?)\*\*/g).map((p, j) =>
            j % 2 === 1 ? <strong key={j} style={{ color: "#1e293b" }}>{p}</strong> : p
          );
        if (isBullet || isNum) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
              <span style={{ color: "#6366f1", fontWeight: "bold", flexShrink: 0 }}>
                {isNum ? trimmed.match(/^\d+/)[0] + "." : "•"}
              </span>
              <span style={{ color: "#374151" }}>{renderBold(content)}</span>
            </div>
          );
        }
        return <p key={i} style={{ margin: "0 0 5px 0", color: "#374151" }}>{renderBold(content)}</p>;
      })}
    </div>
  );
}

// ── Interactive MCQ quiz renderer ─────────────────────────────────────────────
function QuizBlock({ quiz }) {
  const [answers, setAnswers] = useState({});   // { qIndex: chosenOptionIndex }
  const [score, setScore] = useState(null);

  const choose = (qIdx, optIdx) => {
    if (answers[qIdx] !== undefined) return; // already answered
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length;
    setScore(correct);
  };

  const allAnswered = Object.keys(answers).length === quiz.questions.length;
  const labels = ["A", "B", "C", "D"];

  return (
    <div style={{ width: "100%" }}>
      {/* Quiz header */}
      <div style={{
        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
        borderRadius: "12px 12px 0 0", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "13px" }}>{quiz.title}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginLeft: "auto" }}>
          {quiz.questions.length} questions
        </span>
      </div>

      {/* Questions */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
        {quiz.questions.map((q, qIdx) => {
          const chosen = answers[qIdx];
          const answered = chosen !== undefined;
          return (
            <div key={qIdx} style={{
              padding: "14px 16px",
              borderBottom: qIdx < quiz.questions.length - 1 ? "1px solid #f1f5f9" : "none",
            }}>
              {/* Question */}
              <p style={{ fontSize: "12.5px", fontWeight: "600", color: "#1e293b", margin: "0 0 10px", lineHeight: "1.5" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "20px", height: "20px", borderRadius: "6px",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff", fontSize: "10px", fontWeight: "700",
                  marginRight: "7px", flexShrink: 0,
                }}>
                  {qIdx + 1}
                </span>
                {q.q}
              </p>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {q.options.map((opt, oIdx) => {
                  const isChosen = chosen === oIdx;
                  const isCorrect = q.answer === oIdx;
                  let bg = "#f8fafc", border = "#e2e8f0", color = "#374151";
                  if (answered) {
                    if (isCorrect) { bg = "#f0fdf4"; border = "#86efac"; color = "#166534"; }
                    else if (isChosen && !isCorrect) { bg = "#fff1f2"; border = "#fca5a5"; color = "#991b1b"; }
                  }
                  if (!answered && isChosen) { bg = "#eef2ff"; border = "#818cf8"; }
                  return (
                    <button
                      key={oIdx}
                      onClick={() => choose(qIdx, oIdx)}
                      disabled={answered}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 11px", borderRadius: "8px",
                        border: `1.5px solid ${border}`, background: bg,
                        cursor: answered ? "default" : "pointer",
                        transition: "all 0.15s", textAlign: "left",
                      }}
                      onMouseOver={e => { if (!answered) e.currentTarget.style.borderColor = "#818cf8"; }}
                      onMouseOut={e => { if (!answered) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    >
                      {/* Label badge */}
                      <span style={{
                        width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
                        background: answered && isCorrect ? "#16a34a" : answered && isChosen && !isCorrect ? "#dc2626" : "#e2e8f0",
                        color: answered && (isCorrect || (isChosen && !isCorrect)) ? "#fff" : "#64748b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: "700",
                      }}>
                        {answered && isCorrect ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : answered && isChosen && !isCorrect ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        ) : labels[oIdx]}
                      </span>
                      <span style={{ fontSize: "12px", color, fontWeight: isChosen || (answered && isCorrect) ? "600" : "400" }}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Correct answer hint after wrong answer */}
              {answered && chosen !== q.answer && (
                <p style={{ fontSize: "11px", color: "#16a34a", margin: "6px 0 0 28px", fontWeight: "500" }}>
                  Correct answer: {labels[q.answer]}. {q.options[q.answer]}
                </p>
              )}
            </div>
          );
        })}

        {/* Submit / Score row */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
          {score === null ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={{
                width: "100%", padding: "9px", borderRadius: "10px", border: "none",
                background: allAnswered ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0",
                color: allAnswered ? "#fff" : "#94a3b8",
                fontSize: "13px", fontWeight: "700", cursor: allAnswered ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {allAnswered ? "Submit Quiz" : `Answer all questions (${Object.keys(answers).length}/${quiz.questions.length})`}
            </button>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "22px", fontWeight: "800", color: score >= quiz.questions.length * 0.8 ? "#16a34a" : score >= quiz.questions.length * 0.5 ? "#d97706" : "#dc2626",
                marginBottom: "4px",
              }}>
                {score}/{quiz.questions.length}
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px" }}>
                {score >= quiz.questions.length * 0.8 ? "Excellent! Great understanding." : score >= quiz.questions.length * 0.5 ? "Good effort! Review the incorrect ones." : "Keep revising — watch the video again!"}
              </p>
              <button
                onClick={() => { setAnswers({}); setScore(null); }}
                style={{
                  padding: "6px 16px", borderRadius: "8px", border: "1.5px solid #6366f1",
                  background: "none", color: "#6366f1", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                }}
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function VideoAskPanel({ isOpen, onClose, videoTopic, videoSummary, videoUrl, courseName, partLabel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setMessages([]); setInput(""); }, [videoTopic, partLabel]);
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 450);
  }, [isOpen]);

  // Parse response — if valid quiz JSON return it, else return as text string
  const parseResponse = (raw) => {
    const text = raw.trim();
    // Strip possible markdown code fences
    const stripped = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    try {
      const parsed = JSON.parse(stripped);
      if (parsed.type === "quiz" && Array.isArray(parsed.questions)) return { kind: "quiz", data: parsed };
    } catch { /* not JSON */ }
    return { kind: "text", data: text };
  };

  async function sendMessage(questionText) {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/video-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, videoUrl, videoTopic, videoSummary, courseName, partLabel, conversationHistory: messages }),
      });
      const data = await res.json();
      const raw = data.answer;
      const parsed = parseResponse(typeof raw === "string" && raw.trim() ? raw : "Something went wrong. Please try again.");
      setMessages(prev => [...prev, { role: "ai", kind: parsed.kind, data: parsed.data }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", kind: "text", data: "Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)",
        padding: "14px 16px 12px", flexShrink: 0, borderRadius: "20px 20px 0 0",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "6px",
                background: "linear-gradient(135deg,#818cf8,#6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Ask about this video
              </span>
            </div>
            <p style={{ color: "#fff", fontSize: "13px", fontWeight: "700", margin: 0,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}
              title={videoTopic}>
              {videoTopic}{partLabel ? ` — ${partLabel}` : ""}
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", margin: "2px 0 0" }}>{courseName}</p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.8)",
            width: "28px", height: "28px", borderRadius: "8px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px",
            flexShrink: 0, transition: "background 0.15s",
          }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >×</button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 14px 0",
        display: "flex", flexDirection: "column", gap: "10px", background: "#fafafa",
      }}>
        {/* Welcome */}
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: "center", padding: "16px 8px 10px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "linear-gradient(135deg,#eef2ff,#ede9fe)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" }}>
              Ask anything about this video
            </p>
            <p style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.5", margin: 0 }}>
              Summarise, get an interactive quiz, find timestamps, or ask any question.
            </p>
          </div>
        )}

        {/* Quick chips */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {QUICK_CHIPS.map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} disabled={isLoading}
                style={{
                  background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
                  padding: "9px 12px", textAlign: "left", cursor: "pointer",
                  fontSize: "12px", color: "#374151", fontWeight: "500", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "7px",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.color = "#4338ca"; }}
                onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.5 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "ai" && (
              <div style={{
                width: "24px", height: "24px", borderRadius: "7px",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginRight: "7px", alignSelf: "flex-start", marginTop: "2px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
            )}
            {msg.role === "user" ? (
              <div style={{
                maxWidth: "84%", padding: "9px 12px",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                borderRadius: "14px 14px 3px 14px", fontSize: "13px",
                boxShadow: "0 3px 10px rgba(99,102,241,0.35)",
              }}>
                {msg.content}
              </div>
            ) : msg.kind === "quiz" ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <QuizBlock quiz={msg.data} />
              </div>
            ) : (
              <div style={{
                maxWidth: "88%", padding: "9px 12px",
                background: "#fff", color: "#1e293b",
                borderRadius: "14px 14px 14px 3px",
                border: "1px solid #e8edf5",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <MarkdownText text={msg.data} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
            <div style={{
              width: "24px", height: "24px", borderRadius: "7px",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div style={{
              background: "#fff", border: "1px solid #e8edf5", borderRadius: "14px 14px 14px 3px",
              padding: "11px 14px", display: "flex", gap: "5px", alignItems: "center",
            }}>
              <style>{`@keyframes tb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1",
                  animation: `tb 1.2s ${i*0.2}s ease-in-out infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} style={{ paddingBottom: "8px" }} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: "10px 14px 14px", borderTop: "1px solid #f0f4f8",
        background: "#fff", flexShrink: 0, borderRadius: "0 0 20px 20px",
      }}>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{
            background: "none", border: "none", fontSize: "10px", color: "#94a3b8",
            cursor: "pointer", marginBottom: "6px", padding: 0,
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.52"/>
            </svg>
            Clear chat
          </button>
        )}
        <div style={{ display: "flex", gap: "7px", alignItems: "flex-end" }}>
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about this video or request a quiz..."
            rows={1}
            style={{
              flex: 1, border: "1.5px solid #e2e8f0", borderRadius: "10px",
              padding: "9px 12px", fontSize: "12.5px", resize: "none", outline: "none",
              fontFamily: "inherit", lineHeight: "1.5", maxHeight: "90px", overflowY: "auto",
              transition: "border-color 0.2s", color: "#1e293b", background: "#f8fafc",
            }}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
            style={{
              width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
              background: input.trim() && !isLoading ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#f1f5f9",
              border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              boxShadow: input.trim() && !isLoading ? "0 3px 10px rgba(99,102,241,0.35)" : "none",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={input.trim() && !isLoading ? "#fff" : "#94a3b8"} strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: "9.5px", color: "#94a3b8", margin: "5px 0 0", textAlign: "center" }}>
          NVIDIA NIM + RAG
        </p>
      </div>
    </div>
  );
}
