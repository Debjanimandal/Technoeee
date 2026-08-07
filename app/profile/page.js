'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, BarController, BarElement,
  Tooltip, Filler,
} from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import {
  getDailyStudyData,
  getLearningStats,
  getCourseStudyTime,
  formatStudyTime,
} from '@/lib/studyService';

Chart.register(
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, BarController, BarElement,
  Tooltip, Filler
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorten a course title for chart axis labels */
function shortName(title) {
  if (!title) return '';
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return title;
  return words.slice(0, 2).join(' ');
}

/** Deduplicate enrollments by course_title */
function dedup(arr) {
  const seen = new Set();
  return (arr || []).filter(e => {
    const key = e.course_title?.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function ChartEmpty({ message, sub }) {
  return (
    <div style={{
      width: '100%', height: '180px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', borderRadius: '8px',
      border: '1px dashed #ddd',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
      <p style={{ fontSize: '13px', color: '#888', fontWeight: '600', margin: 0 }}>{message}</p>
      {sub && <p style={{ fontSize: '11px', color: '#aaa', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ─── External tooltip for performance chart ──────────────────────────────────
function buildPerfTooltip(tooltipMapRef) {
  return function ({ chart, tooltip }) {
    let el = chart.canvas.parentNode.querySelector('#perf-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'perf-tooltip';
      Object.assign(el.style, {
        position: 'absolute', pointerEvents: 'none', zIndex: '50',
        background: '#1a1a2e', color: '#fff', borderRadius: '10px',
        padding: '12px 16px', minWidth: '180px',
        fontFamily: "'Poppins', sans-serif", fontSize: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transition: 'opacity 0.15s ease', opacity: '0',
      });
      chart.canvas.parentNode.style.position = 'relative';
      chart.canvas.parentNode.appendChild(el);
    }
    if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }

    const label = tooltip.dataPoints?.[0]?.label;
    const entry = tooltipMapRef.current?.[label];
    const totalMins = entry?.totalMinutes || 0;
    const courses = entry?.courses || [];

    let html = `<div style="font-weight:800;font-size:13px;margin-bottom:8px">${label}</div>`;
    html += `<div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Study Time</div>`;
    html += `<div style="font-weight:800;font-size:16px;color:#3a8aff;margin-bottom:10px">${formatStudyTime(totalMins)}</div>`;

    if (courses.length > 0) {
      html += `<div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Courses</div>`;
      courses.forEach(c => {
        html += `<div style="font-size:11px;display:flex;justify-content:space-between;gap:12px;margin-bottom:4px">
          <span style="color:#ccc">• ${c.course}</span>
          <span style="font-weight:700">${formatStudyTime(c.minutes)}</span>
        </div>`;
      });
    } else {
      html += `<div style="font-size:11px;color:#555;font-style:italic">No sessions yet</div>`;
    }

    el.innerHTML = html;
    el.style.left = `${tooltip.caretX + 12}px`;
    el.style.top = `${Math.max(0, tooltip.caretY - 20)}px`;
    el.style.opacity = '1';
  };
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile } = useAuth();

  // Chart canvas refs
  const perfRef    = useRef(null);
  const perfInst   = useRef(null);
  const strongRef  = useRef(null);
  const strongInst = useRef(null);
  const weakRef    = useRef(null);
  const weakInst   = useRef(null);
  const tooltipMapRef = useRef({});

  // Data state
  const [enrollments, setEnrollments]         = useState([]);
  const [modulesProgress, setModulesProgress] = useState([]);
  const [weeklyData, setWeeklyData]           = useState([]);
  const [stats, setStats]                     = useState(null);
  const [courseStudyTime, setCourseStudyTime] = useState({});

  // Loading state
  const [enrollLoading, setEnrollLoading]     = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab]             = useState('Ongoing');
  const [expandedId, setExpandedId]           = useState(null);

  // ── Load enrollments + modules ───────────────────────────────────────────
  useEffect(() => {
    if (!user) { setEnrollLoading(false); return; }
    (async () => {
      setEnrollLoading(true);
      const [enrRes, modRes] = await Promise.all([
        supabase.from('enrollments').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('modules_progress').select('*').eq('user_id', user.id),
      ]);
      setEnrollments(dedup(enrRes.data));
      setModulesProgress(modRes.data || []);
      setEnrollLoading(false);
    })();
  }, [user]);

  // ── Load analytics data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setAnalyticsLoading(false); return; }
    (async () => {
      setAnalyticsLoading(true);
      const [weekly, statsData, studyTime] = await Promise.all([
        getDailyStudyData(user.id, 7),
        getLearningStats(user.id),
        getCourseStudyTime(user.id),
      ]);
      setWeeklyData(weekly);
      setStats(statsData);
      setCourseStudyTime(studyTime);
      setAnalyticsLoading(false);
    })();
  }, [user]);

  // ── Compute strong / weak from enrollments + study time ──────────────────
  const { strongCourses, weakCourses } = useMemo(() => {
    if (enrollments.length === 0) return { strongCourses: [], weakCourses: [] };

    const maxH = Math.max(...Object.values(courseStudyTime), 0.001);
    const scored = enrollments.map(e => {
      const hours = courseStudyTime[e.course_title] || 0;
      const studyScore = (hours / maxH) * 100;
      const progress   = e.progress || 0;
      const composite  = Math.round(progress * 0.6 + studyScore * 0.4);
      return { ...e, composite };
    }).sort((a, b) => b.composite - a.composite);

    const strong = scored.filter(e => e.composite >= 50);
    const weak   = scored.filter(e => e.composite < 50);
    return { strongCourses: strong, weakCourses: weak };
  }, [enrollments, courseStudyTime]);

  // ── Build weekly performance chart ───────────────────────────────────────
  useEffect(() => {
    if (!perfRef.current || analyticsLoading) return;
    if (perfInst.current) perfInst.current.destroy();

    // Build tooltip map
    const tMap = {};
    weeklyData.forEach(d => {
      tMap[d.label] = {
        totalMinutes: d.totalMinutes,
        courses: Object.entries(d.courses)
          .map(([c, m]) => ({ course: c, minutes: m }))
          .sort((a, b) => b.minutes - a.minutes),
      };
    });
    tooltipMapRef.current = tMap;

    perfInst.current = new Chart(perfRef.current, {
      type: 'line',
      data: {
        labels: weeklyData.map(d => d.label),
        datasets: [{
          label: 'Hours',
          data: weeklyData.map(d => parseFloat(d.totalHours.toFixed(2))),
          borderColor: '#0000FF',
          backgroundColor: 'rgba(0,0,255,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#0000FF',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, color: '#888' } },
          y: { beginAtZero: true, grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, color: '#888', callback: v => `${v}h` } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false, external: buildPerfTooltip(tooltipMapRef) },
        },
      },
    });
    return () => { if (perfInst.current) perfInst.current.destroy(); };
  }, [weeklyData, analyticsLoading]);

  // ── Build Strong Foundations chart ───────────────────────────────────────
  useEffect(() => {
    if (!strongRef.current) return;
    if (strongInst.current) strongInst.current.destroy();
    if (strongCourses.length === 0) return;

    strongInst.current = new Chart(strongRef.current, {
      type: 'bar',
      data: {
        labels: strongCourses.map(e => shortName(e.course_title)),
        datasets: [{
          label: 'Performance',
          data: strongCourses.map(e => e.composite),
          backgroundColor: '#4CAF50',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 10 }, color: '#888' } },
          y: { beginAtZero: true, max: 100, grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 10 }, color: '#888' } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}% performance score` } },
        },
      },
    });
    return () => { if (strongInst.current) strongInst.current.destroy(); };
  }, [strongCourses]);

  // ── Build Needs Improvement chart ────────────────────────────────────────
  useEffect(() => {
    if (!weakRef.current) return;
    if (weakInst.current) weakInst.current.destroy();
    if (weakCourses.length === 0) return;

    weakInst.current = new Chart(weakRef.current, {
      type: 'bar',
      data: {
        labels: weakCourses.map(e => shortName(e.course_title)),
        datasets: [{
          label: 'Performance',
          data: weakCourses.map(e => e.composite),
          backgroundColor: '#FF5722',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 10 }, color: '#888' } },
          y: { beginAtZero: true, max: 100, grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 10 }, color: '#888' } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}% performance score` } },
        },
      },
    });
    return () => { if (weakInst.current) weakInst.current.destroy(); };
  }, [weakCourses]);

  // ── Derived values ────────────────────────────────────────────────────────
  const grouped = {
    Ongoing:   enrollments.filter(e => e.status === 'Ongoing'),
    Upcoming:  enrollments.filter(e => e.status === 'Upcoming'),
    Completed: enrollments.filter(e => e.status === 'Completed'),
  };
  const getModules = id => modulesProgress.filter(m => m.enrollment_id === id);
  const weeklyTotal = weeklyData.reduce((s, d) => s + (d.totalHours || 0), 0);
  const hasEnrollments = enrollments.length > 0;

  // ─── Render ────────────────────────────────────────────────────────────────
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
        <div className="page-content" style={{ backgroundColor: '#f5f5f5', overflowY: 'auto', height: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />

          <div style={{ marginBottom: '20px' }}>
            <h1>My Profile &amp; Analytics</h1>
            {profile && (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                Welcome, <strong>{profile.username}</strong>
              </p>
            )}
          </div>

          {/* ── Charts Row ── */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>

            {/* Weekly Performance */}
            <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Weekly Performance</h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Hours spent learning per day</p>

              {analyticsLoading ? (
                <div style={{ width: '100%', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
                  <Skeleton h={120} />
                </div>
              ) : !hasEnrollments ? (
                <ChartEmpty message="No study sessions yet" sub="Enroll in a course to start tracking" />
              ) : (
                <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                  <canvas ref={perfRef} />
                  {weeklyData.every(d => d.totalHours === 0) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <p style={{ fontSize: '12px', color: '#bbb', fontStyle: 'italic' }}>Start a study session to see data here</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0000FF' }}>
                {analyticsLoading
                  ? <Skeleton w="50%" h={14} />
                  : `Total: ${weeklyTotal.toFixed(1)} hrs this week`
                }
              </div>
            </div>

            {/* Strong Foundations */}
            <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Strong Foundations</h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Your top performing subjects</p>

              {analyticsLoading || enrollLoading ? (
                <Skeleton h={180} />
              ) : !hasEnrollments ? (
                <ChartEmpty message="Enroll in courses first" sub="Your top subjects will appear here" />
              ) : strongCourses.length === 0 ? (
                <ChartEmpty message="Keep studying!" sub="Reach 50%+ progress to appear here" />
              ) : (
                <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                  <canvas ref={strongRef} />
                </div>
              )}
            </div>

            {/* Needs Improvement */}
            <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Needs Improvement</h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Focus areas to boost your score</p>

              {analyticsLoading || enrollLoading ? (
                <Skeleton h={180} />
              ) : !hasEnrollments ? (
                <ChartEmpty message="Enroll in courses first" sub="Areas to improve will appear here" />
              ) : weakCourses.length === 0 ? (
                <ChartEmpty message="All subjects performing well! 🎉" sub="Nothing to improve right now" />
              ) : (
                <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                  <canvas ref={weakRef} />
                </div>
              )}
            </div>
          </div>

          {/* ── Enrolled Subjects ── */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Enrolled Subjects</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
              {['Ongoing', 'Upcoming', 'Completed'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setExpandedId(null); }} style={{
                  background: 'none', border: 'none', fontSize: '15px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  color: activeTab === tab ? '#0000FF' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #0000FF' : '2px solid transparent',
                  paddingBottom: '5px',
                }}>
                  {tab}
                  {!enrollLoading && (
                    <span style={{
                      marginLeft: '6px', fontSize: '11px', fontWeight: '700',
                      background: activeTab === tab ? '#0000FF' : '#e0e0e0',
                      color: activeTab === tab ? '#fff' : '#888',
                      borderRadius: '10px', padding: '1px 7px',
                    }}>
                      {grouped[tab].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Subject cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {enrollLoading ? (
                [1,2].map(i => (
                  <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
                    <Skeleton w="55%" h={16} />
                    <div style={{ marginTop: 12 }}><Skeleton h={8} /></div>
                  </div>
                ))
              ) : !user ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Please sign in to see your enrolled courses.</div>
              ) : grouped[activeTab].length === 0 ? (
                <div style={{
                  padding: '40px', textAlign: 'center', color: '#888',
                  background: '#fafafa', borderRadius: '8px', border: '1px dashed #e0e0e0',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {activeTab === 'Completed' ? '🏆' : activeTab === 'Upcoming' ? '🗓️' : '📖'}
                  </div>
                  <p style={{ fontWeight: '600', marginBottom: '4px' }}>No {activeTab} courses</p>
                  <p style={{ fontSize: '13px' }}>
                    {activeTab === 'Ongoing' ? 'Enroll in a course to get started.' : `No ${activeTab.toLowerCase()} courses yet.`}
                  </p>
                </div>
              ) : (
                grouped[activeTab].map(subject => {
                  const modules  = getModules(subject.id);
                  const isOpen   = expandedId === subject.id;
                  const studyH   = (courseStudyTime[subject.course_title] || 0).toFixed(1);

                  return (
                    <div key={subject.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>

                      {/* Header row */}
                      <div
                        onClick={() => setExpandedId(isOpen ? null : subject.id)}
                        style={{ padding: '15px 20px', background: '#fcfcfc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fcfcfc'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{subject.course_title}</h3>
                            {subject.category && (
                              <span style={{ fontSize: '10px', fontWeight: '700', color: '#0000FF', background: '#e8eaff', borderRadius: '4px', padding: '2px 7px' }}>
                                {subject.category}
                              </span>
                            )}
                            <span style={{
                              fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '2px 8px',
                              background: subject.status === 'Completed' ? '#d1fae5' : subject.status === 'Upcoming' ? '#fef3c7' : '#dbeafe',
                              color:      subject.status === 'Completed' ? '#065f46' : subject.status === 'Upcoming' ? '#92400e' : '#1e40af',
                            }}>
                              {subject.status}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${subject.progress || 0}%`, backgroundColor: '#0000FF', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{subject.progress || 0}%</span>
                          </div>

                          {/* Meta info */}
                          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#888' }}>
                            <span>⏱ {studyH}h studied</span>
                            <span>📅 Enrolled {new Date(subject.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {modules.length > 0 && <span>📚 {modules.length} modules</span>}
                          </div>
                        </div>

                        <div style={{ paddingLeft: '20px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded modules */}
                      {isOpen && (
                        <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', background: '#fff' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Modules</h4>
                          {modules.length === 0 ? (
                            <p style={{ color: '#aaa', fontSize: '13px' }}>No modules tracked yet. Study a lesson to see progress here.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {modules.map((mod, idx) => (
                                <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '14px', color: '#444' }}>{idx + 1}. {mod.module_name}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
                                    <div style={{ flex: 1, height: '5px', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                                      <div style={{ height: '100%', width: `${mod.progress}%`, backgroundColor: mod.progress === 100 ? '#4CAF50' : '#0000FF', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '12px', width: '40px', textAlign: 'right' }}>{mod.progress}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
