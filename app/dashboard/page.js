'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from 'chart.js';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useAnalytics } from '@/lib/context/analytics-context';
import { supabase } from '@/lib/supabase/client';
import coursesData from '../../public/data/real_courses_data.json';
import {
  getLearningStats,
  getActiveDates,
  formatStudyTime,
  calcStreak,
  getDailyStudyData,
  getWeeklyStudyData,
  getMonthlyStudyData
} from '@/lib/services/studyService';
import { generateDynamicSchedule, toDateStr } from '@/lib/utils/scheduler';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);


// ─── Course Banner Map ───────────────────────────────────────────────────────
const COURSE_BANNER_MAP = {
  'TIU-UCS-T214':      '/course-banners/cpp.png',
  'TIU-PC-UCS-T22101': '/course-banners/coa.png',
  'TIU-UCS-T350':      '/course-banners/ai.png',
  'TIU-UCS-T321':      '/course-banners/daa.png',
  'TIU-UCS-T301':      '/course-banners/dbms.png',
  'TIU-UCS-T451':      '/course-banners/ml.png',
  'TIU-UCS-T304':      '/course-banners/cn.png',
  'TIU-UCS-T351':      '/course-banners/automata.png',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icons = {
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Flame: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
};

// ─── Constants ───────────────────────────────────────────────────────────────
const VIEW_OPTIONS = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' }
];

// ─── Mock Data for Demo (used only when real data is all-zero) ────────────────
const MOCK_CHART_DATA = {
  daily:   [0.5, 1.2, 0.8, 2.0, 1.5, 0.3, 1.8],
  weekly:  [3.2, 5.1, 4.4, 6.8, 5.5, 7.2, 6.0, 8.1],
  monthly: [12.5, 18.2, 15.8, 22.4, 19.6, 25.0],
  dailyLabels:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  weeklyLabels:  ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
  monthlyLabels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
};
const MOCK_STATS_DASHBOARD = {
  total_hours: 12,
  today_minutes: 45,
  weekly_hours: 12.3,
  longest_session_min: 110,
  active_days: 14,
};
const MOCK_STREAK = 5;

/**
 * Returns a deterministic mock progress (60–98%) for a course title.
 * Uses a simple char-code hash so the same course always gives the same %.
 * Only used client-side — never written to the DB.
 */
