'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Calendar, Target, Award, PlayCircle, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- MOCK DATA ---
const QUIZ_DATA = [
  {
    id: 'q1',
    courseId: 'dbms',
    courseCode: 'TIU-UCS-T301',
    courseName: 'Database Management System',
    topic: 'Module 1: Intro & ER Model',
    color: '#3b82f6',
    image: '/course-banners/dbms.png',
    attempts: [
      {
        attemptNum: 1,
        startTime: '12 Aug 2026, 10:00 AM',
        endTime: '12 Aug 2026, 10:15 AM',
        duration: '15m 00s',
        marksObtained: 6,
        totalMarks: 10,
      },
      {
        attemptNum: 2,
        startTime: '14 Aug 2026, 02:30 PM',
        endTime: '14 Aug 2026, 02:42 PM',
        duration: '12m 30s',
        marksObtained: 9,
        totalMarks: 10,
      }
    ]
  },
  {
    id: 'q2',
    courseId: 'ml',
    courseCode: 'TIU-UCS-T451',
    courseName: 'Machine Learning',
    topic: 'Module 1: Supervised Learning',
    color: '#10b981',
    image: '/course-banners/ml.png',
    attempts: [
      {
        attemptNum: 1,
        startTime: '10 Aug 2026, 11:00 AM',
        endTime: '10 Aug 2026, 11:20 AM',
        duration: '20m 00s',
        marksObtained: 15,
        totalMarks: 20,
      }
    ]
  },
  {
    id: 'q3',
    courseId: 'ai',
    courseCode: 'TIU-UCS-T350',
    courseName: 'Artificial Intelligence',
    topic: 'Module 1: Search Algorithms',
    color: '#8b5cf6',
    image: '/course-banners/ai.png',
    attempts: [
      {
        attemptNum: 1,
        startTime: '15 Aug 2026, 09:00 AM',
        endTime: '15 Aug 2026, 09:25 AM',
        duration: '25m 00s',
        marksObtained: 12,
        totalMarks: 25,
      },
      {
        attemptNum: 2,
        startTime: '16 Aug 2026, 04:00 PM',
        endTime: '16 Aug 2026, 04:18 PM',
        duration: '18m 00s',
        marksObtained: 21,
        totalMarks: 25,
      },
      {
        attemptNum: 3,
        startTime: '16 Aug 2026, 07:00 PM',
        endTime: '16 Aug 2026, 07:15 PM',
        duration: '15m 00s',
        marksObtained: 24,
        totalMarks: 25,
      }
    ]
  },
  {
    id: 'q4',
    courseId: 'cn',
    courseCode: 'TIU-UCS-T304',
    courseName: 'Computer Networks',
    topic: 'Module 2: TCP/IP',
    color: '#ec4899',
    image: '/course-banners/cn.png',
    attempts: [
      {
        attemptNum: 1,
        startTime: '11 Aug 2026, 01:00 PM',
        endTime: '11 Aug 2026, 01:30 PM',
        duration: '30m 00s',
        marksObtained: 28,
        totalMarks: 30,
      }
    ]
  }
];

// Calculate overall course averages for top chart
const getCourseAverages = () => {
  const courseStats = {};
  QUIZ_DATA.forEach(quiz => {
    if (!courseStats[quiz.courseCode]) {
      courseStats[quiz.courseCode] = { totalPercentage: 0, count: 0, name: quiz.courseName };
    }
    // Get best attempt percentage for this quiz
    const bestAttempt = [...quiz.attempts].sort((a, b) => (b.marksObtained / b.totalMarks) - (a.marksObtained / a.totalMarks))[0];
    const percentage = (bestAttempt.marksObtained / bestAttempt.totalMarks) * 100;
    
    courseStats[quiz.courseCode].totalPercentage += percentage;
    courseStats[quiz.courseCode].count += 1;
  });

  const labels = [];
  const data = [];
  Object.values(courseStats).forEach(stat => {
    labels.push(stat.name);
    data.push(Math.round(stat.totalPercentage / stat.count));
  });

  return { labels, data };
};


