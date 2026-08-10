'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart, BarController, BarElement,
  LinearScale, CategoryScale, DoughnutController, ArcElement, 
  Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement
} from 'chart.js';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { getLearningStats, getDailyStudyData, getCourseStudyTime, formatStudyTime, getAdvancedAnalytics } from '@/lib/services/studyService';
import { Target, Clock, Zap, TrendingUp, BarChart3, PieChart, Heart, Compass, CalendarCheck, TrendingDown, Award, BookOpen, Star, Flame } from 'lucide-react';

Chart.register(
  BarController, BarElement,
  LinearScale, CategoryScale, DoughnutController, ArcElement, 
  Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement
);

// ─── Mock Data for Demo (zero DB impact) ────────────────────────────────────────────────
const MOCK_WEEKLY_DATA = [
  { label: 'Mon', totalHours: 1.5 },
  { label: 'Tue', totalHours: 2.2 },
  { label: 'Wed', totalHours: 0.8 },
  { label: 'Thu', totalHours: 3.0 },
  { label: 'Fri', totalHours: 2.5 },
  { label: 'Sat', totalHours: 0.5 },
  { label: 'Sun', totalHours: 1.8 },
];
const MOCK_COURSE_TIME = {
  'Machine Learning': 8.5,
  'Database Management System': 6.2,
  'Computer Networks': 4.8,
  'Artificial Intelligence': 3.5,
  'Design and Analysis of Algorithm': 2.1,
};
const MOCK_ADVANCED = {
  peakTime: 'Evening',
  weekendRatio: { weekday: 72, weekend: 28 },
  affinity: [
    { title: 'Machine Learning',               count: 12, hours: 8.5,  label: 'Loved' },
    { title: 'Database Management System',      count: 8,  hours: 6.2,  label: 'Consistent' },
    { title: 'Computer Networks',               count: 5,  hours: 4.8,  label: 'Consistent' },
    { title: 'Artificial Intelligence',         count: 3,  hours: 3.5,  label: 'Occasional' },
    { title: 'Design and Analysis of Algorithm', count: 2,  hours: 2.1,  label: 'Occasional' },
  ],
};
const MOCK_STATS = {
  today_minutes: 45,
  weekly_hours: 12.3,
  longest_session_min: 110,
  active_days: 14,
};
const MOCK_ENROLLMENTS = [
  { course_title: 'Machine Learning',               progress: 65 },
  { course_title: 'Database Management System',      progress: 40 },
  { course_title: 'Computer Networks',               progress: 55 },
  { course_title: 'Artificial Intelligence',         progress: 30 },
];