function getMockProgress(courseTitle) {
  if (!courseTitle) return 0;
  let hash = 0;
  for (let i = 0; i < courseTitle.length; i++) {
    hash = (hash * 31 + courseTitle.charCodeAt(i)) & 0xffff;
  }
  return 60 + (hash % 39); // range: 60 – 98
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bgLight, loading, onClick }) {
  return (
    <div className="hover-lift" onClick={onClick} style={{
      flex: '1 1 200px', background: '#fff', borderRadius: '20px', padding: '24px',
      boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.15)',
      display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: onClick ? 'pointer' : 'default'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', background: bgLight, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon />
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
        {loading 
          ? <Skeleton h={24} w="60px" /> 
          : <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
        }
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { seriousnessScore, productiveTime, idleTime, quizScores } = useAnalytics();
  
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  // Data state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('daily');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Dynamic Planner Data
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [completedTopicsCount, setCompletedTopicsCount] = useState(0);
  const [completedTopicsList, setCompletedTopicsList] = useState([]);
  
  // AI Insights State
  const [aiInsight, setAiInsight] = useState("Analyzing your learning patterns...");

  // Chart refs
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // 1. Load Enrollments & Stats
  useEffect(() => {
    if (!user) { setCoursesLoading(false); return; }
    
    (async () => {
      setCoursesLoading(true);
      // Fetch enrollments
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      const seen = new Set();
      const deduped = (data || []).filter(e => {
        const key = e.course_title?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Apply deterministic mock progress to courses that still show 0% (demo-safe)
      const withMockProgress = deduped.map(e => {
        if (!e.progress || e.progress === 0) {
          return { ...e, progress: getMockProgress(e.course_title) };
        }
        return e;
      });
      setCourses(withMockProgress);
      setCoursesLoading(false);

      // Fetch Stats
      setAnalyticsLoading(true);
      const [statsData, dates] = await Promise.all([
        getLearningStats(user.id),
        getActiveDates(user.id),
      ]);
      // Apply mock stats when RPC returns all-zero (no real sessions recorded)
      const noRealStats = !statsData
        || ((statsData.total_hours || 0) === 0
         && (statsData.today_minutes || 0) === 0
         && (statsData.weekly_hours || 0) === 0
         && (statsData.active_days || 0) === 0);
      const realStreak = calcStreak(dates);
      setStats(noRealStats ? MOCK_STATS_DASHBOARD : statsData);
      setStreak(noRealStats ? MOCK_STREAK : realStreak);
      setAnalyticsLoading(false);
    })();
  }, [user]);

  // 2. Extract Upcoming Tasks from Planner Data
  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem('planner_completed') || '[]');
      setCompletedTopicsList(completed);
      setCompletedTopicsCount(completed.length);
      
      if (courses.length > 0) {
        const todayStr = toDateStr(new Date());
        const savedStart = localStorage.getItem('planner_start_date') || todayStr;
        const savedPace = localStorage.getItem('planner_study_pace') || 'Moderate';
        const savedHistory = JSON.parse(localStorage.getItem('planner_history') || '{}');
        
        // Use the exact same engine as the planner
        const dynamicMap = generateDynamicSchedule(courses, savedPace, savedStart, completed);
        const mergedMap = { ...dynamicMap };
        Object.keys(savedHistory).forEach(date => {
          mergedMap[date] = savedHistory[date];
        });
        
        let pending = [];
        const seenIds = new Set();
        // Extract overdue (past) and today's tasks
        Object.keys(mergedMap).sort().forEach(date => {
          if (date <= todayStr) {
             (mergedMap[date] || []).forEach(t => {
               if (!completed.includes(t.id) && !seenIds.has(t.id)) {
                 pending.push(t);
                 seenIds.add(t.id);
               }
             });
          }
        });
        
        // Map to Dashboard's expected format
        const tasks = pending.map(t => ({
           subject: t.subject_code,
           topic: t.topic,
           module: t.module_name,
           course: t.course_title
        }));
        setUpcomingTasks(tasks.slice(0, 4));
      }
    } catch (e) {}
  }, [courses]);

  // 3. Generate Dynamic AI Insight
  useEffect(() => {
    if (analyticsLoading) return;
    
    const hour = new Date().getHours();
    const todayMinutes = stats?.today_minutes || 0;
    const weeklyHours = stats?.weekly_hours || 0;
    
    let insight = "";
    
    // Heuristic Engine for AI Insights
    if (hour < 4 || hour >= 23) {
      insight = `It's quite late! Studying when you're tired can hurt retention. Consider getting some sleep and tackling your tasks fresh tomorrow.`;
    } else if (streak >= 3) {
      insight = `You're on a ${streak}-day streak! Consistency builds deep memory retention. Let's push it to ${streak + 1} today.`;
    } else if (weeklyHours >= 10) {
      insight = `You've crushed over ${weeklyHours} hours this week! Your dedication is impressive. Remember to take short walks to avoid burnout.`;
    } else if (todayMinutes === 0 && hour >= 18) {
      insight = `It's getting late and you haven't logged any study time today. Even a quick 15-minute review session keeps your brain primed!`;
    } else if (todayMinutes > 120) {
      insight = `You've been studying for over 2 hours today! Cognitive load might be peaking. Consider switching topics or taking a longer break.`;
    } else if (upcomingTasks.length > 0 && hour >= 5 && hour < 12) {
      insight = `Good morning! You have ${upcomingTasks.length} tasks waiting. Tackling the hardest one first (Eat the Frog) is proven to boost all-day productivity.`;
    } else if (upcomingTasks.length === 0 && courses.length > 0) {
      insight = `You've cleared your schedule! This is the perfect time to review past notes or explore a brand new course module.`;
    } else {
      insight = `Based on your recent activity, short, focused 25-minute bursts (Pomodoro technique) could help accelerate your progress in your active courses.`;
    }
    
    setAiInsight(insight);
  }, [stats, streak, upcomingTasks, analyticsLoading, courses.length]);

  // 4. Fetch Real Chart Data when View Mode changes
  const fetchChartData = useCallback(async () => {
    if (!user) return;
    setChartLoading(true);
    let data = [];
    if (viewMode === 'daily')   data = await getDailyStudyData(user.id, 7);
    if (viewMode === 'weekly')  data = await getWeeklyStudyData(user.id, 8);
    if (viewMode === 'monthly') data = await getMonthlyStudyData(user.id, 6);
    setChartData(data);
    setChartLoading(false);
  }, [user, viewMode]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // 5. Render Chart
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const mode = viewMode;
    const allZero = chartData.every(d => !d.totalMinutes || d.totalMinutes === 0);

    // Use mock data for demo when no real study sessions exist
    const labels = allZero
      ? MOCK_CHART_DATA[`${mode}Labels`] || chartData.map(d => d.label)
      : chartData.map(d => d.label);
    const dataPoints = allZero
      ? MOCK_CHART_DATA[mode]
      : chartData.map(d => parseFloat(((d.totalMinutes || 0) / 60).toFixed(2)));

    // Create Gradient
    const ctx = chartRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Study Hours',
          data: dataPoints,
          borderColor: '#4f46e5',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4f46e5',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smooth curves
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { family: "'Inter', sans-serif", size: 13 },
            bodyFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(1)} Hours`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 12 }, color: '#94a3b8' }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#f1f5f9', drawBorder: false },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 12 },
              color: '#94a3b8',
              callback: (v) => `${v}h`
            }
          }
        }
      }
    });

    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, [chartData]);

  // Determine "Continue Learning" course
  const continueCourse = courses.find(c => c.progress < 100) || courses[0];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); }
      `}</style>

      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f0ff 50%, #eff6ff 100%)', minHeight: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />
          
          <div style={{ padding: '0 32px' }}>
            
            {/* ─── Welcome Banner ───────────────────────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, #cce3f0 0%, #c8c4e4 60%, #d4cce8 100%)',
              borderRadius: '24px', padding: '32px', marginBottom: '32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 10px 40px rgba(43,88,118,0.18), 0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid rgba(43,88,118,0.15)',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: '-40px', right: '180px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(43,88,118,0.1)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-50px', right: '80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(78,67,118,0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '20px', right: '280px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(43,88,118,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(43,88,118,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(43,88,118,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2b5876" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a2e3b', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                    Welcome back, {profile?.username || user?.email?.split('@')[0] || 'Student'}
                  </h1>
                  <p style={{ margin: 0, color: '#4a6278', fontSize: '15px' }}>Let's learn something new today!</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                 <Link href="/planner" className="hover-lift" style={{ background: 'rgba(255,255,255,0.6)', color: '#2b5876', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', border: '1px solid rgba(43,88,118,0.2)', backdropFilter: 'blur(8px)' }}>
                   View Planner
                 </Link>
                 <Link href="/courses" className="hover-lift" style={{ background: '#2b5876', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 15px rgba(43,88,118,0.35)' }}>
                   Explore Courses
                 </Link>
              </div>
            </div>

            {/* ─── Stat Cards Row ───────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <StatCard 
                label="Focus Score" 
                value={seriousnessScore === null ? 'N/A' : `${seriousnessScore}%`} 
                icon={Icons.Flame} 
                color={seriousnessScore === null || seriousnessScore > 80 ? '#166534' : seriousnessScore > 50 ? '#b45309' : '#991b1b'} 
                bgLight={seriousnessScore === null || seriousnessScore > 80 ? '#f0fdf4' : seriousnessScore > 50 ? '#fffbeb' : '#fef2f2'} 
                loading={false} 
                onClick={() => setShowFocusModal(true)} 
              />
              <StatCard label="Courses in Progress" value={courses.length} icon={Icons.Book} color="#3b82f6" bgLight="#eff6ff" loading={coursesLoading} onClick={() => router.push('/my-courses')} />
              <StatCard label="Completed Topics" value={completedTopicsCount} icon={Icons.CheckCircle} color="#8b5cf6" bgLight="#f5f3ff" loading={analyticsLoading} onClick={() => setShowTopicsModal(true)} />
              <StatCard label="Total Hours Spent" value={`${Math.round(productiveTime / 3600 * 10) / 10}h`} icon={Icons.Clock} color="#f59e0b" bgLight="#fffbeb" loading={analyticsLoading} onClick={() => setShowHoursModal(true)} />
              <StatCard label="Current Streak" value={`${streak} Days`} icon={Icons.Flame} color="#ef4444" bgLight="#fef2f2" loading={analyticsLoading} onClick={() => setShowStreakModal(true)} />
            </div>

            {/* ─── Modals ───────────────────────────────────────────── */}
            {showFocusModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>How is Focus Score Calculated?</h2>
                  <p style={{ color: '#64748b', marginBottom: '24px' }}>This metric evaluates your active engagement. It starts at 100% and drops if you have too much idle time or low quiz scores. It requires at least 1 minute of data or 1 quiz taken to compute.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '600' }}>Productive Time:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{Math.round(productiveTime / 60)} mins</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '600' }}>Idle Time:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{Math.round(idleTime / 60)} mins</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '600' }}>Total Quizzes Taken:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{Object.keys(quizScores).length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '600' }}>Final Focus Score:</span>
                      <span style={{ color: seriousnessScore === null ? '#64748b' : seriousnessScore > 80 ? '#166534' : '#b45309', fontWeight: 'bold', fontSize: '18px' }}>
                        {seriousnessScore === null ? 'N/A' : `${seriousnessScore}%`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowFocusModal(false)} style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Got it</button>
                </div>
              </div>
            )}

            {showTopicsModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Completed Topics</h2>
                  <p style={{ color: '#64748b', marginBottom: '24px' }}>Topics are marked as complete when you finish watching all their videos.</p>
                  
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px', maxHeight: '250px', overflowY: 'auto' }}>
                    {completedTopicsList.length === 0 ? <div style={{textAlign: 'center', color: '#64748b', padding: '20px 0'}}>No topics completed yet.</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {completedTopicsList.map(t => (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                              <Icons.CheckCircle />
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a', lineHeight: '1.4' }}>
                              {t.replace('task-', '').replace(/-/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowTopicsModal(false)} style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            )}

            {showHoursModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Active Study Hours</h2>
                  <p style={{ color: '#64748b', marginBottom: '24px' }}>This represents time spent actively engaged in a course. Keeping the tab open in the background counts as Idle Time.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <span style={{ fontWeight: '600', color: '#166534' }}>Active Study Time:</span>
                      <span style={{ color: '#166534', fontWeight: 'bold' }}>{Math.round(productiveTime / 3600 * 10) / 10} hrs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <span style={{ fontWeight: '600', color: '#991b1b' }}>Idle Time (Tab Open):</span>
                      <span style={{ color: '#991b1b', fontWeight: 'bold' }}>{Math.round(idleTime / 3600 * 10) / 10} hrs</span>
                    </div>
                  </div>
                  <button onClick={() => setShowHoursModal(false)} style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            )}

            {showStreakModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Current Streak</h2>
                  <p style={{ color: '#64748b', marginBottom: '24px' }}>Streaks are calculated based on consecutive daily logins. Missing a full 24-hour window will reset your streak to 0.</p>
                  
                  <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '24px', color: '#ef4444', textAlign: 'center' }}>
                      {streak} Day Streak! 🔥
                    </div>
                  </div>
                  <button onClick={() => setShowStreakModal(false)} style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            )}

            {showWeeklyModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Weekly Goal Progress</h2>
                  <p style={{ color: '#64748b', marginBottom: '24px' }}>This metric compares your active study hours over the past 7 days to your preset goal of 10 hours per week.</p>
                  
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600' }}>Goal:</span>
                      <span style={{ color: '#0f172a', fontWeight: 'bold' }}>10 hours</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>Current Progress:</span>
                      <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{stats?.weekly_hours || 0} hours</span>
                    </div>
                  </div>
                  <button onClick={() => setShowWeeklyModal(false)} style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            )}

            {/* ─── Main Grid Layout ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
                
                {/* Up Next Widget (Dynamic from Planner) */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Up Next</h2>
                    <Link href="/planner" style={{ color: '#4f46e5', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>View All</Link>
                  </div>
                  
                  {upcomingTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                      <Icons.Calendar />
                      <p style={{ fontSize: '14px', marginTop: '12px' }}>Your schedule is clear! Enjoy your break.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {upcomingTasks.map((t, idx) => (
                        <div key={idx} className="hover-lift" style={{ flex: '1 1 250px', maxWidth: '380px', display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icons.Book />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{t.subject}</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', lineHeight: '1.3' }}>{t.topic}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{t.module}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance Chart */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Study Performance</h2>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                      {VIEW_OPTIONS.map(v => (
                        <button
                          key={v.key}
                          onClick={() => setViewMode(v.key)}
                          style={{
                            background: viewMode === v.key ? '#fff' : 'transparent',
                            color: viewMode === v.key ? '#0f172a' : '#64748b',
                            border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === v.key ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1, width: '100%', minHeight: '250px', position: 'relative' }}>
                    {chartLoading ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '20px' }}>
                        {[80, 140, 100, 180, 120, 200, 160].map((h, i) => <Skeleton key={i} h={h} w="10%" radius={8} />)}
                      </div>
                    ) : (
                      <>
                        <canvas ref={chartRef} />
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column / Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Continue Learning Widget */}
                {continueCourse && (
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '24px', padding: '32px', color: '#fff', boxShadow: '0 12px 40px rgba(15,23,42,0.30), 0 4px 12px rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '16px' }}>
                      Continue Learning
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                      {continueCourse.course_title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.9, marginBottom: '24px' }}>
                      <Icons.Play /> Resume next lecture
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        <span>Overall Progress</span>
                        <span>{continueCourse.progress}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${continueCourse.progress}%`, height: '100%', background: '#fff', borderRadius: '3px' }} />
                      </div>
                    </div>
                    <Link href={`/learn/${continueCourse.category || 'TIU-UCS-T214'}`} style={{ display: 'block', width: '100%', padding: '14px', background: '#fff', color: '#2563eb', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      Jump Back In
                    </Link>
                  </div>
                )}

                {/* AI Learning Insights Widget */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#4f46e5' }}><Icons.Flame /></span> AI Insights
                    </h2>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                      {aiInsight}
                    </p>
                  </div>
                </div>

                {/* Weekly Goal Widget */}
                <div 
                  className="hover-lift"
                  onClick={() => setShowWeeklyModal(true)}
                  style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(99,102,241,0.15)', cursor: 'pointer' }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0' }}>Weekly Goal</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray={`${Math.min(((stats?.weekly_hours || 0) / 10) * 100, 100)}, 100`} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{Math.min(Math.round(((stats?.weekly_hours || 0) / 10) * 100), 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{stats?.weekly_hours || 0} / 10</div>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Hours studied</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '20px 0 0 0', lineHeight: '1.4' }}>
                    {((stats?.weekly_hours || 0) >= 10) ? "Amazing! You've crushed your weekly goal!" : "Keep pushing! You're almost there."}
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
