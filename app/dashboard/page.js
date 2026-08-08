'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import coursesData from '../../public/real_courses_data.json';
import {
  getLearningStats,
  getActiveDates,
  formatStudyTime,
  calcStreak,
  getDailyStudyData,
  getWeeklyStudyData,
  getMonthlyStudyData
} from '@/lib/studyService';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

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
function StatCard({ label, value, icon: Icon, color, bgLight, loading }) {
  return (
    <div className="hover-lift" style={{
      flex: '1 1 200px', background: '#fff', borderRadius: '20px', padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
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
      setCourses(deduped);
      setCoursesLoading(false);

      // Fetch Stats
      setAnalyticsLoading(true);
      const [statsData, dates] = await Promise.all([
        getLearningStats(user.id),
        getActiveDates(user.id),
      ]);
      setStats(statsData);
      setStreak(calcStreak(dates));
      setAnalyticsLoading(false);
    })();
  }, [user]);

  // 2. Extract Upcoming Tasks from Planner Data
  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem('planner_completed') || '[]');
      setCompletedTopicsCount(completed.length);
      
      if (courses.length > 0) {
        const tasks = [];
        // Look through enrolled courses in the master JSON
        courses.forEach(enr => {
          const courseRef = coursesData.find(c => c.course_name === enr.course_title || c.subject_code === enr.category);
          if (courseRef && courseRef.modules) {
            let found = false;
            for (let mod of courseRef.modules) {
              if (found) break;
              if (mod.topics) {
                for (let topic of mod.topics) {
                  const taskId = `task-${courseRef.subject_code}-${topic}`;
                  if (!completed.includes(taskId)) {
                    tasks.push({ course: courseRef.course_name, subject: courseRef.subject_code, module: mod.title, topic });
                    found = true;
                    break;
                  }
                }
              }
            }
          }
        });
        setUpcomingTasks(tasks.slice(0, 3)); // Grab top 3
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
      insight = `It's quite late! 🌙 Studying when you're tired can hurt retention. Consider getting some sleep and tackling your tasks fresh tomorrow.`;
    } else if (streak >= 3) {
      insight = `You're on a fire ${streak}-day streak! 🔥 Consistency builds deep memory retention. Let's push it to ${streak + 1} today.`;
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
    const labels = chartData.map(d => d.label);
    const dataPoints = chartData.map(d => parseFloat(((d.totalMinutes || 0) / 60).toFixed(2))); // Convert to hours

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
        <div className="page-content" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />
          
          <div style={{ padding: '0 32px' }}>
            
            {/* ─── Welcome Banner ───────────────────────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
              borderRadius: '24px', padding: '32px', marginBottom: '32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  Welcome back, {profile?.username || user?.email?.split('@')[0] || 'Student'} 👋
                </h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Let's learn something new today!</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <Link href="/planner" className="hover-lift" style={{ background: '#fff', color: '#4f46e5', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                   View Planner
                 </Link>
                 <Link href="/courses" className="hover-lift" style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 15px rgba(79,70,229,0.3)' }}>
                   Explore Courses
                 </Link>
              </div>
            </div>

            {/* ─── Stat Cards Row ───────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <StatCard label="Courses in Progress" value={courses.length} icon={Icons.Book} color="#3b82f6" bgLight="#eff6ff" loading={coursesLoading} />
              <StatCard label="Completed Topics" value={completedTopicsCount} icon={Icons.CheckCircle} color="#10b981" bgLight="#ecfdf5" loading={analyticsLoading} />
              <StatCard label="Total Hours Spent" value={`${stats?.total_hours || 0}h`} icon={Icons.Clock} color="#f59e0b" bgLight="#fffbeb" loading={analyticsLoading} />
              <StatCard label="Current Streak" value={`${streak} Days`} icon={Icons.Flame} color="#ef4444" bgLight="#fef2f2" loading={analyticsLoading} />
            </div>

            {/* ─── Main Grid Layout ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'stretch' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
                
                {/* Active Courses */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Active Courses</h2>
                  </div>

                  {coursesLoading ? (
                    <div style={{ display: 'flex', gap: '20px' }}>
                      {[1,2].map(i => <div key={i} style={{ flex: 1, height: '160px', background: '#fff', borderRadius: '20px', padding: '20px' }}><Skeleton h={20} w="70%" /><div style={{marginTop:20}}><Skeleton h={10} /></div></div>)}
                    </div>
                  ) : courses.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '2px dashed #cbd5e1' }}>
                      <p style={{ color: '#64748b', fontSize: '15px' }}>You haven't enrolled in any courses yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {courses.map((c) => (
                        <div key={c.id} className="hover-lift" style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', background: '#e0e7ff', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {c.category || 'General'}
                            </span>
                          </div>
                          <Link href="/my-courses" style={{ textDecoration: 'none' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', lineHeight: '1.4', minHeight: '44px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#4f46e5'} onMouseLeave={e => e.target.style.color = '#1e293b'}>
                              {c.course_title}
                            </h3>
                          </Link>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                              <span>Progress</span>
                              <span style={{ color: '#0f172a' }}>{c.progress}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${c.progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance Chart */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
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
                  <div style={{ flex: 1, width: '100%', minHeight: '300px', position: 'relative' }}>
                    {chartLoading ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '20px' }}>
                        {[80, 140, 100, 180, 120, 200, 160].map((h, i) => <Skeleton key={i} h={h} w="10%" radius={8} />)}
                      </div>
                    ) : (
                      <>
                        <canvas ref={chartRef} />
                        {chartData.every(d => !d.totalMinutes || d.totalMinutes === 0) && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
                            <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', color: '#64748b', fontSize: '14px', fontWeight: '600', border: '1px solid #f1f5f9' }}>
                              Start studying to see your progress here! 🚀
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column / Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
                
                {/* Continue Learning Widget */}
                {continueCourse && (
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '24px', padding: '32px', color: '#fff', boxShadow: '0 10px 30px rgba(59,130,246,0.3)' }}>
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

                {/* Up Next Widget (Dynamic from Planner) */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {upcomingTasks.map((t, idx) => (
                        <div key={idx} className="hover-lift" style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
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

                {/* AI Learning Insights Widget */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0' }}>Weekly Goal</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${Math.min(((stats?.weekly_hours || 0) / 10) * 100, 100)}, 100`} />
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
                    {((stats?.weekly_hours || 0) >= 10) ? "Amazing! You've crushed your weekly goal! 🎉" : "Keep pushing! You're almost there."}
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
