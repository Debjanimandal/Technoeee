'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, Award, BarChart3, TrendingUp, CheckCircle2, BookOpen, Trophy, PlayCircle, X } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COURSE_BANNER_MAP = {
  'TIU-UCS-T214':       { img: '/course-banners/cpp.png',      color: '#0ea5e9' },
  'TIU-PC-UCS-T22101':  { img: '/course-banners/coa.png',      color: '#f43f5e' },
  'TIU-UCS-T350':       { img: '/course-banners/ai.png',       color: '#8b5cf6' },
  'TIU-UCS-T321':       { img: '/course-banners/daa.png',      color: '#ec4899' },
  'TIU-UCS-T301':       { img: '/course-banners/dbms.png',     color: '#3b82f6' },
  'TIU-UCS-T451':       { img: '/course-banners/ml.png',       color: '#10b981' },
  'TIU-UCS-T304':       { img: '/course-banners/cn.png',       color: '#f59e0b' },
  'TIU-UCS-T351':       { img: '/course-banners/automata.png', color: '#6366f1' },
};

// All attempts data: each quiz entry has an id, module, type, and attempts array
const QUIZ_COURSES_DATA = [
  {
    id: 'dbms', courseId: 'TIU-UCS-T301', title: 'Database Management System',
    modules: [
      {
        id: 'm1', title: 'Module 1: Introduction to DBMS',
        topicQuizzes: [
          { id: 'q1', title: 'Topic: General Intro & File System', type: 'optional', attempts: [
            { attemptNum: 1, startTime: '10 Aug 2026, 10:00 AM', duration: '12m 30s', marksObtained: 7, totalMarks: 10 },
            { attemptNum: 2, startTime: '12 Aug 2026, 03:00 PM', duration: '10m 00s', marksObtained: 9, totalMarks: 10 },
          ]},
        ],
        moduleQuiz: { id: 'mq1', title: 'Module 1 Mandatory Quiz', type: 'mandatory', attempts: [
          { attemptNum: 1, startTime: '13 Aug 2026, 11:00 AM', duration: '20m 00s', marksObtained: 17, totalMarks: 20 },
        ]},
      },
      {
        id: 'm2', title: 'Module 2: Relational Data Model',
        topicQuizzes: [
          { id: 'q2', title: 'Topic: Relational Algebra & Calculus', type: 'optional', attempts: [
            { attemptNum: 1, startTime: '14 Aug 2026, 09:00 AM', duration: '15m 00s', marksObtained: 8, totalMarks: 10 },
          ]},
        ],
        moduleQuiz: { id: 'mq2', title: 'Module 2 Mandatory Quiz', type: 'mandatory', attempts: [
          { attemptNum: 1, startTime: '15 Aug 2026, 04:00 PM', duration: '22m 00s', marksObtained: 16, totalMarks: 20 },
          { attemptNum: 2, startTime: '16 Aug 2026, 10:00 AM', duration: '18m 00s', marksObtained: 19, totalMarks: 20 },
        ]},
      },
      { id: 'm3', title: 'Module 3: SQL', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Normal Forms', topicQuizzes: [], moduleQuiz: null },
      { id: 'm5', title: 'Module 5: ER Model', topicQuizzes: [], moduleQuiz: null },
      { id: 'm6', title: 'Module 6: Data Storage & Indexes', topicQuizzes: [], moduleQuiz: null },
      { id: 'm7', title: 'Module 7: Transaction Processing', topicQuizzes: [], moduleQuiz: null },
      { id: 'm8', title: 'Module 8: Recovery Techniques', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: { id: 'gq1', title: 'DBMS Grand Final Assessment', attempts: [
      { attemptNum: 1, startTime: '16 Aug 2026, 06:00 PM', duration: '60m 00s', marksObtained: 88, totalMarks: 100 },
    ]},
  },
  {
    id: 'ml', courseId: 'TIU-UCS-T451', title: 'Machine Learning',
    modules: [
      {
        id: 'm1', title: 'Module 1: Introduction to ML',
        topicQuizzes: [
          { id: 'q3', title: 'Topic: Types of ML & Feature Selection', type: 'optional', attempts: [
            { attemptNum: 1, startTime: '10 Aug 2026, 11:00 AM', duration: '20m 00s', marksObtained: 6, totalMarks: 10 },
            { attemptNum: 2, startTime: '12 Aug 2026, 02:00 PM', duration: '15m 00s', marksObtained: 8, totalMarks: 10 },
          ]},
        ],
        moduleQuiz: { id: 'mq3', title: 'Module 1 Mandatory Quiz', type: 'mandatory', attempts: [
          { attemptNum: 1, startTime: '13 Aug 2026, 10:00 AM', duration: '25m 00s', marksObtained: 14, totalMarks: 20 },
        ]},
      },
      { id: 'm2', title: 'Module 2: Classification & Concept Learning', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Linear & Probabilistic Models', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Distance Based Models', topicQuizzes: [], moduleQuiz: null },
      { id: 'm5', title: 'Module 5: Rule & Tree Based Models', topicQuizzes: [], moduleQuiz: null },
      { id: 'm6', title: 'Module 6: Trends in ML', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'ai', courseId: 'TIU-UCS-T350', title: 'Artificial Intelligence',
    modules: [
      {
        id: 'm1', title: 'Module 1: Basics of AI',
        topicQuizzes: [
          { id: 'q4', title: 'Topic: Intelligent Agents', type: 'optional', attempts: [
            { attemptNum: 1, startTime: '15 Aug 2026, 09:00 AM', duration: '25m 00s', marksObtained: 12, totalMarks: 25 },
            { attemptNum: 2, startTime: '16 Aug 2026, 04:00 PM', duration: '18m 00s', marksObtained: 21, totalMarks: 25 },
            { attemptNum: 3, startTime: '16 Aug 2026, 07:00 PM', duration: '15m 00s', marksObtained: 24, totalMarks: 25 },
          ]},
        ],
        moduleQuiz: null,
      },
      { id: 'm2', title: 'Module 2: Search Algorithms & Problem Solving', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Knowledge & Reasoning', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: NLP & Expert Systems', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'cn', courseId: 'TIU-UCS-T304', title: 'Computer Network',
    modules: [
      {
        id: 'm1', title: 'Module 1: OSI & TCP/IP Models',
        topicQuizzes: [],
        moduleQuiz: { id: 'mq4', title: 'Module 1 Mandatory Quiz', type: 'mandatory', attempts: [
          { attemptNum: 1, startTime: '11 Aug 2026, 01:00 PM', duration: '30m 00s', marksObtained: 28, totalMarks: 30 },
        ]},
      },
      { id: 'm2', title: 'Module 2: Data Link Layer', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Network Layer', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Transport Layer', topicQuizzes: [], moduleQuiz: null },
      { id: 'm5', title: 'Module 5: Application Layer', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'daa', courseId: 'TIU-UCS-T321', title: 'Design and Analysis of Algorithm',
    modules: [
      { id: 'm1', title: 'Module 1: Foundation & Analysis', topicQuizzes: [], moduleQuiz: null },
      { id: 'm2', title: 'Module 2: Algorithmic Paradigms', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Graph Algorithms', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: NP-Completeness', topicQuizzes: [], moduleQuiz: null },
      { id: 'm5', title: 'Module 5: Advanced Topics', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'oop', courseId: 'TIU-UCS-T214', title: 'Object Oriented Programming using C++',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to OOP', topicQuizzes: [], moduleQuiz: null },
      { id: 'm2', title: 'Module 2: Basic Concepts of OOP', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Fundamentals of OOPs', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Advanced OOP Concepts', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'coa', courseId: 'TIU-PC-UCS-T22101', title: 'Computer Organization and Architecture',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to Computer Systems', topicQuizzes: [], moduleQuiz: null },
      { id: 'm2', title: 'Module 2: Data Representation & Arithmetic', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: ISA & CPU Organization', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Memory & I/O Organization', topicQuizzes: [], moduleQuiz: null },
      { id: 'm5', title: 'Module 5: Pipelining & ILP', topicQuizzes: [], moduleQuiz: null },
      { id: 'm6', title: 'Module 6: Multiprocessors & Advanced Architectures', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
  {
    id: 'automata', courseId: 'TIU-UCS-T351', title: 'Automata Theory & Compiler Design',
    modules: [
      { id: 'm1', title: 'Module 1: Regular Languages & Finite Automata', topicQuizzes: [], moduleQuiz: null },
      { id: 'm2', title: 'Module 2: Context-Free Grammar & Languages', topicQuizzes: [], moduleQuiz: null },
      { id: 'm3', title: 'Module 3: Turing Machines', topicQuizzes: [], moduleQuiz: null },
      { id: 'm4', title: 'Module 4: Undecidability', topicQuizzes: [], moduleQuiz: null },
    ],
    grandFinalQuiz: null,
  },
];

// Collect all attempted quizzes for the top analytics bar chart
function getAllAttemptedQuizzes() {
  const result = [];
  QUIZ_COURSES_DATA.forEach(c => {
    c.modules.forEach(m => {
      m.topicQuizzes.forEach(q => {
        if (q.attempts.length > 0) result.push({ ...q, courseId: c.courseId, courseName: c.title, moduleTitle: m.title });
      });
      if (m.moduleQuiz && m.moduleQuiz.attempts.length > 0) {
        result.push({ ...m.moduleQuiz, courseId: c.courseId, courseName: c.title, moduleTitle: m.title });
      }
    });
    if (c.grandFinalQuiz && c.grandFinalQuiz.attempts.length > 0) {
      result.push({ ...c.grandFinalQuiz, courseId: c.courseId, courseName: c.title, moduleTitle: 'Grand Final' });
    }
  });
  return result;
}

function QuizAttemptDetail({ quiz, courseColor }) {
  const [activeAttemptNum, setActiveAttemptNum] = useState(quiz.attempts[quiz.attempts.length - 1].attemptNum);
  const activeAttempt = quiz.attempts.find(a => a.attemptNum === activeAttemptNum);

  const chartData = {
    labels: quiz.attempts.map(a => `Att ${a.attemptNum}`),
    datasets: [{ label: 'Score %', data: quiz.attempts.map(a => Math.round((a.marksObtained / a.totalMarks) * 100)), borderColor: courseColor, backgroundColor: `${courseColor}20`, borderWidth: 3, pointBackgroundColor: '#fff', pointBorderColor: courseColor, pointBorderWidth: 2, pointRadius: 5, fill: true, tension: 0.3 }]
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `Score: ${c.parsed.y}%` } } }, scales: { y: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } }, x: { grid: { display: false } } } };

  return (
    <div style={{ padding: '20px 24px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: '28px' }}>
        {/* Attempt Tabs + Details */}
        <div style={{ flex: '1 1 50%' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {quiz.attempts.map(att => (
              <button key={att.attemptNum} onClick={() => setActiveAttemptNum(att.attemptNum)} style={{ background: activeAttemptNum === att.attemptNum ? courseColor : '#f1f5f9', color: activeAttemptNum === att.attemptNum ? '#fff' : '#64748b', border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeAttemptNum === att.attemptNum ? `0 4px 12px ${courseColor}40` : 'none' }}>
                Attempt {att.attemptNum}
              </button>
            ))}
          </div>
          {activeAttempt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '6px' }}>
                    <Calendar size={13} /> <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>STARTED</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{activeAttempt.startTime}</div>
                </div>
                <div style={{ flex: 1, background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '6px' }}>
                    <Clock size={13} /> <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>DURATION</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{activeAttempt.duration}</div>
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '18px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', marginBottom: '4px' }}>
                    <Award size={15} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>SCORE OBTAINED</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d' }}>
                    {activeAttempt.marksObtained} <span style={{ fontSize: '15px', color: '#166534', fontWeight: '600' }}>/ {activeAttempt.totalMarks}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700', marginBottom: '4px' }}>ACCURACY</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#15803d' }}>
                    {Math.round((activeAttempt.marksObtained / activeAttempt.totalMarks) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div style={{ flex: '1 1 50%', background: '#fff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <TrendingUp size={16} color={courseColor} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Performance Progression</span>
          </div>
          {quiz.attempts.length > 1 ? (
            <div style={{ height: '150px' }}><Line data={chartData} options={chartOptions} /></div>
          ) : (
            <div style={{ height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', fontWeight: '500' }}>Take this quiz again<br/>to see your growth chart!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizHistoryTab() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (!user) { setEnrolledCourses([]); return; }
    (async () => {
      const { data } = await supabase.from('enrollments').select('category, course_title').eq('user_id', user.id);
      const dbItems = (data || []).flatMap(e => [e.category?.toLowerCase().trim(), e.course_title?.toLowerCase().trim()]).filter(Boolean);
      const local = JSON.parse(localStorage.getItem('mockEnrolledCoursesV3') || '[]').map(s => s?.toLowerCase().trim()).filter(Boolean);
      setEnrolledCourses([...new Set([...dbItems, ...local])]);
    })();
  }, [user]);

  const filteredCourses = (enrolledCourses === null ? [] : QUIZ_COURSES_DATA.filter(c => {
    const idMatch = enrolledCourses.includes(c.courseId.toLowerCase().trim());
    const titleMatch = enrolledCourses.some(e => e.includes(c.title.toLowerCase().trim().substring(0, 15)) || c.title.toLowerCase().trim().includes(e.substring(0, 15)));
    return idMatch || titleMatch;
  }));

  // Build bar chart data from enrolled courses only
  const allQuizzes = getAllAttemptedQuizzes().filter(q => filteredCourses.some(c => c.courseId === q.courseId));
  const courseAverages = {};
  allQuizzes.forEach(q => {
    if (!courseAverages[q.courseName]) courseAverages[q.courseName] = { total: 0, count: 0 };
    const best = [...q.attempts].sort((a, b) => (b.marksObtained / b.totalMarks) - (a.marksObtained / a.totalMarks))[0];
    courseAverages[q.courseName].total += (best.marksObtained / best.totalMarks) * 100;
    courseAverages[q.courseName].count++;
  });
  const barLabels = Object.keys(courseAverages);
  const barData = barLabels.map(k => Math.round(courseAverages[k].total / courseAverages[k].count));

  const overallChartData = {
    labels: barLabels.map(l => l.split(' ').slice(0, 2).join(' ')),
    datasets: [{ label: 'Avg Score (%)', data: barData, backgroundColor: 'rgba(58,138,255,0.8)', borderRadius: 8, barThickness: 36 }]
  };
  const overallChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', padding: 12, callbacks: { label: c => `Avg: ${c.parsed.y}%` } } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold' } } } } };

  if (enrolledCourses === null) {
    return <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '16px' }}>Loading quiz history...</div>;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Quiz History</h2>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Track your quiz performances, review attempts, and analyze your growth.</p>
      </div>

      {/* Top Analytics Bar Chart */}
      {barLabels.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px 28px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '12px' }}>
              <BarChart3 size={22} color="#3a8aff" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Course-wise Analytics</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Average of your highest scores per course</p>
            </div>
          </div>
          <div style={{ height: '220px' }}><Bar data={overallChartData} options={overallChartOptions} /></div>
        </div>
      )}

      {/* Individual Quiz Records by Course > Module > Quiz */}
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Individual Quiz Records</h3>

      {filteredCourses.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          No enrolled courses found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredCourses.map(course => {
            const meta = COURSE_BANNER_MAP[course.courseId] || { img: '', color: '#64748b' };
            const isCourseOpen = selectedCourse?.id === course.id;
            const totalQuizzesDone = course.modules.reduce((acc, m) => acc + m.topicQuizzes.filter(q => q.attempts.length > 0).length + (m.moduleQuiz && m.moduleQuiz.attempts.length > 0 ? 1 : 0), 0) + (course.grandFinalQuiz && course.grandFinalQuiz.attempts.length > 0 ? 1 : 0);

            return (
              <div key={course.id} style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `2px solid ${isCourseOpen ? meta.color : '#f1f5f9'}`, overflow: 'hidden', transition: 'all 0.25s' }}>
                {/* Course Header */}
                <div onClick={() => { setSelectedCourse(isCourseOpen ? null : course); setExpandedModule(null); setExpandedQuiz(null); }}
                  style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isCourseOpen ? `${meta.color}08` : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, background: `${meta.color}20` }}>
                      {!imageErrors[course.id] ? (
                        <img src={meta.img} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageErrors(p => ({ ...p, [course.id]: true }))} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: meta.color }}>{course.title.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: `${meta.color}18`, color: meta.color, padding: '3px 10px', borderRadius: '20px' }}>{course.courseId}</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{course.title}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{totalQuizzesDone} quiz(es) attempted</p>
                    </div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s', transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={18} color="#64748b" />
                  </div>
                </div>

                {/* Module list */}
                {isCourseOpen && (
                  <div style={{ borderTop: '1px solid #f1f5f9' }}>
                    {course.modules.map(module => {
                      const isModOpen = expandedModule === module.id;
                      const hasQuizzes = module.topicQuizzes.some(q => q.attempts.length > 0) || (module.moduleQuiz && module.moduleQuiz.attempts.length > 0);

                      return (
                        <div key={module.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <div onClick={() => setExpandedModule(isModOpen ? null : module.id)}
                            style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isModOpen ? '#f8fafc' : '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <BookOpen size={18} color={isModOpen ? meta.color : '#94a3b8'} />
                              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{module.title}</span>
                              {!hasQuizzes && <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No quizzes yet</span>}
                            </div>
                            {isModOpen ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#94a3b8" />}
                          </div>

                          {isModOpen && (
                            <div style={{ padding: '0 32px 20px 60px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Topic Optional Quizzes */}
                              {module.topicQuizzes.length > 0 && (
                                <div>
                                  <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>Topic-wise Optional Quizzes</p>
                                  {module.topicQuizzes.map(q => {
                                    const isQuizOpen = expandedQuiz === q.id;
                                    return (
                                      <div key={q.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '8px' }}>
                                        <div onClick={() => setExpandedQuiz(isQuizOpen ? null : q.id)} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isQuizOpen ? '#f8fafc' : '#fff' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <PlayCircle size={16} color="#64748b" />
                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>{q.title}</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{q.attempts.length} Attempt(s)</span>
                                            {isQuizOpen ? <ChevronDown size={15} color="#94a3b8" /> : <ChevronRight size={15} color="#94a3b8" />}
                                          </div>
                                        </div>
                                        {isQuizOpen && <QuizAttemptDetail quiz={q} courseColor={meta.color} />}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Module Mandatory Quiz */}
                              {module.moduleQuiz && (
                                <div>
                                  <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>Module-wise Mandatory Quiz</p>
                                  <div style={{ background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                                    <div onClick={() => setExpandedQuiz(expandedQuiz === module.moduleQuiz.id ? null : module.moduleQuiz.id)} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Trophy size={16} color="#3b82f6" />
                                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e40af' }}>{module.moduleQuiz.title}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>{module.moduleQuiz.attempts.length} Attempt(s)</span>
                                        {expandedQuiz === module.moduleQuiz.id ? <ChevronDown size={15} color="#3b82f6" /> : <ChevronRight size={15} color="#3b82f6" />}
                                      </div>
                                    </div>
                                    {expandedQuiz === module.moduleQuiz.id && <QuizAttemptDetail quiz={module.moduleQuiz} courseColor="#3b82f6" />}
                                  </div>
                                </div>
                              )}

                              {!hasQuizzes && (
                                <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>No quizzes attempted yet for this module.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Grand Final Quiz */}
                    <div style={{ padding: '16px 24px', background: course.grandFinalQuiz ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Trophy size={20} color={course.grandFinalQuiz ? '#16a34a' : '#94a3b8'} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: course.grandFinalQuiz ? '#166534' : '#94a3b8' }}>
                              {course.grandFinalQuiz ? course.grandFinalQuiz.title : 'Grand Final Quiz'}
                            </h4>
                            <p style={{ margin: 0, fontSize: '13px', color: course.grandFinalQuiz ? '#15803d' : '#94a3b8' }}>
                              {course.grandFinalQuiz ? `${course.grandFinalQuiz.attempts.length} Attempt(s)` : 'Complete all modules to unlock'}
                            </p>
                          </div>
                        </div>
                        {course.grandFinalQuiz && (
                          <button onClick={() => setExpandedQuiz(expandedQuiz === course.grandFinalQuiz.id ? null : course.grandFinalQuiz.id)}
                            style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', background: '#bbf7d0', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}>
                            {expandedQuiz === course.grandFinalQuiz.id ? 'Hide' : 'View Attempts'}
                          </button>
                        )}
                      </div>
                      {course.grandFinalQuiz && expandedQuiz === course.grandFinalQuiz.id && (
                        <div style={{ marginTop: '16px' }}><QuizAttemptDetail quiz={course.grandFinalQuiz} courseColor="#16a34a" /></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