export default function QuizHistoryTab() {
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [selectedAttempts, setSelectedAttempts] = useState({}); // { quizId: attemptNum }

  const toggleExpand = (quizId) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
    } else {
      setExpandedQuiz(quizId);
      // Default to latest attempt when opening
      if (!selectedAttempts[quizId]) {
        const quiz = QUIZ_DATA.find(q => q.id === quizId);
        const latest = quiz.attempts[quiz.attempts.length - 1].attemptNum;
        setSelectedAttempts(prev => ({ ...prev, [quizId]: latest }));
      }
    }
  };

  const handleAttemptChange = (quizId, attemptNum) => {
    setSelectedAttempts(prev => ({ ...prev, [quizId]: attemptNum }));
  };

  // --- CHART CONFIGS ---
  const overallAverages = getCourseAverages();
  const overallChartData = {
    labels: overallAverages.labels,
    datasets: [
      {
        label: 'Average Score (%)',
        data: overallAverages.data,
        backgroundColor: 'rgba(58, 138, 255, 0.8)',
        borderRadius: 6,
        barThickness: 30,
      }
    ]
  };
  
  const overallChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        displayColors: false,
        callbacks: {
          label: (context) => `Avg Score: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { weight: 'bold' } }
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Quiz History</h2>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Track your quiz performances, review attempts, and analyze your growth.</p>
      </div>

      {/* OVERALL COURSE ANALYTICS */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '12px' }}>
            <BarChart3 size={24} color="#3a8aff" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Course-wise Total Analytics</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Your highest scores averaged per course</p>
          </div>
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <Bar data={overallChartData} options={overallChartOptions} />
        </div>
      </div>

      {/* INDIVIDUAL QUIZZES LIST */}
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>Individual Quiz Records</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {QUIZ_DATA.map(quiz => {
          const isExpanded = expandedQuiz === quiz.id;
          const activeAttemptNum = selectedAttempts[quiz.id] || quiz.attempts[quiz.attempts.length - 1].attemptNum;
          const activeAttempt = quiz.attempts.find(a => a.attemptNum === activeAttemptNum);
          
          // Data for individual attempt line chart
          const attemptChartData = {
            labels: quiz.attempts.map(a => `Att ${a.attemptNum}`),
            datasets: [
              {
                label: 'Score',
                data: quiz.attempts.map(a => (a.marksObtained / a.totalMarks) * 100),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.3
              }
            ]
          };

          const attemptChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `Score: ${context.parsed.y}%`
                }
              }
            },
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } },
              x: { grid: { display: false } }
            }
          };

          return (
            <div 
              key={quiz.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: isExpanded ? '0 15px 40px rgba(0,0,0,0.08)' : '0 10px 30px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                border: '1px solid #f1f5f9'
              }}
            >
              {/* CARD HEADER (Clickable) */}
              <div 
                onClick={() => toggleExpand(quiz.id)}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? '#fafcff' : '#ffffff',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Small Thumbnail */}
                  <div style={{ 
                    width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0 
                  }}>
                    <img src={quiz.image} alt={quiz.courseCode} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ 
                        display: 'inline-block', background: 'rgba(58, 138, 255, 0.1)', color: '#3a8aff',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold'
                      }}>
                        {quiz.courseCode}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                        {quiz.courseName}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#1e293b' }}>
                      {quiz.topic}
                    </h4>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Attempts</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{quiz.attempts.length}</div>
                  </div>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'
                  }}>
                    <ChevronDown size={18} color="#64748b" />
                  </div>
                </div>
              </div>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div style={{ padding: '24px', display: 'flex', gap: '30px', animation: 'fadeIn 0.3s ease' }}>
                  
                  {/* Left Column: Attempt Selector & Details */}
                  <div style={{ flex: '1 1 50%' }}>
                    
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                      {quiz.attempts.map(attempt => (
                        <button
                          key={attempt.attemptNum}
                          onClick={() => handleAttemptChange(quiz.id, attempt.attemptNum)}
                          style={{
                            background: activeAttemptNum === attempt.attemptNum ? '#3a8aff' : '#f1f5f9',
                            color: activeAttemptNum === attempt.attemptNum ? '#fff' : '#64748b',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: activeAttemptNum === attempt.attemptNum ? '0 4px 10px rgba(58, 138, 255, 0.3)' : 'none'
                          }}
                        >
                          Attempt {attempt.attemptNum}
                        </button>
                      ))}
                    </div>

                    {/* Attempt Details */}
                    {activeAttempt && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ flex: 1, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '8px' }}>
                              <Calendar size={14} /> <span style={{ fontSize: '12px', fontWeight: '600' }}>STARTED</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{activeAttempt.startTime}</div>
                          </div>
                          <div style={{ flex: 1, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '8px' }}>
                              <Clock size={14} /> <span style={{ fontSize: '12px', fontWeight: '600' }}>DURATION</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{activeAttempt.duration}</div>
                          </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', marginBottom: '4px' }}>
                              <Award size={16} /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>SCORE OBTAINED</span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d' }}>
                              {activeAttempt.marksObtained} <span style={{ fontSize: '16px', color: '#166534', fontWeight: '600' }}>/ {activeAttempt.totalMarks}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold', marginBottom: '4px' }}>ACCURACY</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d' }}>
                              {Math.round((activeAttempt.marksObtained / activeAttempt.totalMarks) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Quiz Analytics Chart */}
                  <div style={{ flex: '1 1 50%', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <TrendingUp size={18} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Performance Progression</h4>
                    </div>
                    {quiz.attempts.length > 1 ? (
                      <div style={{ height: '200px', width: '100%' }}>
                        <Line data={attemptChartData} options={attemptChartOptions} />
                      </div>
                    ) : (
                      <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <CheckCircle2 size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
                          Only one attempt so far. <br/> Take this quiz again to see your growth chart!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
