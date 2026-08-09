'use client';
import React, { useState, useEffect } from 'react';

export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Constants
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Automatically switch modes
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const switchMode = (newMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  // SVG Circle calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid rgba(99,102,241,0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 16px 0' }}>Focus Timer</h3>
      
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f5f5f5', padding: '4px', borderRadius: '30px' }}>
        <button 
          onClick={() => switchMode('focus')}
          style={{ 
            padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            background: mode === 'focus' ? '#fff' : 'transparent',
            color: mode === 'focus' ? '#f44336' : '#666',
            boxShadow: mode === 'focus' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Pomodoro
        </button>
        <button 
          onClick={() => switchMode('break')}
          style={{ 
            padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            background: mode === 'break' ? '#fff' : 'transparent',
            color: mode === 'break' ? '#4caf50' : '#666',
            boxShadow: mode === 'break' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Short Break
        </button>
      </div>

      {/* Timer Circle */}
      <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="150" height="150" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle 
            cx="75" cy="75" r={radius} 
            stroke="#f0f0f0" strokeWidth="8" fill="none" 
          />
          {/* Progress circle */}
          <circle 
            cx="75" cy="75" r={radius} 
            stroke={mode === 'focus' ? '#f44336' : '#4caf50'} 
            strokeWidth="8" fill="none" 
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', zIndex: 2 }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <button 
          onClick={toggleTimer}
          style={{
            padding: '10px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
            background: isActive ? '#f5f5f5' : (mode === 'focus' ? '#ffebee' : '#e8f5e9'),
            color: isActive ? '#666' : (mode === 'focus' ? '#d32f2f' : '#2e7d32'),
            transition: 'background 0.2s'
          }}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={resetTimer}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
          }}
          title="Reset"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