// ── Components ──────────────────────────────────────────────────────────────
function Skeleton({ h = 20, w = '100%', radius = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function EngagementCard({ title, value, subtext, icon: Icon, color, percent, loading, onClick }) {
  return (
    <div className="hover-lift" onClick={onClick} style={{
      background: '#fff', borderRadius: '24px', padding: '24px',
      border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      cursor: onClick ? 'pointer' : 'default'
    }}>
      {loading ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
             <Skeleton w="50%" h={20} /><Skeleton w="40px" h={40} radius="12px" />
          </div>
          <Skeleton w="70%" h={40} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>{title}</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', lineHeight: '1' }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', fontWeight: '600' }}>{subtext}</div>
            </div>
            {percent !== undefined && (
              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${percent}, 100`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>
                  {percent}%
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Chart refs
  const activityRef = useRef(null); const activityInst = useRef(null);
  const donutRef    = useRef(null); const donutInst    = useRef(null);
  const radarRef    = useRef(null); const radarInst    = useRef(null);

  // Data
  const [stats,          setStats]          = useState(null);
  const [weeklyData,     setWeeklyData]     = useState([]);
  const [courseTime,     setCourseTime]     = useState({});
  const [advanced,       setAdvanced]       = useState(null);
  const [enrollments,    setEnrollments]    = useState([]);
  const [loading,        setLoading]        = useState(true);

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const [statsData, weekly, ctData, adv, enr] = await Promise.all([
        getLearningStats(user.id),
        getDailyStudyData(user.id, 7),
        getCourseStudyTime(user.id),
        getAdvancedAnalytics(user.id, 30),
        supabase.from('enrollments').select('*').eq('user_id', user.id)
      ]);

      // Fall back to mock data when real data is absent (demo-safe)
      const realWeekly = weekly || [];
      const noRealActivity  = realWeekly.every(d => !d.totalHours || d.totalHours === 0);
      const noRealCourseTime = !ctData || Object.keys(ctData).length === 0;
      const noRealAdvanced  = !adv || adv.peakTime === 'N/A';
      // RPC returns a zero-filled object even when no sessions exist — check all key fields
      const noRealStats = !statsData
        || ((statsData.total_hours || 0) === 0
         && (statsData.today_minutes || 0) === 0
         && (statsData.weekly_hours || 0) === 0
         && (statsData.active_days || 0) === 0);

      const realEnrollments = enr.data || [];
      // Use mock enrollments when DB has none OR all have zero progress (no real learning yet)
      const noRealEnrollments = realEnrollments.length === 0
        || realEnrollments.every(e => !e.progress || e.progress === 0);

      setStats(noRealStats ? MOCK_STATS : statsData);
      setWeeklyData(noRealActivity ? MOCK_WEEKLY_DATA : realWeekly);
      setCourseTime(noRealCourseTime ? MOCK_COURSE_TIME : ctData);
      setAdvanced(noRealAdvanced ? MOCK_ADVANCED : adv);
      setEnrollments(noRealEnrollments ? MOCK_ENROLLMENTS : realEnrollments);
      setLoading(false);
    })();
  }, [user]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const dailyMinutes    = stats?.today_minutes   ?? 0;
  const weeklyHours     = stats?.weekly_hours    ?? 0;
  const longestSession  = stats?.longest_session_min ?? 0;
  
  // Consistency calculation (Goals: 60m/day, 10h/week)
  const dailyConsistency  = Math.min(Math.round((dailyMinutes / 60) * 100), 100);
  const weeklyConsistency = Math.min(Math.round((weeklyHours / 10) * 100), 100);

  // Unique enrollments (deduplicated by course title)
  const uniqueEnrollments = useMemo(() => {
    return enrollments.filter((e, i, a) => a.findIndex(x => x.course_title === e.course_title) === i);
  }, [enrollments]);

  // Weak courses calculation
  const weakCoursesCount = useMemo(() => {
    if (!uniqueEnrollments.length) return 0;
    const maxH = Math.max(...Object.values(courseTime), 0.001);
    const scored = uniqueEnrollments.map(e => {
      const hours = courseTime[e.course_title] || 0;
      const studyScore = (hours / maxH) * 100;
      const progress   = e.progress || 0;
      return Math.round(progress * 0.6 + studyScore * 0.4);
    });
    return scored.filter(c => c < 50).length;
  }, [uniqueEnrollments, courseTime]);

  // Achievements calculation
  const achievementsEarned = (uniqueEnrollments.length >= 5 ? 1 : 0) + (Object.values(courseTime).reduce((a,b)=>a+b,0) > 10 ? 1 : 0);

  // Average Progress
  const avgProgress = useMemo(() => {
    if (!uniqueEnrollments.length) return 0;
    const total = uniqueEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    return Math.round(total / uniqueEnrollments.length);
  }, [uniqueEnrollments]);

  // Top Subject
  const topSubject = useMemo(() => {
    if (advanced?.affinity?.length > 0) return advanced.affinity[0].title;
    if (uniqueEnrollments.length > 0) return uniqueEnrollments[0].course_title;
    return 'None';
  }, [advanced, uniqueEnrollments]);

  // ── Activity Bar Chart ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activityRef.current || loading || weeklyData.length === 0) return;
    if (activityInst.current) activityInst.current.destroy();

    activityInst.current = new Chart(activityRef.current, {
      type: 'bar',
      data: {
        labels: weeklyData.map(d => d.label),
        datasets: [{
          label: 'Hours',
          data: weeklyData.map(d => parseFloat(d.totalHours.toFixed(2))),
          backgroundColor: '#8b5cf6',
          borderRadius: 8,
          barPercentage: 0.6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", size: 12 }, color: '#94a3b8' } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { font: { family: "'Inter', sans-serif", size: 12 }, color: '#94a3b8', callback: v => `${v}h` } },
        },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8, callbacks: { label: ctx => ` ${ctx.parsed.y} hrs` } } },
      },
    });
    return () => { if (activityInst.current) activityInst.current.destroy(); };
  }, [weeklyData, loading]);

  // ── Course Distribution Doughnut ──────────────────────────────────────────
  useEffect(() => {
    if (!donutRef.current || loading || !Object.keys(courseTime).length) return;
    if (donutInst.current) donutInst.current.destroy();

    const sortedCourses = Object.entries(courseTime).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedCourses.length === 0) return;

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    donutInst.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: sortedCourses.map(([name]) => name),
        datasets: [{
          data: sortedCourses.map(([, h]) => parseFloat(h.toFixed(2))),
          backgroundColor: COLORS.slice(0, sortedCourses.length),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: {
          legend: { position: 'right', labels: { font: { family: "'Inter', sans-serif", size: 12 }, color: '#64748b', padding: 20, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8, callbacks: { label: ctx => ` ${ctx.parsed} hrs` } },
        },
      },
    });
    return () => { if (donutInst.current) donutInst.current.destroy(); };
  }, [courseTime, loading]);

  // ── Skill Focus Radar Chart ──────────────────────────────────────────────
  useEffect(() => {
    if (!radarRef.current || loading || !advanced?.affinity?.length) return;
    if (radarInst.current) radarInst.current.destroy();

    const topAffinity = advanced.affinity.slice(0, 5);
    if (topAffinity.length < 3) return; // Radar needs at least 3 points

    radarInst.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: topAffinity.map(a => a.title.split(' ').slice(0, 2).join(' ')), // Shorten labels
        datasets: [{
          label: 'Study Sessions',
          data: topAffinity.map(a => a.count),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6366f1',
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: '#f1f5f9' },
            grid: { color: '#f1f5f9' },
            pointLabels: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748b' },
            ticks: { display: false } // Hide numbers on axis
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8, callbacks: { label: ctx => ` ${ctx.parsed.r} sessions` } }
        }
      },
    });
    return () => { if (radarInst.current) radarInst.current.destroy(); };
  }, [advanced, loading]);


  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important; }
      `}</style>
      
      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />

          <div style={{ padding: '0 32px' }}>
            
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                onClick={() => { sessionStorage.setItem('keepProfileOpen', 'true'); router.back(); }}
                style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '700', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                  My Analytics
                </h1>
                <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
                  Deep insights into your learning habits and schedule efficiency.
                </p>
              </div>
            </div>

            {/* ── Top Row: Engagement Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <EngagementCard title="Daily Consistency" value={`${Math.round(dailyMinutes)}m`} subtext="Progress towards 60m goal" icon={Target} color="#10b981" percent={dailyConsistency} loading={loading} />
              <EngagementCard title="Weekly Consistency" value={`${weeklyHours}h`} subtext="Progress towards 10h goal" icon={CalendarCheck} color="#8b5cf6" percent={weeklyConsistency} loading={loading} />
              <EngagementCard title="Needs Improvement" value={weakCoursesCount} subtext="Subjects under 50% score" icon={TrendingDown} color="#ef4444" loading={loading} />
              <EngagementCard 
                title="Achievements" 
                value={achievementsEarned} 
                subtext="View all badges ➔" 
                icon={Award} color="#f59e0b" loading={loading} 
                onClick={() => router.push('/achievements')}
              />
              <EngagementCard title="Deep Focus Mode" value={formatStudyTime(longestSession)} subtext="Longest single session" icon={Zap} color="#8b5cf6" loading={loading} />
              <EngagementCard title="Total Study Days" value={stats?.active_days ?? 0} subtext="Days active all-time" icon={TrendingUp} color="#3b82f6" loading={loading} />
              
              {/* New Dynamic Cards */}
              <EngagementCard title="Average Progress" value={`${avgProgress}%`} subtext="Across all courses" icon={BookOpen} color="#14b8a6" percent={avgProgress} loading={loading} />
              <EngagementCard title="Top Subject" value={topSubject.length > 20 ? topSubject.substring(0, 20) + '...' : topSubject} subtext="Highest affinity course" icon={Star} color="#ec4899" loading={loading} />
            </div>

            {/* ── Middle Row: Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
              
              {/* Activity Bar Chart */}
              <div className="hover-lift" style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={20} /></div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Activity Hours</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Daily time spent over the last 7 days</p>
                  </div>
                </div>
                {loading ? (
                  <Skeleton h={250} />
                ) : (
                  <div style={{ height: '250px', position: 'relative' }}>
                    <canvas ref={activityRef} />
                  </div>
                )}
              </div>

              {/* Time Distribution Doughnut */}
              <div className="hover-lift" style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PieChart size={20} /></div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Knowledge Distribution</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Where your study time is going</p>
                  </div>
                </div>
                {loading ? (
                  <Skeleton h={250} />
                ) : (
                  <div style={{ height: '250px', position: 'relative' }}>
                    <canvas ref={donutRef} />
                  </div>
                )}
              </div>

            </div>

            {/* ── Bottom Row: Deep Analytics (Course Affinity, Radar, Habits) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
              
              {/* Course Affinity Ranking */}
              <div className="hover-lift" style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={20} /></div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Course Affinity</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Subjects you love to study</p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3].map(i => <Skeleton key={i} h={50} />)}</div>
                ) : !advanced?.affinity?.length ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No affinity data yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {advanced.affinity.slice(0, 4).map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{a.count} sessions • {parseFloat(a.hours).toFixed(1)}h</span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px', flexShrink: 0,
                          background: a.label.includes('Loved') ? '#ffe4e6' : a.label.includes('Consistent') ? '#fef3c7' : '#f1f5f9',
                          color: a.label.includes('Loved') ? '#e11d48' : a.label.includes('Consistent') ? '#b45309' : '#64748b',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <span>{a.label}</span>
                          {a.label.includes('Loved') && <Heart size={14} fill="currentColor" />}
                          {a.label.includes('Consistent') && <Flame size={14} fill="currentColor" color="transparent" strokeWidth={2.5} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Focus Radar */}
              <div className="hover-lift" style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Compass size={20} /></div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Skill Focus Radar</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Shape of your learning focus</p>
                  </div>
                </div>

                {loading ? (
                  <Skeleton h={220} />
                ) : (
                  <div style={{ height: '220px', position: 'relative' }}>
                    <canvas ref={radarRef} />
                  </div>
                )}
              </div>

              {/* Learning Habits */}
              <div className="hover-lift" style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} /></div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Learning Habits</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>When you study best</p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Skeleton h={80} /><Skeleton h={80} />
                  </div>
                ) : !advanced ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No habit data yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Peak Productivity Time</h4>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                        {advanced.peakTime === 'Morning' ? 'Morning'
                          : advanced.peakTime === 'Afternoon' ? 'Afternoon'
                          : advanced.peakTime === 'Evening' ? 'Evening'
                          : advanced.peakTime === 'Night' ? 'Night'
                          : 'N/A'}
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Your most consistent focus window.</p>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Weekend vs Weekday</h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ height: '12px', background: '#3b82f6', borderRadius: '6px', width: `${advanced.weekendRatio.weekday}%` }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', width: '35px' }}>{advanced.weekendRatio.weekday}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ height: '12px', background: '#ec4899', borderRadius: '6px', width: `${advanced.weekendRatio.weekend}%` }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ec4899', width: '35px' }}>{advanced.weekendRatio.weekend}%</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
