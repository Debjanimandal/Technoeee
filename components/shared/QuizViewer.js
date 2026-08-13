'use client';
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function QuizViewer({ title, questions, onClose, onSubmitQuiz }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(questions.length * 30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Animation state for question change
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) {
        handleSubmit();
      }
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  // Trigger animation when currentIdx changes
  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => setIsAnimating(false), 400); // matches CSS animation duration
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  const handleOptionToggle = (optId) => {
    if (isSubmitted) return;
    
    const isSingleChoice = questions[currentIdx].correct_answers.length === 1;

    setSelectedAnswers(prev => {
      const currentSelected = prev[currentIdx] || [];
      
      if (isSingleChoice) {
        return { ...prev, [currentIdx]: currentSelected.includes(optId) ? [] : [optId] };
      } else {
        if (currentSelected.includes(optId)) {
          return { ...prev, [currentIdx]: currentSelected.filter(id => id !== optId) };
        } else {
          return { ...prev, [currentIdx]: [...currentSelected, optId] };
        }
      }
    });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx] || [];
      const correctAns = q.correct_answers || [];
      if (userAns.length === correctAns.length && userAns.every(v => correctAns.includes(v))) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    if (onSubmitQuiz) onSubmitQuiz(calculatedScore, questions.length);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const q = questions[currentIdx];
  const userAns = selectedAnswers[currentIdx] || [];

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseAlert {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-question {
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .option-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .option-card:active {
          transform: scale(0.98);
        }
        .option-card:hover:not(.submitted) {
          border-color: #93c5fd !important;
          background-color: #f8fafc !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.04);
        }
        .nav-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background-color: #2563eb !important;
        }
        .nav-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
      `}</style>
      
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(244, 247, 251, 0.98)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 40px', backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px', backgroundColor: isSubmitted ? '#3b82f6' : '#fff', 
                color: isSubmitted ? 'white' : '#ef4444',
                border: isSubmitted ? 'none' : '1px solid #ef4444', 
                borderRadius: '12px', cursor: 'pointer',
                fontWeight: 'bold', transition: 'all 0.2s',
                boxShadow: isSubmitted ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              {isSubmitted ? 'Close Results' : 'Exit Quiz'}
            </button>
            <div>
              <h2 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                {title}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0', fontWeight: '500' }}>
                Topic Quiz • {questions.length} Questions
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {!isSubmitted && (
              <div style={{ 
                color: timeLeft < 60 ? '#ef4444' : '#0f172a', 
                fontSize: '1.25rem', fontWeight: 'bold', 
                backgroundColor: timeLeft < 60 ? '#fef2f2' : '#f1f5f9', 
                padding: '10px 20px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '10px',
                animation: timeLeft < 60 ? 'pulseAlert 2s infinite' : 'none'
              }}>
                <Clock size={20} color={timeLeft < 60 ? '#ef4444' : '#64748b'} />
                {formatTime(timeLeft)}
              </div>
            )}
            {!isSubmitted && (
              <button 
                onClick={handleSubmit}
                style={{
                  padding: '12px 32px', backgroundColor: '#10b981', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div style={{ 
            width: '320px', backgroundColor: '#ffffff', 
            borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '30px',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Quiz Progress
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {questions.map((_, idx) => {
                const isAnswered = (selectedAnswers[idx] || []).length > 0;
                const isCurrent = currentIdx === idx;
                
                let bg = '#ffffff';
                let border = '1px solid #cbd5e1';
                let color = '#64748b';
                
                if (isSubmitted) {
                  const ans = selectedAnswers[idx] || [];
                  const correct = questions[idx].correct_answers || [];
                  const isCorrect = ans.length === correct.length && ans.every(v => correct.includes(v));
                  bg = isCorrect ? '#ecfdf5' : '#fef2f2';
                  border = isCorrect ? '2px solid #10b981' : '2px solid #ef4444';
                  color = isCorrect ? '#059669' : '#dc2626';
                } else if (isCurrent) {
                  bg = '#3b82f6'; color = 'white'; border = '2px solid #3b82f6';
                } else if (isAnswered) {
                  bg = '#eff6ff'; color = '#2563eb'; border = '2px solid #bfdbfe';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      aspectRatio: '1', borderRadius: '12px', border, backgroundColor: bg, color,
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                      boxShadow: isCurrent ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            {isSubmitted && (
              <div style={{ 
                marginTop: '40px', padding: '30px', backgroundColor: '#f8fafc', 
                borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Score</div>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0f172a', margin: '15px 0' }}>
                  {score} <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>/ {questions.length}</span>
                </div>
                
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '20px',
                  backgroundColor: (score / questions.length) >= 0.8 ? '#ecfdf5' : '#fef2f2',
                  color: (score / questions.length) >= 0.8 ? '#059669' : '#dc2626', 
                  fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  {(score / questions.length) >= 0.8 ? <><CheckCircle size={18}/> Excellent work!</> : <><AlertCircle size={18}/> Revision Needed</>}
                </div>
              </div>
            )}
          </div>

          {/* Question Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
            <div className={isAnimating ? 'animate-question' : ''} style={{ maxWidth: '850px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <span style={{ 
                  backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '6px 14px', 
                  borderRadius: '20px', fontWeight: 'bold', fontSize: '0.875rem' 
                }}>
                  Question {currentIdx + 1}
                </span>
                {q.correct_answers.length > 1 && !isSubmitted && (
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} /> Select all that apply
                  </span>
                )}
              </div>
              
              <h1 style={{ color: '#0f172a', fontSize: '1.85rem', fontWeight: '800', lineHeight: '1.4', marginBottom: '40px' }}>
                {q.question}
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {q.options.map((opt) => {
                  const isSelected = userAns.includes(opt.id);
                  let bg = '#ffffff';
                  let border = '2px solid #e2e8f0';
                  let textColor = '#334155';
                  let shadow = '0 2px 8px rgba(0,0,0,0.02)';
                  let icon = null;
                  
                  if (!isSubmitted && isSelected) {
                    bg = '#eff6ff';
                    border = '2px solid #3b82f6';
                    textColor = '#1e3a8a';
                    shadow = '0 4px 15px rgba(59, 130, 246, 0.15)';
                  }

                  if (isSubmitted) {
                    const isCorrectAnswer = q.correct_answers.includes(opt.id);
                    if (isCorrectAnswer) {
                      bg = '#ecfdf5'; border = '2px solid #10b981'; textColor = '#064e3b';
                      icon = <CheckCircle color="#10b981" size={24} style={{ marginLeft: 'auto' }} />;
                    } else if (isSelected && !isCorrectAnswer) {
                      bg = '#fef2f2'; border = '2px solid #ef4444'; textColor = '#7f1d1d';
                      icon = <XCircle color="#ef4444" size={24} style={{ marginLeft: 'auto' }} />;
                    } else {
                      bg = '#f8fafc'; border = '2px solid #e2e8f0'; textColor = '#94a3b8';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`option-card ${isSubmitted ? 'submitted' : ''}`}
                      onClick={() => handleOptionToggle(opt.id)}
                      style={{
                        padding: '24px', borderRadius: '16px', border, backgroundColor: bg,
                        cursor: isSubmitted ? 'default' : 'pointer',
                        display: 'flex', gap: '20px', alignItems: 'center',
                        boxShadow: shadow
                      }}
                    >
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        backgroundColor: isSelected ? (isSubmitted && !q.correct_answers.includes(opt.id) ? '#ef4444' : '#3b82f6') : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontWeight: '800', color: isSelected ? 'white' : '#64748b', fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}>
                        {opt.id}
                      </div>
                      <div style={{ color: textColor, fontSize: '1.15rem', lineHeight: '1.5', fontWeight: '500' }}>
                        {opt.text}
                      </div>
                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Explanations Area */}
              {isSubmitted && q.explanations && q.explanations.length > 0 && (
                <div style={{ 
                  marginTop: '50px', padding: '35px', backgroundColor: '#fffbeb', 
                  borderRadius: '20px', border: '1px solid #fde68a',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.05)',
                  animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <h4 style={{ 
                    color: '#b45309', margin: '0 0 25px 0', fontSize: '1.1rem', 
                    fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' 
                  }}>
                    <AlertCircle size={22} /> Review & Explanations
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {q.explanations.map((exp, i) => (
                      <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          backgroundColor: '#fef3c7', color: '#b45309', padding: '6px 12px', 
                          borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold',
                          flexShrink: 0, border: '1px solid #fde68a'
                        }}>
                          Option {exp.option}
                        </div>
                        <div style={{ color: '#78350f', lineHeight: '1.7', fontSize: '1.05rem', fontWeight: '500' }}>
                          <span style={{ fontWeight: 'bold', color: '#92400e' }}>Why it's incorrect: </span>
                          {exp.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', paddingBottom: '40px' }}>
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 32px', backgroundColor: '#e2e8f0', color: '#475569',
                    border: 'none', borderRadius: '14px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentIdx === 0 ? 0.5 : 1, fontWeight: 'bold', fontSize: '1.05rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowLeft size={20} /> Previous
                </button>
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIdx === questions.length - 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 32px', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '14px', cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentIdx === questions.length - 1 ? 0.5 : 1, fontWeight: 'bold', fontSize: '1.05rem',
                    boxShadow: currentIdx === questions.length - 1 ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  Next <ArrowRight size={20} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
