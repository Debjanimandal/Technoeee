'use client';
import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import coursesData from '../../public/data/real_courses_data.json';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import PomodoroTimer from '@/components/shared/PomodoroTimer';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Colors for tags
const TAG_COLORS = {
  Lecture: '#3a8aff',
  Quiz: '#f57c00',
  Revision: '#ab47bc',
  Assignment: '#43a047'
};

// Fixed time slots for spacing
const TIME_SLOTS = {
  Casual: ['10:00 AM - 11:30 AM', '03:00 PM - 04:30 PM'],
  Moderate: ['09:30 AM - 11:00 AM', '01:30 PM - 03:00 PM', '05:00 PM - 06:30 PM', '08:00 PM - 09:30 PM'],
  Intensive: ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '04:00 PM - 05:00 PM', '07:00 PM - 08:00 PM', '09:00 PM - 10:00 PM']
};

// Helper: Format date
function toDateStr(dateObj) {
  const yr = dateObj.getFullYear();
  const mo = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper: Hash string to color
function getCourseColor(subjectCode) {
  if (!subjectCode) return '#3a8aff';
  const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#f4511e'];
  let hash = 0;
  for (let i = 0; i < subjectCode.length; i++) hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── AI Assistant Component (Animated & Behavioral) ──────────────────────────
function ContextualAIAssistant({ dateStr, todayStr, tasks, completedTasks, overdueCount }) {
  const [state, setState] = useState('idle'); // idle, thinking, typing, done
  const [displayedText, setDisplayedText] = useState('');
  const [fullText, setFullText] = useState('');

  useEffect(() => {
    if (!dateStr || dateStr !== todayStr) {
      setState('idle');
      return;
    }
    
    // Analyze behavior
    let msg = '';
    const pending = (tasks || []).filter(t => !completedTasks.includes(t.id));
    const allDone = tasks && tasks.length > 0 && pending.length === 0;
    
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 22 || currentHour < 4;
    const isMorning = currentHour >= 5 && currentHour < 12;

    if (allDone) {
      msg = `Excellent work finishing your sessions! Do you have any lingering doubts? Ask the AI Chatbot while the concepts are still fresh.`;
      if (completedTasks.length > 10) {
        msg = `Incredible streak! You've crushed over 10 tasks recently. ` + msg;
      }
    } else if (!tasks || tasks.length === 0) {
      msg = overdueCount > 0 
        ? `You have a free day, but I noticed ${overdueCount} overdue task(s). Let's use this time to catch up and protect your streak!` 
        : `You have a clear schedule today! Enjoy your break or review past material to reinforce your memory.`;
    } else {
      if (isLateNight) {
        msg = `It's getting late! You have ${pending.length} task(s) left. Remember that sleep is crucial for memory retention, so don't push too hard.`;
      } else if (isMorning) {
        msg = `Good morning! You have ${pending.length} task(s) scheduled today. A great time to tackle the hardest one first while your energy is high.`;
      } else {
        msg = `You have ${pending.length} task(s) remaining for today. Turn on the Pomodoro timer and let's tackle them one by one!`;
      }
    }
    
    setFullText(msg);
    setState('thinking');
    setDisplayedText('');
    
    // Simulate thinking delay
    const thinkTimer = setTimeout(() => {
      setState('typing');
    }, 1500);
    
    return () => clearTimeout(thinkTimer);
  }, [dateStr, todayStr, tasks, completedTasks, overdueCount]);

  // Typewriter effect
  useEffect(() => {
    if (state === 'typing') {
      let i = 0;
      setDisplayedText('');
      const typeTimer = setInterval(() => {
        setDisplayedText(prev => prev + fullText.charAt(i));
        i++;
        if (i >= fullText.length) {
          clearInterval(typeTimer);
          setState('done');
        }
      }, 30); // 30ms per char
      return () => clearInterval(typeTimer);
    }
  }, [state, fullText]);

  if (dateStr !== todayStr) return null; // Only show for today

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
      padding: '16px 20px', borderRadius: '16px', marginBottom: '24px',
      borderLeft: '4px solid #2b5876', display: 'flex', alignItems: 'flex-start', gap: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
    }}>
      <style jsx>{`
        .dot-anim {
          display: inline-block;
          width: 6px; height: 6px; border-radius: 50%; background: #2b5876;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .cursor-blink {
          border-right: 2px solid #2b5876;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { border-color: transparent; } }
      `}</style>

      <div style={{ marginTop: '2px', color: '#2b5876' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
          <path d="M8 11h1M15 11h1"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2b5876', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          AI Assistant
        </div>
        <div style={{ fontSize: '14px', color: '#444', minHeight: '40px', lineHeight: '1.5' }}>
          {state === 'thinking' ? (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '21px' }}>
              <span className="dot-anim" style={{ animationDelay: '0s' }}></span>
              <span className="dot-anim" style={{ animationDelay: '0.2s' }}></span>
              <span className="dot-anim" style={{ animationDelay: '0.4s' }}></span>
              <span style={{ marginLeft: '4px', fontStyle: 'italic', color: '#888' }}>thinking</span>
            </div>
          ) : (
            <span>{displayedText}{state === 'typing' && <span className="cursor-blink">&nbsp;</span>}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dynamic Scheduling Engine (v2) ──────────────────────────────────────────
function generateDynamicSchedule(enrollments, pace, startDateStr, completedTasksList) {
  const scheduleMap = {};
  const coursesQueues = [];

  // 1. Build Progressive Queues for each course
  enrollments.forEach(enrollment => {
    const course = coursesData.find(
      c => c.course_name === enrollment.course_title || c.subject_code === enrollment.category
    );
    if (!course || !course.modules) return;

    let activeModuleIdx = 0;
    
    // Find the first module that isn't fully completed
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i];
      const allTopicsCompleted = mod.topics?.every(t => completedTasksList.includes(`task-${course.subject_code}-${t}`));
      if (!allTopicsCompleted) {
        activeModuleIdx = i;
        break;
      }
    }

    // Only load topics from Active Module and Active + 1 (Progressive Unlocking)
    const allowedModules = course.modules.slice(activeModuleIdx, activeModuleIdx + 2);
    const courseQueue = [];

    allowedModules.forEach((mod, modOffset) => {
      if (mod.topics) {
        mod.topics.forEach(topic => {
          const taskId = `task-${course.subject_code}-${topic}`;
          if (!completedTasksList.includes(taskId)) {
            courseQueue.push({
              id: taskId,
              course_title: course.course_name,
              subject_code: course.subject_code,
              module_name: mod.title,
              topic: topic,
              type: 'Lecture',
              course_color: getCourseColor(course.subject_code)
            });
          }
        });
        
        // Inject a Module Quiz after the module topics
        const quizId = `quiz-${course.subject_code}-${mod.title}`;
        if (!completedTasksList.includes(quizId)) {
          courseQueue.push({
            id: quizId,
            course_title: course.course_name,
            subject_code: course.subject_code,
            module_name: mod.title,
            topic: `Module ${activeModuleIdx + modOffset + 1} Assessment`,
            type: 'Quiz',
            course_color: getCourseColor(course.subject_code)
          });
        }
      }
    });

    if (courseQueue.length > 0) coursesQueues.push(courseQueue);
  });

  const tasksPerDay = TIME_SLOTS[pace].length;
  let currentDate = new Date(startDateStr);
  currentDate.setHours(0,0,0,0);
  
  // 2. Interleaved Round-Robin Scheduling
  let safety = 0;
  while (coursesQueues.some(q => q.length > 0) && safety < 365) {
    safety++;
    const dateStr = toDateStr(currentDate);
    scheduleMap[dateStr] = [];
    
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    
    // Weekend Revision Logic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      scheduleMap[dateStr].push({
        id: `rev-${dateStr}`,
        course_title: 'Weekly Consolidation',
        subject_code: 'REV',
        module_name: 'Spaced Repetition',
        topic: 'Review concepts learned this week',
        type: 'Revision',
        time_slot: '10:00 AM - 12:00 PM',
        is_completed: completedTasksList.includes(`rev-${dateStr}`),
        course_color: TAG_COLORS.Revision
      });
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Weekday Interleaved Logic
    let slotsUsed = 0;
    for (let i = 0; i < coursesQueues.length; i++) {
      if (slotsUsed >= tasksPerDay) break;
      
      const queue = coursesQueues[i];
      if (queue.length > 0) {
        const task = queue.shift(); // pop from front
        scheduleMap[dateStr].push({
          ...task,
          time_slot: TIME_SLOTS[pace][slotsUsed],
          is_completed: false
        });
        slotsUsed++;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return scheduleMap;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const { user } = useAuth();
  const now = new Date();
  const todayStr = toDateStr(now);

  // Calendar display state
  const [displayYear, setDisplayYear]   = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  // Personalization & Filters
  const [studyPace, setStudyPace] = useState('Moderate'); // Casual, Moderate, Intensive
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Data state
  const [enrollments, setEnrollments] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState([]);
  
  // Scheduling Anchor Date (for detecting overdue tasks)
  const [plannerStartDate, setPlannerStartDate] = useState(todayStr);

  // 1. Load enrollments & local state
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
      const seen = new Set();
      const deduped = (data || []).filter(e => {
        const k = e.course_title?.toLowerCase().trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setEnrollments(deduped);
      
      try {
        const savedCompleted = JSON.parse(localStorage.getItem('planner_completed') || '[]');
        setCompletedTasks(savedCompleted);
        const savedStart = localStorage.getItem('planner_start_date');
        if (savedStart) setPlannerStartDate(savedStart);
        else localStorage.setItem('planner_start_date', todayStr);
      } catch(e) {}
    })();
  }, [user]);

  // 2. Generate Schedule Dynamically
  useEffect(() => {
    if (enrollments.length > 0) {
      setLoading(true);
      const newSchedule = generateDynamicSchedule(enrollments, studyPace, plannerStartDate, completedTasks);
      setScheduleMap(newSchedule);
      setLoading(false);
    } else if (enrollments.length === 0) {
      setLoading(false);
    }
  }, [enrollments, studyPace, plannerStartDate, completedTasks]);

  // 3. Compute Overdue Tasks
  const overdueTasksCount = useMemo(() => {
    let count = 0;
    Object.keys(scheduleMap).forEach(date => {
      if (date < todayStr) {
        scheduleMap[date].forEach(task => {
          if (!task.is_completed) count++;
        });
      }
    });
    return count;
  }, [scheduleMap, todayStr]);

  // Mark task complete (locally)
  const handleComplete = (dateStr, taskId) => {
    let newCompleted = [...completedTasks];
    if (newCompleted.includes(taskId)) {
      return; // Already completed, cannot uncheck manually for now
    } else {
      newCompleted.push(taskId);
    }
    setCompletedTasks(newCompleted);
    localStorage.setItem('planner_completed', JSON.stringify(newCompleted));
  };

  // Rebalance Schedule
  const handleRebalance = () => {
    setPlannerStartDate(todayStr);
    localStorage.setItem('planner_start_date', todayStr);
  };

  // Month navigation
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

  // Calendar calculations
  const daysInMonth   = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startingDay   = new Date(displayYear, displayMonth, 1).getDay();
  const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === now.getMonth();
  const realToday     = now.getDate();

  const selectedDateStr = selectedDate ? toDateStr(new Date(displayYear, displayMonth, selectedDate)) : null;
  let selectedTasks   = selectedDateStr ? (scheduleMap[selectedDateStr] || []) : [];
  
  if (activeFilter !== 'All') {
    selectedTasks = selectedTasks.filter(t => t.type === activeFilter);
  }

  // Build calendar cells
  const calendarCells = [];
  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} />);
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDate === d;
    const isToday    = isCurrentMonth && realToday === d;
    const dateStr    = toDateStr(new Date(displayYear, displayMonth, d));
    const dayTasks   = scheduleMap[dateStr] || [];
    const hasTasks   = dayTasks.length > 0;
    const isPast     = dateStr < todayStr;
    
    // Determine dots (max 3)
    const pendingTasks = dayTasks.filter(t => !t.is_completed);
    const allDone = hasTasks && pendingTasks.length === 0;
    const dots = pendingTasks.slice(0, 3).map(t => TAG_COLORS[t.type] || '#333');

    calendarCells.push(
      <div
        key={d}
        onClick={() => setSelectedDate(d)}
        style={{
          padding: '12px 6px', textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
          background: isSelected ? 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' : isToday ? '#f0f4ff' : '#fff',
          color: isSelected ? '#fff' : (isPast && pendingTasks.length > 0 ? '#d32f2f' : '#333'),
          fontWeight: isSelected || isToday ? 'bold' : 'normal',
          border: isToday && !isSelected ? '2px solid #4e4376' : '1px solid #eee',
          boxShadow: isSelected ? '0 10px 20px rgba(78,67,118,0.3)' : 'none',
          transition: 'all 0.2s', position: 'relative', fontSize: '14px',
          opacity: isPast && !isSelected && allDone ? 0.6 : 1
        }}
      >
        {d}
        {hasTasks && (
          <div style={{ position: 'absolute', bottom: '6px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '3px' }}>
            {allDone ? (
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
            ) : (
               dots.map((c, i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? '#fff' : c }} />)
            )}
          </div>
        )}
      </div>
    );
  }

  const selectedDisplay = selectedDate 
    ? `${MONTHS[displayMonth]} ${selectedDate}, ${displayYear}` 
    : 'Select a Date';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f0ff 50%, #eff6ff 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px', flex: 1 }}>
          
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
            borderRadius: '20px', padding: '30px', color: '#fff', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>AI Study Planner</h1>
              <p style={{ margin: 0, opacity: 0.9, maxWidth: '600px' }}>
                Courses are intelligently interleaved and paced. Modules unlock progressively as you complete them.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 2 }}>
              {overdueTasksCount > 0 && (
                <div style={{ background: overdueTasksCount > 5 ? '#d32f2f' : '#f57c00', padding: '15px', borderRadius: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {overdueTasksCount > 5 ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          High Overdue Count
                        </>
                      ) : 'Slightly Behind'}
                    </div>
                  </div>
                  <button onClick={handleRebalance} style={{ background: '#fff', color: '#333', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Rebalance Schedule
                  </button>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>Weekly Pace</div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '30px' }}>
                  {['Casual', 'Moderate', 'Intensive'].map(p => (
                    <button
                      key={p}
                      onClick={() => setStudyPace(p)}
                      style={{
                        background: studyPace === p ? '#fff' : 'transparent',
                        color: studyPace === p ? '#2b5876' : '#fff',
                        border: 'none', padding: '6px 16px', borderRadius: '20px',
                        fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
            
            {/* Left Column: Calendar & Timer */}
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
              
              <div style={{
                background: '#fff', borderRadius: '24px', padding: '30px',
                boxShadow: '0 8px 32px rgba(79,70,229,0.10)', border: '1px solid rgba(99,102,241,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>&lt;</button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{MONTHS[displayMonth]} {displayYear}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>&gt;</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {WEEKDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#aaa' }}>{d}</div>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {calendarCells}
                </div>

                {/* Tag Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', fontSize: '11px', color: '#888', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                  {Object.entries(TAG_COLORS).map(([tag, color]) => (
                    <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              <PomodoroTimer />
            </div>

            {/* Right Column: Time-Block View */}
            <div style={{
              flex: 1, background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 8px 32px rgba(79,70,229,0.10)', border: '1px solid rgba(99,102,241,0.1)', minHeight: '600px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {selectedDisplay}
                </h3>
                
                {/* Filters */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['All', 'Lecture', 'Quiz', 'Revision'].map(f => (
                    <button
                      key={f} onClick={() => setActiveFilter(f)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                        background: activeFilter === f ? '#e3f2fd' : '#f5f5f5',
                        color: activeFilter === f ? '#1565c0' : '#888',
                        transition: 'all 0.2s'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated AI Suggestion Banner (Only for Today) */}
              <ContextualAIAssistant 
                dateStr={selectedDateStr} 
                todayStr={todayStr} 
                tasks={selectedTasks} 
                completedTasks={completedTasks} 
                overdueCount={overdueTasksCount} 
              />

              <div style={{ flex: 1 }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '16px', border: '1px solid #eee', display: 'flex', gap: '20px' }}>
                        <div style={{ width: '100px', height: '20px', background: '#e0e0e0', borderRadius: '4px' }} />
                        <div style={{ flex: 1, height: '80px', background: '#e0e0e0', borderRadius: '12px' }} />
                      </div>
                    ))}
                  </div>
                ) : !selectedDate ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#aaa', textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', color: '#94a3b8' }}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <p style={{ fontWeight: '600', fontSize: '18px', color: '#555' }}>Select a date</p>
                    <p style={{ fontSize: '14px', maxWidth: '300px' }}>Click any date on the calendar to view your interleaved schedule.</p>
                  </div>
                ) : selectedTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', color: '#94a3b8' }}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                        <line x1="6" y1="1" x2="6" y2="4"/>
                        <line x1="10" y1="1" x2="10" y2="4"/>
                        <line x1="14" y1="1" x2="14" y2="4"/>
                      </svg>
                    </div>
                    <p style={{ fontWeight: '600', fontSize: '18px', color: '#333' }}>No {activeFilter !== 'All' ? activeFilter : ''} tasks today!</p>
                    <p style={{ fontSize: '14px', color: '#888', maxWidth: '300px', marginBottom: '24px' }}>
                      Your progressive schedule is clear for this day.
                    </p>
                    <Link href="/dashboard" style={{ padding: '10px 24px', background: '#e3f2fd', color: '#1565c0', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '110px', paddingTop: '10px' }}>
                    {/* Vertical Line for Timeline */}
                    <div style={{ position: 'absolute', left: '85px', top: '20px', bottom: '20px', width: '2px', background: '#eef0f2' }} />

                    {selectedTasks.map((task) => {
                      const isDone = completedTasks.includes(task.id);
                      return (
                        <div key={task.id} style={{ position: 'relative', marginBottom: '35px' }}>
                          
                          {/* Time Label */}
                          <div style={{ 
                            position: 'absolute', left: '-110px', top: '20px', width: '80px', textAlign: 'right',
                            color: isDone ? '#ccc' : '#444'
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{task.time_slot.split(' - ')[0]}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>to {task.time_slot.split(' - ')[1]}</div>
                          </div>
                          
                          {/* Timeline Dot */}
                          <div style={{
                            position: 'absolute', left: '-29px', top: '22px',
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: isDone ? '#4CAF50' : TAG_COLORS[task.type],
                            border: '3px solid #fff', zIndex: 2,
                            boxShadow: '0 0 0 1px #e0e0e0'
                          }} />

                          {/* Task Card */}
                          <div style={{
                            background: isDone
                              ? '#f8f8f8'
                              : `linear-gradient(145deg, #ffffff 0%, ${task.course_color}08 100%)`,
                            padding: '20px 24px', borderRadius: '18px',
                            border: `1px solid ${isDone ? '#ebebeb' : task.course_color + '28'}`,
                            borderLeft: `5px solid ${isDone ? '#d0d0d0' : task.course_color}`,
                            boxShadow: isDone
                              ? 'none'
                              : `0 6px 24px ${task.course_color}18, 0 2px 8px rgba(0,0,0,0.06)`,
                            position: 'relative',
                            opacity: isDone ? 0.6 : 1,
                            transition: 'all 0.3s',
                          }}>
                            {/* Tags */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                              <span style={{ 
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                background: `${TAG_COLORS[task.type]}15`, color: TAG_COLORS[task.type]
                              }}>
                                {task.type}
                              </span>
                              {task.subject_code && task.subject_code !== 'REV' && (
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: '#f5f5f5', color: '#666' }}>
                                  {task.subject_code}
                                </span>
                              )}
                            </div>
                            
                            <h4 style={{
                              fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}>
                              {task.course_title}
                            </h4>
                            
                            <div style={{ fontSize: '14px', color: '#555', fontWeight: '600', marginBottom: '6px' }}>
                              {task.module_name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#777', paddingRight: '50px', lineHeight: '1.4' }}>
                              {task.topic}
                            </div>

                            {/* Complete Checkbox */}
                            <div 
                              onClick={() => {
                                if (selectedDateStr === todayStr && !isDone) {
                                  handleComplete(selectedDateStr, task.id);
                                }
                              }}
                              style={{
                                position: 'absolute', right: '24px', top: '24px',
                                width: '32px', height: '32px', borderRadius: '10px',
                                border: `2px solid ${isDone ? '#4CAF50' : '#e0e0e0'}`,
                                background: isDone ? '#4CAF50' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: (isDone || selectedDateStr !== todayStr) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                                boxShadow: isDone ? '0 4px 12px rgba(76,175,80,0.2)' : 'none',
                                opacity: isDone ? 0.8 : 1
                              }}
                            >
                              {isDone && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
