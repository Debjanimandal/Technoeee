'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import {
  getDailyStudyData,
  getWeeklyStudyData,
  getMonthlyStudyData,
  getLearningStats,
  getActiveDates,
  formatStudyTime,
  calcStreak,
  buildChartConfig,
} from '@/lib/studyService';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

// ─── Constants ───────────────────────────────────────────────────────────────
const CARD_COLORS = ['#9AC4FF', '#DEC4FF', '#FFEDCB', '#C4F0C4', '#FFD6D6'];
const BOOKMARKED = {
  'UI/UX Designing for beginners': [
    { title: 'Color Psychology One shot', author: 'By Peter' },
    { title: 'Typography One shot', author: 'By Mitty' },
    { title: 'Graphics Design Basics', author: 'By Mitty' },
  ],
  'HTML & CSS for beginners': [
    { title: 'HTML Tags One shot', author: 'By Mitty' },
    { title: 'HTML One shot', author: 'By Mitty' },
  ],
};
const VIEW_OPTIONS = [
  { key: 'daily',   label: 'Daily',   days: 7  },
  { key: 'weekly',  label: 'Weekly',  weeks: 8 },
  { key: 'monthly', label: 'Monthly', months: 6 },
];

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, loading, color = '#0000FF' }) {
  return (
    <div style={{
      flex: '1 1 130px', background: '#fff', border: '1px solid #e8e8e8',
      borderRadius: '10px', padding: '14px 16px',
      borderTop: `3px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
      {loading
        ? <Skeleton h={22} w="60%" />
        : <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
      }
      {sub && !loading && <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '50px 20px', textAlign: 'center',
      background: '#fff', border: '1px solid #e0e0e0',
      borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', lineHeight: 1 }}>📚</div>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>
        No Course Enrollment Yet
      </h3>
      <p style={{ fontSize: '14px', color: '#888', maxWidth: '320px', lineHeight: '1.6', margin: '0 0 24px' }}>
        Enroll in your first course to start tracking your learning progress on this graph.
      </p>
      <Link href="/courses" style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, #1a2980 0%, #26d0ce 100%)',
        color: '#fff', textDecoration: 'none',
        padding: '12px 28px', borderRadius: '8px',
        fontWeight: '700', fontSize: '14px',
        boxShadow: '0 6px 18px rgba(26,41,128,0.25)',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Browse Courses
      </Link>
    </div>
  );
}

// ─── Custom Tooltip Builder ───────────────────────────────────────────────────
function buildExternalTooltip(tooltipMapRef) {
  return function ({ chart, tooltip }) {
    let el = chart.canvas.parentNode.querySelector('#dash-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dash-tooltip';
      Object.assign(el.style, {
        position: 'absolute', pointerEvents: 'none', zIndex: '50',
        background: '#1a1a2e', color: '#fff', borderRadius: '12px',
        padding: '14px 18px', minWidth: '200px',
        fontFamily: "'Poppins', sans-serif", fontSize: '13px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        transition: 'opacity 0.15s ease',
        opacity: '0',
      });
      chart.canvas.parentNode.style.position = 'relative';
      chart.canvas.parentNode.appendChild(el);
    }

    if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }

    const label = tooltip.dataPoints?.[0]?.label;
    const entry = tooltipMapRef.current?.[label];
    const totalMins = entry?.totalMinutes || 0;
    const courses = entry?.courses || [];

    let html = `<div style="font-weight:800;font-size:14px;margin-bottom:10px;color:#fff">${label}</div>`;
    html += `<div style="font-size:11px;color:#aaa;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Study Time</div>`;
    html += `<div style="font-weight:800;font-size:18px;color:#3a8aff;margin-bottom:12px">${formatStudyTime(totalMins)}</div>`;

    if (courses.length > 0) {
      html += `<div style="font-size:11px;color:#aaa;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Courses Studied</div>`;
      courses.forEach(c => {
        html += `<div style="margin:5px 0;font-size:12px;display:flex;justify-content:space-between;gap:16px">
          <span style="color:#d0d0d0">• ${c.course}</span>
          <span style="font-weight:700;color:#fff;white-space:nowrap">${formatStudyTime(c.minutes)}</span>
        </div>`;
      });
    } else {
      html += `<div style="font-size:12px;color:#666;font-style:italic">No study sessions yet</div>`;
    }

    el.innerHTML = html;

    const canvasRect = chart.canvas.getBoundingClientRect();
    const parentRect = chart.canvas.parentNode.getBoundingClientRect();
    const x = tooltip.caretX;
    const y = tooltip.caretY;

    el.style.left = `${x + 15}px`;
    el.style.top = `${Math.max(0, y - 20)}px`;
    el.style.opacity = '1';
  };
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  // Enrollment state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Analytics state
  const [viewMode, setViewMode] = useState('daily');
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Chart refs
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const tooltipMapRef = useRef({});

  // ── Load enrollments ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setCoursesLoading(false); return; }
    (async () => {
      setCoursesLoading(true);
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      // Deduplicate — keep first record per course_title
      const seen = new Set();
      const deduped = (data || []).filter(e => {
        const key = e.course_title?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCourses(deduped);
      setCoursesLoading(false);
    })();
  }, [user]);

  // ── Load analytics stats ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setAnalyticsLoading(false); return; }
    (async () => {
      const [statsData, dates] = await Promise.all([
        getLearningStats(user.id),
        getActiveDates(user.id),
      ]);
      setStats(statsData);
      setStreak(calcStreak(dates));
    })();
  }, [user]);

  // ── Load chart data on view change ────────────────────────────────────────
  const loadChartData = useCallback(async () => {
    if (!user) return;
    setAnalyticsLoading(true);
    let data = [];
    if (viewMode === 'daily')   data = await getDailyStudyData(user.id, 7);
    if (viewMode === 'weekly')  data = await getWeeklyStudyData(user.id, 8);
    if (viewMode === 'monthly') data = await getMonthlyStudyData(user.id, 6);
    setChartData(data);
    setAnalyticsLoading(false);
  }, [user, viewMode]);

  useEffect(() => { loadChartData(); }, [loadChartData]);

  // ── Build / rebuild chart when data changes ───────────────────────────────
  useEffect(() => {
    if (!chartRef.current || analyticsLoading) return;

    const { labels, datasets, tooltipMap } = buildChartConfig(chartData);
    tooltipMapRef.current = tooltipMap;

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, color: '#888' },
          },
          y: {
            beginAtZero: true,
            grid: { display: false },
            ticks: {
              font: { family: "'Poppins', sans-serif", size: 11 },
              color: '#888',
              callback: v => v === 0 ? '0' : `${v}h`,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: buildExternalTooltip(tooltipMapRef),
          },
        },
      },
    });

    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, [chartData, analyticsLoading]);

  // ── Render ────────────────────────────────────────────────────────────────
  const hasEnrollments = courses.length > 0;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#f5f5f5' }}>
          <DashboardHeader />
          <div style={{ marginBottom: '20px' }}><h1>My Courses</h1></div>

          {/* ── Course Cards ── */}
          {coursesLoading ? (
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              {[1,2,3].map(i => <div key={i} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#f0f0f0', height: '110px' }}><Skeleton h={14} w="50%" /><div style={{marginTop:10}}><Skeleton h={6} /></div></div>)}
            </div>
          ) : !user ? (
            <div style={{ padding: '20px', color: '#888', fontSize: '14px' }}>Please sign in to see your courses.</div>
          ) : courses.length === 0 ? (
            <div style={{ padding: '20px', color: '#888', fontSize: '14px', background: '#fff', borderRadius: '12px', border: '1px dashed #ccc', textAlign: 'center', marginBottom: '20px' }}>
              No courses enrolled yet.{' '}
              <Link href="/courses" style={{ color: '#0000FF', fontWeight: '600' }}>Browse Courses →</Link>
            </div>
          ) : (
            <div className="dash-courses-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {courses.map((c, i) => (
                <div key={c.id} style={{
                  flex: '1 1 200px', padding: '15px', border: '1px solid #000',
                  borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  backgroundColor: CARD_COLORS[i % CARD_COLORS.length],
                }}>
                  {c.category && (
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', border: '1px solid #000', borderRadius: '5px', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
                      {c.category}
                    </div>
                  )}
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{c.course_title}</h3>
                  <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', marginBottom: '10px' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, backgroundColor: '#000', borderRadius: '3px' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#311919', marginBottom: '10px' }}>{c.progress}% complete</p>
                  <span style={{
                    display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                    background: c.status === 'Completed' ? '#d1fae5' : c.status === 'Upcoming' ? '#fef3c7' : '#dbeafe',
                    color:      c.status === 'Completed' ? '#065f46' : c.status === 'Upcoming' ? '#92400e' : '#1e40af',
                  }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Bottom Row ── */}
          <div className="dash-bottom-row" style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>

              {/* ── Course Performance Card ── */}
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>COURSE PERFORMANCE</h2>

                  {/* View Toggle */}
                  {hasEnrollments && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {VIEW_OPTIONS.map(v => (
                        <button
                          key={v.key}
                          onClick={() => setViewMode(v.key)}
                          style={{
                            padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: '600',
                            transition: 'all 0.2s',
                            background: viewMode === v.key ? '#0000FF' : '#f0f0f0',
                            color:      viewMode === v.key ? '#fff'    : '#666',
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats Cards Row */}
                {hasEnrollments && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <StatCard label="Today" value={formatStudyTime(stats?.today_minutes || 0)} loading={analyticsLoading} color="#0000FF" />
                    <StatCard label="This Week" value={`${stats?.weekly_hours || 0}h`} loading={analyticsLoading} color="#800080" />
                    <StatCard label="Total Hours" value={`${stats?.total_hours || 0}h`} loading={analyticsLoading} color="#FFA500" />
                    <StatCard label="Streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} sub="consecutive" loading={analyticsLoading} color="#10b981" />
                  </div>
                )}

                {/* Graph or Empty State */}
                {!hasEnrollments && !coursesLoading ? (
                  <EmptyState />
                ) : analyticsLoading ? (
                  <div style={{ width: '100%', height: '200px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'flex-end', padding: '10px 0' }}>
                    {[60,90,70,110,80,130,100].map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '8px' }}>
                        <Skeleton h={h} w="12%" radius={4} />
                      </div>
                    ))}
                    <Skeleton h={1} w="100%" radius={0} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                    <canvas ref={chartRef} />
                    {/* No-sessions hint */}
                    {chartData.every(d => d.totalMinutes === 0) && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                      }}>
                        <p style={{ fontSize: '13px', color: '#bbb', fontStyle: 'italic' }}>
                          Start studying to see your progress here!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Assignment Pending ── */}
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>ASSIGNMENT PENDING</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {['Design an Educational Website', 'Design a Medical Website', 'Develop a basic Website using only HTML'].map(a => (
                    <li key={a} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0', fontSize: '14px' }}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Bookmarked Sessions ── */}
            <div className="dash-bookmarks" style={{ width: '250px', backgroundColor: '#FFEDCB', border: '1px solid #000', borderRadius: '8px', padding: '15px', boxShadow: '1px 1px 4px 0px rgba(0,0,0,0.25)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Image src="/image/bookmark.jpg" alt="bookmark" width={16} height={16} unoptimized />
                Bookmarked Sessions
              </h2>
              {Object.entries(BOOKMARKED).map(([course, lessons]) => (
                <div key={course} style={{ marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{course}</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {lessons.map(l => (
                      <li key={l.title} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', fontSize: '12px' }}>
                        <Image src="/image/Frame 1618873211.jpg" alt="lesson" width={40} height={40} unoptimized style={{ borderRadius: '5px' }} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{l.title}</div>
                          <div style={{ color: '#666' }}>{l.author}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
