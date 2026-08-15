'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { BotMessageSquare, Send, BookOpen, ChevronDown, CircleDot, FileText, Lightbulb, X } from 'lucide-react';

// ─── Small helper components ────────────────────────────────────────────────

function SourceBadge({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
      {sources.slice(0, 3).map((s, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '20px', padding: '3px 10px', fontSize: '11px',
          color: '#6366f1', fontWeight: 500,
        }}>
          <FileText size={10} />
          {s.topicName.length > 30 ? s.topicName.substring(0, 30) + '...' : s.topicName}
        </span>
      ))}
    </div>
  );
}

function InsightTag({ insightType }) {
  const map = {
    needs_explanation: { label: 'Concept Explanation', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    needs_example:     { label: 'Example Requested', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    concept_confusion: { label: 'Concept Clarification', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    needs_revision:    { label: 'Needs Revision', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    confident:         { label: 'Confident', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  };
  const info = map[insightType];
  if (!info) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: info.bg, border: `1px solid ${info.color}33`,
      borderRadius: '20px', padding: '2px 9px', fontSize: '10px',
      color: info.color, fontWeight: 500, marginTop: '6px',
    }}>
      <Lightbulb size={9} />
      {info.label}
    </span>
  );
}

/** Render answer text with basic markdown-like formatting */
function AnswerText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.75, fontSize: '14px' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} style={{ fontSize: '15px', fontWeight: 700, margin: '14px 0 6px', color: '#e2e8f0' }}>{line.slice(3)}</h3>;
        }
        if (line.startsWith('### ')) {
          return <h4 key={i} style={{ fontSize: '14px', fontWeight: 600, margin: '10px 0 4px', color: '#cbd5e1' }}>{line.slice(4)}</h4>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <div key={i} style={{ display: 'flex', gap: '8px', margin: '3px 0', paddingLeft: '4px' }}><span style={{ color: '#6366f1', marginTop: '2px', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split('. ');
          return <div key={i} style={{ display: 'flex', gap: '8px', margin: '3px 0', paddingLeft: '4px' }}><span style={{ color: '#6366f1', fontWeight: 600, flexShrink: 0 }}>{num}.</span><span>{rest.join('. ')}</span></div>;
        }
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} style={{ margin: '4px 0', fontWeight: 700, color: '#e2e8f0' }}>{line.slice(2, -2)}</p>;
        }
        if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
        // Inline bold: replace **text** with bold span
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: '3px 0', color: '#cbd5e1' }}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} style={{ color: '#e2e8f0' }}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Message Component ──────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.isError;

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{
          maxWidth: '75%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          borderRadius: '18px 18px 4px 18px', padding: '12px 16px',
          color: '#fff', fontSize: '14px', lineHeight: 1.6,
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <div style={{
          maxWidth: '85%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
          color: '#fca5a5', fontSize: '13px',
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
      }}>
        <BotMessageSquare size={16} color="#fff" />
      </div>
      <div style={{ maxWidth: '85%', flex: 1 }}>
        <div style={{
          background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '4px 18px 18px 18px', padding: '14px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {msg.isLoading ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '13px' }}>Searching course material and generating answer</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#6366f1', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          ) : (
            <AnswerText text={msg.text} />
          )}
        </div>
        {!msg.isLoading && (
          <div style={{ marginLeft: '2px' }}>
            {msg.isGrounded === false && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                General knowledge — no matching course material found
              </div>
            )}
            <SourceBadge sources={msg.sources} />
            {msg.insightType && <InsightTag insightType={msg.insightType} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggested Questions ────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  'Explain the Von Neumann bottleneck',
  'What is the difference between RISC and CISC?',
  'How does pipelining work?',
  'Explain inheritance in OOP with an example',
  'What is Flynn\'s taxonomy?',
  'Explain cache memory mapping techniques',
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hello! I am the TechnoEEE AI Academic Assistant. I can answer questions about your enrolled courses using the actual course material — notes, concepts, and explanations from your learning content.\n\nAsk me anything about your courses, or pick a suggested question below.',
      sources: [],
      isGrounded: null,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Student context
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Load enrolled courses
  useEffect(() => {
    if (!user) return;
    supabase
      .from('enrollments')
      .select('course_title, course_code, progress')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setEnrolledCourses(data);
      });
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveInsight = useCallback(async ({ insightType, courseCode, topicName, summary }) => {
    if (!user) return;
    try {
      await fetch('/api/chat/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          courseCode: courseCode || 'unknown',
          topicName: topicName || null,
          insightType,
          summary,
        }),
      });
    } catch (_) {
      // Silently ignore — insights are non-critical
    }
  }, [user]);

  const sendMessage = useCallback(async (questionText) => {
    const question = (questionText || input).trim();
    if (!question || isLoading) return;

    const userMsgId = Date.now().toString();
    const botMsgId = `bot-${userMsgId}`;

    // Add user message
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: question }]);
    setInput('');
    setIsLoading(true);

    // Add loading placeholder
    setMessages(prev => [...prev, {
      id: botMsgId, role: 'bot', text: '', isLoading: true, sources: [],
    }]);

    try {
      const studentContext = {
        courseCode: selectedCourse?.course_code || null,
        courseName: selectedCourse?.course_title || null,
        currentTopic: null,
        enrolledCourses: enrolledCourses.map(e => e.course_title),
        progressPercent: selectedCourse?.progress || 0,
      };

      const res = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          studentContext,
          history: conversationHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const { answer, sources, insightSignal, isGrounded } = data;

      // Replace loading placeholder with real answer
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, text: answer, isLoading: false, sources, isGrounded, insightType: insightSignal }
          : m
      ));

      // Update conversation history for multi-turn context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text: question },
        { role: 'model', text: answer },
      ].slice(-12)); // keep last 6 turns

      // Save meaningful learning insights (fire-and-forget)
      if (insightSignal && insightSignal !== 'general_question') {
        saveInsight({
          insightType: insightSignal,
          courseCode: selectedCourse?.course_code,
          topicName: sources?.[0]?.topicName,
          summary: question,
        });
      }

    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, text: `Could not get a response: ${err.message}. Please try again.`, isLoading: false, isError: true }
          : m
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, selectedCourse, enrolledCourses, conversationHistory, saveInsight]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-send-btn:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed) !important; transform: scale(1.05); }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .suggested-q:hover { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.5) !important; }
        .course-option:hover { background: rgba(99,102,241,0.1) !important; }
        .clear-btn:hover { color: #ef4444 !important; }
      `}</style>

      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <DashboardHeader />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px 20px', gap: '16px', maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BotMessageSquare size={22} color="#6366f1" />
                  AI Academic Assistant
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: 400 }}>
                  Answers grounded in your TechnoEEE course material
                </p>
              </div>

              {/* Course Context Selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCourseDropdown(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
                    color: '#a5b4fc', fontSize: '13px', fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  <BookOpen size={14} />
                  {selectedCourse ? selectedCourse.course_title.substring(0, 28) + (selectedCourse.course_title.length > 28 ? '...' : '') : 'Select Course Context'}
                  <ChevronDown size={13} style={{ opacity: 0.7 }} />
                </button>

                {showCourseDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                    background: '#1e293b', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '12px', minWidth: '280px', overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your enrolled courses
                      </p>
                    </div>
                    {enrolledCourses.length === 0 ? (
                      <div style={{ padding: '16px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                        No enrolled courses found
                      </div>
                    ) : (
                      <>
                        <div
                          className="course-option"
                          onClick={() => { setSelectedCourse(null); setShowCourseDropdown(false); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', transition: 'background 0.15s', borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                        >
                          All Courses (no filter)
                        </div>
                        {enrolledCourses.map((c, i) => (
                          <div
                            key={i}
                            className="course-option"
                            onClick={() => { setSelectedCourse(c); setShowCourseDropdown(false); }}
                            style={{
                              padding: '10px 14px', cursor: 'pointer',
                              color: selectedCourse?.course_title === c.course_title ? '#a5b4fc' : '#cbd5e1',
                              fontSize: '13px', transition: 'background 0.15s',
                              fontWeight: selectedCourse?.course_title === c.course_title ? 600 : 400,
                            }}
                          >
                            {c.course_title}
                            {c.progress ? <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>{c.progress}% done</span> : null}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              minHeight: '480px',
            }}>
              {/* Messages Area */}
              <div
                onClick={() => showCourseDropdown && setShowCourseDropdown(false)}
                style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column' }}
              >
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}

                {/* Suggested questions (shown when only welcome message exists) */}
                {messages.length === 1 && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                      Try asking
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          className="suggested-q"
                          onClick={() => sendMessage(q)}
                          style={{
                            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '20px', padding: '6px 14px',
                            color: '#94a3b8', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.2s',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{
                borderTop: '1px solid rgba(99,102,241,0.12)', padding: '14px 16px',
                background: 'rgba(15,23,42,0.95)',
                display: 'flex', gap: '10px', alignItems: 'flex-end',
              }}>
                {messages.length > 1 && (
                  <button
                    className="clear-btn"
                    title="Clear conversation"
                    onClick={() => {
                      setMessages([{
                        id: 'welcome',
                        role: 'bot',
                        text: 'Conversation cleared. Ask me anything about your course material.',
                        sources: [],
                      }]);
                      setConversationHistory([]);
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', padding: '4px', transition: 'color 0.2s',
                      flexShrink: 0, alignSelf: 'center',
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your course... (Enter to send, Shift+Enter for new line)"
                  disabled={isLoading}
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px',
                    padding: '11px 15px', color: '#e2e8f0', fontSize: '14px',
                    fontFamily: 'inherit', resize: 'none', outline: 'none',
                    lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto',
                    transition: 'border-color 0.2s',
                    fieldSizing: 'content',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
                />
                <button
                  className="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  title="Send message"
                  style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', cursor: 'pointer', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Footer info */}
            <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', margin: 0 }}>
              Answers are generated using TechnoEEE course notes and Gemini AI. Always verify critical information with your instructor.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
