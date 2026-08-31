"use client";

import React, { useState, useEffect } from 'react';
import QuizViewer from '@/components/shared/QuizViewer';

export default function DemoQuizPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [quizActive, setQuizActive] = useState(false);
  const [quizType, setQuizType] = useState('topic'); // 'topic' or 'module'

  // The context for Computer Organization & Architecture Module 1
  const courseName = "Computer Organization & Architecture";
  const topic = "Module 1 - Introduction to Computer Architecture, von Neumann architecture, Harvard architecture, Instruction cycle";
  const contextText = `
    The von Neumann architecture consists of a single shared memory for instructions and data, a CPU with a control unit and an ALU, and I/O mechanisms. It suffers from the von Neumann bottleneck due to the shared bus.
    The Harvard architecture has physically separate memories and pathways for instructions and data, allowing simultaneous access and faster execution, commonly used in DSPs and microcontrollers.
    The Instruction cycle (Fetch-Decode-Execute) is the basic operational process of a computer. Fetch grabs the instruction from memory using the PC. Decode translates it in the control unit. Execute performs the operation in the ALU.
  `;

  // History tracking to test non-repeating logic
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load history from local storage for demo purposes
    const saved = localStorage.getItem('demo_quiz_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveHistory = (newHistory) => {
    // Keep only the last 20 questions in history to prevent LLM context explosion
    const capped = newHistory.slice(-20);
    setHistory(capped);
    localStorage.setItem('demo_quiz_history', JSON.stringify(capped));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('demo_quiz_history');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setQuizActive(false);
    
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName,
          topic,
          contextText,
          quizType,
          previousQuestions: history
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
      if (!data.questions || data.questions.length === 0) throw new Error('No questions returned');

      setQuestions(data.questions);
      setQuizActive(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = (score, total) => {
    console.log(`Demo Quiz Submitted: ${score}/${total}`);
    // Once submitted, save these questions to history to prevent them from appearing next time
    const newQuestions = questions.map(q => q.question);
    saveHistory([...history, ...newQuestions]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px' }}>
      {!quizActive ? (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>Dynamic Quiz Demo</h1>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '30px' }}>
            This page tests the RAG-based dynamic quiz generator for <b>{courseName}</b>. <br/>
            It tracks your history so that subsequent generated quizzes will <b>not</b> repeat the same questions.
          </p>

          <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Testing Context:</h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}><b>Topic:</b> {topic}</p>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
              <b>Questions in History:</b> {history.length} / 20 (Max Sliding Window)
              <button onClick={clearHistory} style={{ marginLeft: '15px', padding: '4px 10px', fontSize: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Clear History</button>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" checked={quizType === 'topic'} onChange={() => setQuizType('topic')} />
              Topic Quiz (5 Qs)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" checked={quizType === 'module'} onChange={() => setQuizType('module')} />
              Module Quiz (15 Qs Demo Cap)
            </label>
          </div>

          {error && (
            <div style={{ padding: '15px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
              <b>Error:</b> {error}
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '16px 32px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            {loading ? (
              <>Generating AI Quiz... (Takes ~5-15s)</>
            ) : (
              <>Generate Dynamic Quiz</>
            )}
          </button>
        </div>
      ) : (
        <QuizViewer
          title={`Demo ${quizType === 'topic' ? 'Topic' : 'Module'} Quiz`}
          questions={questions}
          onClose={() => setQuizActive(false)}
          onSubmitQuiz={handleSubmitQuiz}
        />
      )}
    </div>
  );
}
