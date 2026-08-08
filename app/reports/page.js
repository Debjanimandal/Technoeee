'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Chart, BarController, BarElement,
  LinearScale, CategoryScale, DoughnutController, ArcElement, 
  Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement
} from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useAuth } from '@/lib/auth-context';
import { getLearningStats, getDailyStudyData, getCourseStudyTime, formatStudyTime, getAdvancedAnalytics } from '@/lib/studyService';
import { Target, Clock, Zap, TrendingUp, BarChart3, PieChart, Heart, Compass, CalendarCheck } from 'lucide-react';

Chart.register(
  BarController, BarElement,
  LinearScale, CategoryScale, DoughnutController, ArcElement, 
  Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement
);

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

function EngagementCard({ title, value, subtext, icon: Icon, color, percent, loading }) {
  return (
    <div className="hover-lift" style={{
      background: '#fff', borderRadius: '24px', padding: '24px',
      border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
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

  // Chart refs
  const activityRef = useRef(null); const activityInst = useRef(null);
  const donutRef    = useRef(null); const donutInst    = useRef(null);
  const radarRef    = useRef(null); const radarInst    = useRef(null);

  // Data
  const [stats,          setStats]          = useState(null);
  const [weeklyData,     setWeeklyData]     = useState([]);
  const [courseTime,     setCourseTime]     = useState({});
  const [advanced,       setAdvanced]       = useState(null);
  const [loading,        setLoading]        = useState(true);

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const [statsData, weekly, ctData, adv] = await Promise.all([
        getLearningStats(user.id),
        getDailyStudyData(user.id, 7),
        getCourseStudyTime(user.id),
        getAdvancedAnalytics(user.id, 30)
      ]);

      setStats(statsData);
      setWeeklyData(weekly);
      setCourseTime(ctData);
      setAdvanced(adv);
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
            
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                My Analytics 📊
              </h1>
              <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
                Deep insights into your learning habits and schedule efficiency.
              </p>
            </div>

            {/* ── Top Row: Engagement Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <EngagementCard title="Daily Consistency" value={`${Math.round(dailyMinutes)}m`} subtext="Progress towards 60m goal" icon={Target} color="#10b981" percent={dailyConsistency} loading={loading} />
              <EngagementCard title="Weekly Consistency" value={`${weeklyHours}h`} subtext="Progress towards 10h goal" icon={CalendarCheck} color="#8b5cf6" percent={weeklyConsistency} loading={loading} />
              <EngagementCard title="Deep Focus Mode" value={formatStudyTime(longestSession)} subtext="Longest single session" icon={Zap} color="#f59e0b" loading={loading} />
              <EngagementCard title="Total Study Days" value={stats?.active_days ?? 0} subtext="Days active all-time" icon={TrendingUp} color="#3b82f6" loading={loading} />
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
                ) : weeklyData.every(d => d.totalHours === 0) ? (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No activity data for this week.</div>
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
                ) : Object.keys(courseTime).length === 0 ? (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>No course time logged yet.</div>
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
                          color: a.label.includes('Loved') ? '#e11d48' : a.label.includes('Consistent') ? '#b45309' : '#64748b'
                        }}>
                          {a.label}
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
                ) : advanced?.affinity?.length < 3 ? (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                    Complete sessions in at least 3 distinct courses to unlock radar mapping.
                  </div>
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
                        {advanced.peakTime === 'Morning' ? '🌅 Morning' : advanced.peakTime === 'Afternoon' ? '☀️ Afternoon' : advanced.peakTime === 'Evening' ? '🌇 Evening' : advanced.peakTime === 'Night' ? '🌙 Night' : 'N/A'}
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
