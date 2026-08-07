'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../public/real_courses_data.json';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '10:00 AM - 12:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helper: build planned sessions from enrolled courses ─────────────────────
function buildSessionsFromEnrollments(enrollments, userId) {
  const sessions = [];
  const today = new Date();
  let dayOffset = 0;

  enrollments.forEach(enrollment => {
    const course = coursesData.find(
      c => c.course_name === enrollment.course_title ||
           c.subject_code === enrollment.category
    );
    if (!course || !course.modules) return;

    course.modules.forEach((mod, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);

      sessions.push({
        user_id:        userId,
        enrollment_id:  enrollment.id,
        course_title:   enrollment.course_title,
        module_name:    mod.title,
        topics:         mod.topics ? mod.topics.slice(0, 2).join(', ') : mod.title,
        scheduled_date: date.toISOString().split('T')[0],
        time_slot:      TIME_SLOTS[idx % TIME_SLOTS.length],
        is_completed:   false,
      });

      dayOffset += 2; // space modules 2 days apart
    });
  });

  return sessions;
}

// ─── Helper: format date as YYYY-MM-DD ───────────────────────────────────────
function toDateStr(yr, mo, day) {
  return `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const { user } = useAuth();

  // Real current date
  const now = new Date();

  // Calendar display state
  const [displayYear, setDisplayYear]   = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  // Data state
  const [enrollments, setEnrollments]       = useState([]);
  const [plannedSessions, setPlannedSessions] = useState([]);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [completing, setCompleting]         = useState(null);

  // Prevent double auto-generate
  const autoGenDone = useRef(false);

  // ── 1. Load enrollments from Supabase ─────────────────────────────────────
  useEffect(() => {
    if (!user) { setEnrollmentsLoaded(true); setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Deduplicate by course_title
      const seen = new Set();
      const deduped = (data || []).filter(e => {
        const k = e.course_title?.toLowerCase().trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setEnrollments(deduped);
      setEnrollmentsLoaded(true);
    })();
  }, [user]);

  // ── 2. Auto-generate + load sessions ─────────────────────────────────────
  useEffect(() => {
    if (!user || !enrollmentsLoaded) return;

    let cancelled = false;
    (async () => {
      setLoading(true);

      // Auto-generate planned sessions once if none exist
      if (!autoGenDone.current && enrollments.length > 0) {
        autoGenDone.current = true;

        const { data: existing } = await supabase
          .from('planned_sessions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!existing?.length) {
          const sessions = buildSessionsFromEnrollments(enrollments, user.id);
          if (sessions.length > 0) {
            const { error } = await supabase.from('planned_sessions').insert(sessions);
            if (error) console.error('[Planner] auto-generate error:', error.message);
          }
        }
      }

      // Load sessions for the displayed month
      const fromDate = toDateStr(displayYear, displayMonth, 1);
      const lastDay  = new Date(displayYear, displayMonth + 1, 0).getDate();
      const toDate   = toDateStr(displayYear, displayMonth, lastDay);

      const { data: sessions } = await supabase
        .from('planned_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', fromDate)
        .lte('scheduled_date', toDate)
        .order('scheduled_date', { ascending: true });

      if (!cancelled) {
        setPlannedSessions(sessions || []);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, enrollmentsLoaded, enrollments, displayYear, displayMonth]);

  // ── Mark session complete ─────────────────────────────────────────────────
  const handleComplete = async (sessionId) => {
    setCompleting(sessionId);
    const { error } = await supabase
      .from('planned_sessions')
      .update({ is_completed: true, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (!error) {
      setPlannedSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, is_completed: true } : s)
      );
    } else {
      console.error('[Planner] complete error:', error.message);
    }
    setCompleting(null);
  };

  // ── Month navigation ──────────────────────────────────────────────────────
  const prevMonth = () => {
    setSelectedDate(null);
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(y => y - 1); }
    else setDisplayMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDate(null);
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(y => y + 1); }
    else setDisplayMonth(m => m + 1);
  };

  // ── Calendar calculations ─────────────────────────────────────────────────
  const daysInMonth   = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startingDay   = new Date(displayYear, displayMonth, 1).getDay();
  const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
  const realToday     = now.getDate();

  // Build schedule map: { 'YYYY-MM-DD': [sessions] }
  const scheduleMap = {};
  plannedSessions.forEach(s => {
    if (!scheduleMap[s.scheduled_date]) scheduleMap[s.scheduled_date] = [];
    scheduleMap[s.scheduled_date].push(s);
  });

  // Selected date's sessions
  const selectedDateStr = selectedDate ? toDateStr(displayYear, displayMonth, selectedDate) : null;
  const selectedTasks   = selectedDateStr ? (scheduleMap[selectedDateStr] || []) : [];

  // Today's sessions count (for AI banner)
  const todayStr = now.toISOString().split('T')[0];
  const todayPendingCount = plannedSessions.filter(
    s => s.scheduled_date === todayStr && !s.is_completed
  ).length;

  // ── Build calendar cells ─────────────────────────────────────────────────
  const calendarCells = [];
  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(<div key={`e-${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDate === d;
    const isToday    = isCurrentMonth && realToday === d;
    const dateStr    = toDateStr(displayYear, displayMonth, d);
    const dayTasks   = scheduleMap[dateStr] || [];
    const hasTasks   = dayTasks.length > 0;
    const allDone    = hasTasks && dayTasks.every(s => s.is_completed);

    calendarCells.push(
      <div
        key={d}
        onClick={() => setSelectedDate(d)}
        style={{
          padding: '12px 6px',
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '12px',
          background: isSelected
            ? 'linear-gradient(135deg, #3a8aff 0%, #800080 100%)'
            : isToday ? '#f0f4ff' : '#fff',
          color: isSelected ? '#fff' : '#333',
          fontWeight: isSelected || isToday ? 'bold' : 'normal',
          border: isToday && !isSelected ? '2px solid #3a8aff' : '1px solid #eee',
          boxShadow: isSelected ? '0 10px 20px rgba(58,138,255,0.3)' : 'none',
          transition: 'all 0.2s',
          position: 'relative',
          fontSize: '14px',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f4ff'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#f0f4ff' : '#fff'; }}
      >
        {d}
        {hasTasks && (
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isSelected ? '#fff' : allDone ? '#4CAF50' : '#800080',
            position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
          }} />
        )}
      </div>
    );
  }

  const selectedDisplay = selectedDate
    ? `${MONTHS[displayMonth]} ${selectedDate}, ${displayYear}`
    : 'Select a date';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f4f7fb', minHeight: '100vh' }}>
        <DashboardHeader />

        <div style={{ padding: '0 20px 20px' }}>
          {/* Header */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>Study Planner</h1>
            <p style={{ color: '#666' }}>Your personalized schedule based on enrolled courses. Saved to your account.</p>
          </div>

          {/* AI Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
            borderRadius: '20px', padding: '30px', color: '#fff', marginBottom: '30px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 15px 30px rgba(38,208,206,0.2)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                  ✨ AI Suggestion
                </span>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Based on your progress</span>
              </div>
              {enrollments.length > 0 ? (
                <>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Time to hit the books!</h2>
                  <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                    {todayPendingCount > 0
                      ? `You have ${todayPendingCount} study session${todayPendingCount > 1 ? 's' : ''} pending today. Stay consistent!`
                      : `No pending sessions for today. Check upcoming dates on the calendar.`}
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>No enrolled courses yet</h2>
                  <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                    Head over to the Course Catalog to enroll and I'll build your custom schedule!
                  </p>
                </>
              )}
            </div>
            <button
              style={{
                background: '#fff', color: '#1a2980', border: 'none',
                padding: '14px 30px', borderRadius: '12px', fontSize: '16px',
                fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 1, transition: 'transform 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              onClick={() => window.location.href = enrollments.length > 0 ? '/my-courses' : '/courses'}
            >
              {enrollments.length > 0 ? 'My Courses ➔' : 'Browse Courses ➔'}
            </button>
          </div>

          {/* Calendar + Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

            {/* ── Calendar ── */}
            <div style={{
              background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
            }}>
              {/* Month nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>Working Calendar</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', color: '#3a8aff' }}>
                  <button
                    onClick={prevMonth}
                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#3a8aff', fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#3a8aff'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#3a8aff'; }}
                  >←</button>
                  <span style={{ minWidth: '150px', textAlign: 'center', fontSize: '15px' }}>{MONTHS[displayMonth]} {displayYear}</span>
                  <button
                    onClick={nextMonth}
                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#3a8aff', fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#3a8aff'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#3a8aff'; }}
                  >→</button>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {WEEKDAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#aaa' }}>{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {calendarCells}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '11px', color: '#888', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#800080', display: 'inline-block' }} />
                  Session Pending
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                  All Completed
                </span>
              </div>
            </div>

            {/* ── Daily Schedule ── */}
            <div style={{
              background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
              display: 'flex', flexDirection: 'column', minHeight: '400px',
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📅</span> {selectedDisplay}
              </h3>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  /* Skeleton */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[1,2].map(i => (
                      <div key={i} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #e0e0e0' }}>
                        <div style={{ height: '10px', width: '40%', background: '#e8e8e8', borderRadius: '4px', marginBottom: '10px' }} />
                        <div style={{ height: '16px', width: '70%', background: '#e8e8e8', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ height: '10px', width: '90%', background: '#e8e8e8', borderRadius: '4px' }} />
                      </div>
                    ))}
                  </div>

                ) : !selectedDate ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📅</div>
                    <p style={{ fontWeight: '600' }}>Select a date</p>
                    <p style={{ fontSize: '13px' }}>Click any date to view scheduled sessions.</p>
                  </div>

                ) : selectedTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>☕</div>
                    <p style={{ fontWeight: '600' }}>No sessions scheduled</p>
                    <p style={{ fontSize: '13px' }}>Take a break or review past materials!</p>
                  </div>

                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {selectedTasks.map(task => (
                      <div key={task.id} style={{
                        background: task.is_completed ? '#f0fdf4' : '#f8f9fa',
                        padding: '20px', borderRadius: '16px',
                        borderLeft: `4px solid ${task.is_completed ? '#4CAF50' : '#3a8aff'}`,
                        position: 'relative',
                        opacity: task.is_completed ? 0.85 : 1,
                        transition: 'all 0.3s',
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: task.is_completed ? '#4CAF50' : '#3a8aff', marginBottom: '6px' }}>
                          {task.time_slot}{task.is_completed && ' · ✓ Completed'}
                        </div>
                        <h4 style={{
                          fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '5px',
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                        }}>
                          {task.course_title}
                        </h4>
                        <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginBottom: '4px' }}>
                          Module: {task.module_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', paddingRight: '50px' }}>
                          Topics: {task.topics}
                        </div>

                        {!task.is_completed && (
                          <button
                            onClick={() => handleComplete(task.id)}
                            disabled={completing === task.id}
                            title="Mark as complete"
                            style={{
                              position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                              background: '#fff', border: '2px solid #e0e0e0', borderRadius: '50%',
                              width: '36px', height: '36px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: completing === task.id ? 'wait' : 'pointer',
                              transition: 'all 0.2s', fontSize: '16px', color: '#888',
                            }}
                            onMouseOver={e => {
                              if (completing !== task.id) {
                                e.currentTarget.style.background = '#4CAF50';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.borderColor = '#4CAF50';
                              }
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = '#888';
                              e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                          >
                            {completing === task.id ? '⏳' : '✓'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
