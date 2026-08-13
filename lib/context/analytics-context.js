'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const [productiveTime, setProductiveTime] = useState(0); // in seconds
  const [idleTime, setIdleTime] = useState(0); // in seconds
  const [quizScores, setQuizScores] = useState({}); // { topicId: { score, total, timestamp } }
  const [notifications, setNotifications] = useState([]);
  const [dailyLogins, setDailyLogins] = useState([]);
  
  // Seriousness score out of 100
  const [seriousnessScore, setSeriousnessScore] = useState(100);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem('study_analytics');
      if (data) {
        const parsed = JSON.parse(data);
        setProductiveTime(parsed.productiveTime || 0);
        setIdleTime(parsed.idleTime || 0);
        setQuizScores(parsed.quizScores || {});
        setNotifications(parsed.notifications || []);
        setDailyLogins(parsed.dailyLogins || []);
        setSeriousnessScore(parsed.seriousnessScore || 100);
      }
      
      // Handle daily login tracking
      const today = new Date().toISOString().split('T')[0];
      setDailyLogins(prev => {
        if (!prev.includes(today)) {
          return [...prev, today];
        }
        return prev;
      });
    } catch (e) {
      console.error("Failed to load analytics", e);
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('study_analytics', JSON.stringify({
      productiveTime,
      idleTime,
      quizScores,
      notifications,
      dailyLogins,
      seriousnessScore
    }));
    
    calculateSeriousness();
  }, [productiveTime, idleTime, quizScores, dailyLogins, notifications]);

  const calculateSeriousness = () => {
    const totalTime = productiveTime + idleTime;
    const scores = Object.values(quizScores);

    if (totalTime < 60 && scores.length === 0) {
      setSeriousnessScore(null);
      return;
    }

    let score = 100;

    // Penalty for too much idle time relative to productive time (if total time > 10 mins)
    if (totalTime > 600) {
      const idleRatio = idleTime / totalTime;
      if (idleRatio > 0.5) score -= (idleRatio - 0.5) * 40; // up to -20 points
    }

    // Reward for consistent logins (streaks) - up to +10 points (capped at 100 total)
    if (dailyLogins.length >= 3) {
      score += 5;
    }

    // Penalty for poor quiz performance
    if (scores.length > 0) {
        let totalPct = 0;
        scores.forEach(s => { totalPct += (s.score / s.total); });
        const avgPct = totalPct / scores.length;
        if (avgPct < 0.8) {
            score -= (0.8 - avgPct) * 50; // if avg is 0.5, penalty is 15 points
        } else {
            score += 5; // reward good scores
        }
    }

    setSeriousnessScore(Math.min(100, Math.max(0, Math.round(score))));
  };

  const logTime = (type, seconds) => {
    if (type === 'productive') {
      setProductiveTime(prev => prev + seconds);
    } else {
      setIdleTime(prev => prev + seconds);
    }
  };

  const addNotification = (title, message, type = 'info') => {
    setNotifications(prev => {
        // Prevent exact duplicate spam
        if (prev.some(n => n.title === title && n.message === message)) return prev;
        
        return [{
            id: Date.now().toString(),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        }, ...prev];
    });
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const logQuizResult = (topicId, score, total) => {
    setQuizScores(prev => ({
      ...prev,
      [topicId]: { score, total, timestamp: new Date().toISOString() }
    }));
    
    const percentage = score / total;
    if (percentage < 0.8) {
        addNotification(
            "Revision Required", 
            `You scored ${score}/${total} on the ${topicId} quiz. We recommend revisiting the topic videos.`,
            "warning"
        );
    } else {
        addNotification(
            "Great Job!", 
            `You scored ${score}/${total} on the ${topicId} quiz. Keep up the good work!`,
            "success"
        );
    }
  };

  // Automatic alerts based on seriousness score dropping
  useEffect(() => {
      if (seriousnessScore !== null && seriousnessScore < 60) {
          addNotification(
              "Focus Alert",
              "Your seriousness score has dropped below 60. Try to minimize idle time and focus on completing modules.",
              "error"
          );
      }
  }, [seriousnessScore]);

  return (
    <AnalyticsContext.Provider value={{
      productiveTime,
      idleTime,
      quizScores,
      notifications,
      seriousnessScore,
      logTime,
      logQuizResult,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
