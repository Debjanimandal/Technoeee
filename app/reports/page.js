'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, BarController, BarElement,
  DoughnutController, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { getLearningStats, getDailyStudyData, getCourseStudyTime, formatStudyTime } from '@/lib/studyService';

Chart.register(
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, BarController, BarElement,
  DoughnutController, ArcElement, Tooltip, Legend, Filler
);

// ── Helper ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#0000FF' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px',
      padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: `${color}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '22px', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>{value}</p>
        {sub && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#aaa' }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

function Skeleton({ h = 20, w = '100%', radius = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius,
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user, profile } = useAuth();

  // Chart refs
  const trendRef   = useRef(null); const trendInst   = useRef(null);
  const courseRef  = useRef(null); const courseInst  = useRef(null);
  const donutRef   = useRef(null); const donutInst   = useRef(null);

  // Data
  const [stats,          setStats]          = useState(null);
  const [weeklyData,     setWeeklyData]     = useState([]);
  const [monthlyData,    setMonthlyData]    = useState([]);
  const [courseTime,     setCourseTime]     = useState({});
  const [enrollments,    setEnrollments]    = useState([]);
  const [plannedStats,   setPlannedStats]   = useState({ total: 0, done: 0 });
  const [loading,        setLoading]        = useState(true);

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const [statsData, weekly, monthly, ctData, enrRes, planRes] = await Promise.all([
        getLearningStats(user.id),
        getDailyStudyData(user.id, 7),
        getDailyStudyData(user.id, 30),
        getCourseStudyTime(user.id),
        supabase.from('enrollments').select('*').eq('user_id', user.id),
        supabase.from('planned_sessions').select('id, is_completed').eq('user_id', user.id),
      ]);

      // Deduplicate enrollments
      const seen = new Set();
      const deduped = (enrRes.data || []).filter(e => {
        const k = e.course_title?.toLowerCase().trim();
        if (seen.has(k)) return false; seen.add(k); return true;
      });

      const planData = planRes.data || [];
      setStats(statsData);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setCourseTime(ctData);
      setEnrollments(deduped);
      setPlannedStats({ total: planData.length, done: planData.filter(p => p.is_completed).length });
      setLoading(false);
    })();
  }, [user]);

  // ── 30-day trend chart ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!trendRef.current || loading) return;
    if (trendInst.current) trendInst.current.destroy();

    trendInst.current = new Chart(trendRef.current, {
      type: 'line',
      data: {
        labels: monthlyData.map(d => d.label),
        datasets: [{
          label: 'Hours studied',
          data: monthlyData.map(d => parseFloat(d.totalHours.toFixed(2))),
          borderColor: '#0000FF',
          backgroundColor: 'rgba(0,0,255,0.06)',
          fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
          pointBackgroundColor: '#0000FF',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#aaa', maxTicksLimit: 10 } },
          y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 }, color: '#aaa', callback: v => `${v}h` } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} hrs` } },
        },
      },
    });
    return () => { if (trendInst.current) trendInst.current.destroy(); };
  }, [monthlyData, loading]);

  // ── Course hours bar chart ──────────────────────────────────────────────────
  useEffect(() => {
    if (!courseRef.current || loading || !Object.keys(courseTime).length) return;
    if (courseInst.current) courseInst.current.destroy();

    const sortedCourses = Object.entries(courseTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const COLORS = ['#0000FF', '#800080', '#10b981', '#f97316', '#ef4444', '#6366f1'];

    courseInst.current = new Chart(courseRef.current, {
      type: 'bar',
      data: {
        labels: sortedCourses.map(([name]) => name.split(' ').slice(0, 2).join(' ')),
        datasets: [{
          label: 'Hours',
          data: sortedCourses.map(([, h]) => parseFloat(h.toFixed(2))),
          backgroundColor: COLORS.slice(0, sortedCourses.length),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#666' } },
          y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 }, color: '#aaa', callback: v => `${v}h` } },
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} hrs studied` } } },
      },
    });
    return () => { if (courseInst.current) courseInst.current.destroy(); };
  }, [courseTime, loading]);

  // ── Planned vs Completed donut ──────────────────────────────────────────────
  useEffect(() => {
    if (!donutRef.current || loading) return;
    if (donutInst.current) donutInst.current.destroy();

    const pending = plannedStats.total - plannedStats.done;
    donutInst.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          data: [plannedStats.done, Math.max(pending, 0)],
          backgroundColor: ['#4CAF50', '#e0e0e0'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} sessions` } },
        },
      },
    });
    return () => { if (donutInst.current) donutInst.current.destroy(); };
  }, [plannedStats, loading]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalHours      = stats?.total_hours     ?? 0;
  const weeklyHours     = stats?.weekly_hours    ?? 0;
  const activeDays      = stats?.active_days     ?? 0;
  const longestSession  = stats?.longest_session_min ?? 0;
  const avgPerSession   = activeDays > 0 ? (totalHours / activeDays).toFixed(1) : 0;
  const completionRate  = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
    : 0;
  const completedSessions = plannedStats.done;
  const planCompletion    = plannedStats.total > 0
    ? Math.round((plannedStats.done / plannedStats.total) * 100)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#f5f7fa', overflowY: 'auto', height: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0 }}>Reports</h1>
            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
              {profile ? `Learning analytics for ${profile.username}` : 'Your personal learning analytics'}
            </p>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px' }}>
                  <Skeleton h={14} w="50%" />
                  <div style={{ marginTop: 10 }}><Skeleton h={28} w="70%" /></div>
                </div>
              ))
            ) : (
              <>
                <StatCard icon="⏱️" label="Total Hours Studied" value={`${totalHours}h`} sub="All time" color="#0000FF" />
                <StatCard icon="📅" label="This Week" value={`${weeklyHours}h`} sub="Last 7 days" color="#800080" />
                <StatCard icon="🔥" label="Active Study Days" value={activeDays} sub="Unique days studied" color="#f97316" />
                <StatCard icon="📊" label="Avg Completion" value={`${completionRate}%`} sub={`Across ${enrollments.length} course${enrollments.length !== 1 ? 's' : ''}`} color="#10b981" />
              </>
            )}
          </div>

          {/* ── Row 2: Secondary stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px' }}>
                  <Skeleton h={14} w="50%" />
                  <div style={{ marginTop: 10 }}><Skeleton h={28} w="70%" /></div>
                </div>
              ))
            ) : (
              <>
                <StatCard icon="📚" label="Enrolled Courses" value={enrollments.length} sub="Active enrollments" color="#6366f1" />
                <StatCard icon="✅" label="Sessions Completed" value={completedSessions} sub={`${planCompletion}% of plan`} color="#4CAF50" />
                <StatCard icon="⚡" label="Longest Session" value={formatStudyTime(longestSession)} sub="Single session record" color="#ef4444" />
                <StatCard icon="🎯" label="Avg Per Active Day" value={`${avgPerSession}h`} sub="Consistency metric" color="#14b8a6" />
              </>
            )}
          </div>

          {/* ── Charts Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* 30-day trend */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <SectionTitle title="30-Day Study Trend" sub="Hours studied per day over the last month" />
              {loading ? (
                <Skeleton h={220} />
              ) : monthlyData.every(d => d.totalHours === 0) ? (
                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', border: '1px dashed #e0e0e0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📈</div>
                  <p style={{ fontWeight: '600', margin: 0 }}>No study data yet</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Start a study session to see your trend</p>
                </div>
              ) : (
                <div style={{ height: '220px', position: 'relative' }}>
                  <canvas ref={trendRef} />
                </div>
              )}
            </div>

            {/* Planned vs Completed donut */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <SectionTitle title="Schedule Completion" sub="Planned vs completed sessions" />
              {loading ? (
                <Skeleton h={220} />
              ) : plannedStats.total === 0 ? (
                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', border: '1px dashed #e0e0e0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🗓️</div>
                  <p style={{ fontWeight: '600', margin: 0 }}>No sessions planned</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Visit Study Planner to get started</p>
                </div>
              ) : (
                <>
                  <div style={{ height: '160px', position: 'relative' }}>
                    <canvas ref={donutRef} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#4CAF50' }}>{planCompletion}%</span>
                    <p style={{ fontSize: '11px', color: '#aaa', margin: '2px 0 0' }}>plan completion rate</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Course Hours Bar ── */}
          {!loading && Object.keys(courseTime).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
              <SectionTitle title="Study Hours by Course" sub="How your time is distributed across courses" />
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas ref={courseRef} />
              </div>
            </div>
          )}

          {/* ── Course Progress Table ── */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <SectionTitle title="Course-by-Course Breakdown" sub="Progress and time for each enrolled course" />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <Skeleton key={i} h={56} />)}
              </div>
            ) : enrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
                <p style={{ fontWeight: '600', margin: 0 }}>No enrollments yet</p>
                <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Head to Courses to start learning</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {enrollments.map(e => {
                  const hours = parseFloat((courseTime[e.course_title] || 0).toFixed(1));
                  const progress = e.progress || 0;
                  return (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '14px 16px', background: '#fafafa',
                      borderRadius: '10px', border: '1px solid #f0f0f0',
                    }}>
                      {/* Status dot */}
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                        background: progress >= 100 ? '#4CAF50' : progress > 0 ? '#0000FF' : '#e0e0e0',
                      }} />

                      {/* Course name + code */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {e.course_title}
                        </p>
                        {e.category && (
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{e.category}</p>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '160px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#888' }}>
                          <span>Progress</span><span style={{ fontWeight: '700', color: '#333' }}>{progress}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#e8e8e8', borderRadius: '3px' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#4CAF50' : '#0000FF', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>

                      {/* Study hours */}
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '16px', color: '#1a1a1a' }}>{hours}h</p>
                        <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>studied</p>
                      </div>

                      {/* Status badge */}
                      <div style={{
                        flexShrink: 0, fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '3px 10px',
                        background: e.status === 'Completed' ? '#d1fae5' : e.status === 'Upcoming' ? '#fef3c7' : '#dbeafe',
                        color:      e.status === 'Completed' ? '#065f46' : e.status === 'Upcoming' ? '#92400e' : '#1e40af',
                      }}>
                        {e.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
