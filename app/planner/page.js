'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../public/real_courses_data.json';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import PomodoroTimer from '@/components/PomodoroTimer';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Helper to format date
function toDateStr(dateObj) {
  const yr = dateObj.getFullYear();
  const mo = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Dynamic Scheduling Engine ───────────────────────────────────────────────
function generateDynamicSchedule(enrollments, pace, startDate) {
  const scheduleMap = {};
  
  // Flatten all topics from enrolled courses
  let allTopics = [];
  enrollments.forEach(enrollment => {
    const course = coursesData.find(
      c => c.course_name === enrollment.course_title || c.subject_code === enrollment.category
    );
    if (course && course.modules) {
      course.modules.forEach(mod => {
        if (mod.topics) {
          mod.topics.forEach(topic => {
            allTopics.push({
              course_title: course.course_name,
              subject_code: course.subject_code,
              module_name: mod.title,
              topic: topic,
              type: 'Lecture'
            });
          });
        }
      });
    }
  });

  // Determine tasks per day based on pace
  let tasksPerDay = 2;
  if (pace === 'Moderate') tasksPerDay = 4;
  if (pace === 'Intensive') tasksPerDay = 6;

  let currentDate = new Date(startDate);
  // Ensure we don't modify the original date object
  currentDate.setHours(0,0,0,0);

  let topicIndex = 0;
  
  // Keep scheduling until all topics are assigned
  while (topicIndex < allTopics.length) {
    const dateStr = toDateStr(currentDate);
    scheduleMap[dateStr] = [];
    
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    
    // Weekend Revision Logic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      scheduleMap[dateStr].push({
        id: `rev-${dateStr}-1`,
        course_title: 'Weekly Review',
        module_name: 'Consolidation & Practice',
        topic: 'Review concepts learned this week',
        type: 'Revision',
        time_slot: '10:00 AM - 12:00 PM',
        is_completed: false
      });
      // Skip to next day without consuming new topics
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Weekday Logic: Assign topics
    let startHour = 9; // 9 AM
    for (let i = 0; i < tasksPerDay; i++) {
      if (topicIndex >= allTopics.length) break;
      
      const t = allTopics[topicIndex];
      const ampm = startHour >= 12 ? 'PM' : 'AM';
      const displayHour = startHour > 12 ? startHour - 12 : startHour;
      const endHour = startHour + 1;
      const endAmpm = endHour >= 12 ? 'PM' : 'AM';
      const endDisplay = endHour > 12 ? endHour - 12 : endHour;
      
      const timeSlot = `${displayHour}:00 ${ampm} - ${endDisplay}:00 ${endAmpm}`;
      
      scheduleMap[dateStr].push({
        id: `task-${dateStr}-${i}`,
        ...t,
        time_slot: timeSlot,
        is_completed: false
      });
      
      startHour += 1; // 1 hour per topic
      topicIndex++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return scheduleMap;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const { user } = useAuth();
  const now = new Date();

  // Calendar display state
  const [displayYear, setDisplayYear]   = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  // Personalization State
  const [studyPace, setStudyPace] = useState('Moderate'); // Casual, Moderate, Intensive

  // Data state
  const [enrollments, setEnrollments] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Load enrollments
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id);

      const seen = new Set();
      const deduped = (data || []).filter(e => {
        const k = e.course_title?.toLowerCase().trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setEnrollments(deduped);
    })();
  }, [user]);

  // 2. Generate Schedule Dynamically whenever enrollments or pace change
  useEffect(() => {
    if (enrollments.length > 0) {
      setLoading(true);
      // Generate from today onwards
      const today = new Date();
      const newSchedule = generateDynamicSchedule(enrollments, studyPace, today);
      
      // Also grab completed tasks from localStorage to cross-reference (simulated persistence)
      try {
        const savedCompleted = JSON.parse(localStorage.getItem('planner_completed') || '[]');
        Object.keys(newSchedule).forEach(date => {
          newSchedule[date].forEach(task => {
            if (savedCompleted.includes(task.id)) {
              task.is_completed = true;
            }
          });
        });
      } catch(e) {}
      
      setScheduleMap(newSchedule);
      setLoading(false);
    } else if (enrollments.length === 0) {
      setLoading(false);
    }
  }, [enrollments, studyPace]);

  // Mark task complete (locally)
  const handleComplete = (dateStr, taskId) => {
    const updatedMap = { ...scheduleMap };
    const task = updatedMap[dateStr].find(t => t.id === taskId);
    if (task) {
      task.is_completed = !task.is_completed; // toggle
      setScheduleMap(updatedMap);
      
      // Save to local storage
      try {
        const savedCompleted = JSON.parse(localStorage.getItem('planner_completed') || '[]');
        if (task.is_completed && !savedCompleted.includes(taskId)) {
          savedCompleted.push(taskId);
        } else if (!task.is_completed) {
          const idx = savedCompleted.indexOf(taskId);
          if (idx > -1) savedCompleted.splice(idx, 1);
        }
        localStorage.setItem('planner_completed', JSON.stringify(savedCompleted));
      } catch(e) {}
    }
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
  const selectedTasks   = selectedDateStr ? (scheduleMap[selectedDateStr] || []) : [];

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
    
    // Determine dots
    const hasLectures = dayTasks.some(t => t.type === 'Lecture');
    const hasRevision = dayTasks.some(t => t.type === 'Revision');
    const allDone    = hasTasks && dayTasks.every(s => s.is_completed);

    calendarCells.push(
      <div
        key={d}
        onClick={() => setSelectedDate(d)}
        style={{
          padding: '12px 6px', textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
          background: isSelected ? 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)' : isToday ? '#f0f4ff' : '#fff',
          color: isSelected ? '#fff' : '#333',
          fontWeight: isSelected || isToday ? 'bold' : 'normal',
          border: isToday && !isSelected ? '2px solid #26d0ce' : '1px solid #eee',
          boxShadow: isSelected ? '0 10px 20px rgba(38,208,206,0.3)' : 'none',
          transition: 'all 0.2s', position: 'relative', fontSize: '14px',
        }}
      >
        {d}
        {hasTasks && (
          <div style={{ position: 'absolute', bottom: '6px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '3px' }}>
            {allDone ? (
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
            ) : (
               <>
                 {hasLectures && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? '#fff' : '#3a8aff' }} />}
                 {hasRevision && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? '#fff' : '#ab47bc' }} />}
               </>
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
      <div className="page-content" style={{ backgroundColor: '#f4f7fb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px', flex: 1 }}>
          
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
            borderRadius: '20px', padding: '30px', color: '#fff', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
          }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Dynamic Study Planner</h1>
              <p style={{ margin: 0, opacity: 0.9, maxWidth: '600px' }}>
                Your schedule is auto-generated by our AI engine based on your enrolled courses. 
                Don't worry if you miss a day—the schedule dynamically adapts to keep you on track.
              </p>
            </div>
            
            {/* Study Pace Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>AI Study Pace</div>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '30px' }}>
                {['Casual', 'Moderate', 'Intensive'].map(p => (
                  <button
                    key={p}
                    onClick={() => setStudyPace(p)}
                    style={{
                      background: studyPace === p ? '#fff' : 'transparent',
                      color: studyPace === p ? '#1a2980' : '#fff',
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

          {/* Main Content Grid */}
          <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
            
            {/* Left Column: Calendar & Timer */}
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
              
              {/* The Calendar */}
              <div style={{
                background: '#fff', borderRadius: '24px', padding: '30px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>&lt;</button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{MONTHS[displayMonth]} {displayYear}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>&gt;</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {WEEKDAYS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#aaa' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {calendarCells}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', fontSize: '11px', color: '#888', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3a8aff' }} /> Lecture</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ab47bc' }} /> Revision</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }} /> Done</span>
                </div>
              </div>

              {/* Pomodoro Timer */}
              <PomodoroTimer />

            </div>

            {/* Right Column: Time-Block View */}
            <div style={{
              flex: 1, background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
              minHeight: '600px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📅</span> {selectedDisplay}
              </h3>

              <div style={{ flex: 1 }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '16px', border: '1px solid #eee', display: 'flex', gap: '20px' }}>
                        <div style={{ width: '100px', height: '20px', background: '#e0e0e0', borderRadius: '4px' }} />
                        <div style={{ flex: 1, height: '60px', background: '#e0e0e0', borderRadius: '8px' }} />
                      </div>
                    ))}
                  </div>
                ) : !selectedDate ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#aaa', textAlign: 'center' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🗓️</div>
                    <p style={{ fontWeight: '600', fontSize: '18px', color: '#555' }}>Select a date</p>
                    <p style={{ fontSize: '14px', maxWidth: '300px' }}>Click any date on the calendar to view your dynamically scheduled blocks.</p>
                  </div>
                ) : selectedTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>☕</div>
                    <p style={{ fontWeight: '600', fontSize: '18px', color: '#333' }}>You're free today!</p>
                    <p style={{ fontSize: '14px', color: '#888', maxWidth: '300px', marginBottom: '24px' }}>
                      No tasks are scheduled for this day. You can take a break or start studying early.
                    </p>
                    <Link href="/dashboard" style={{
                      padding: '10px 24px', background: '#e3f2fd', color: '#1565c0', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px'
                    }}>
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '110px' }}>
                    {/* Vertical Line for Timeline */}
                    <div style={{ position: 'absolute', left: '85px', top: '20px', bottom: '20px', width: '2px', background: '#e0e0e0' }} />

                    {selectedTasks.map((task, idx) => (
                      <div key={task.id} style={{ position: 'relative', marginBottom: '30px' }}>
                        
                        {/* Time Label */}
                        <div style={{ 
                          position: 'absolute', left: '-110px', top: '15px', width: '80px', textAlign: 'right',
                          fontSize: '12px', fontWeight: 'bold', color: task.is_completed ? '#aaa' : '#555'
                        }}>
                          {task.time_slot.split(' - ')[0]}
                        </div>
                        
                        {/* Timeline Dot */}
                        <div style={{
                          position: 'absolute', left: '-29px', top: '17px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: task.is_completed ? '#4CAF50' : (task.type === 'Revision' ? '#ab47bc' : '#3a8aff'),
                          border: '3px solid #fff', zIndex: 2,
                          boxShadow: '0 0 0 1px #e0e0e0'
                        }} />

                        {/* Task Card */}
                        <div style={{
                          background: task.is_completed ? '#f9fafb' : '#fff',
                          padding: '20px', borderRadius: '16px',
                          border: `1px solid ${task.is_completed ? '#eee' : (task.type === 'Revision' ? '#f3e5f5' : '#e3f2fd')}`,
                          boxShadow: task.is_completed ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
                          position: 'relative',
                          opacity: task.is_completed ? 0.7 : 1,
                          transition: 'all 0.3s',
                        }}>
                          {/* Tags */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                              background: task.type === 'Revision' ? '#f3e5f5' : '#e3f2fd',
                              color: task.type === 'Revision' ? '#ab47bc' : '#1565c0'
                            }}>
                              {task.type}
                            </span>
                            {task.subject_code && (
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: '#f5f5f5', color: '#666' }}>
                                {task.subject_code}
                              </span>
                            )}
                          </div>
                          
                          <h4 style={{
                            fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 6px 0',
                            textDecoration: task.is_completed ? 'line-through' : 'none',
                          }}>
                            {task.course_title}
                          </h4>
                          
                          <div style={{ fontSize: '13px', color: '#666', fontWeight: '600', marginBottom: '4px' }}>
                            {task.module_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#888', paddingRight: '50px' }}>
                            {task.topic}
                          </div>

                          {/* Complete Checkbox */}
                          <div 
                            onClick={() => handleComplete(dateStr, task.id)}
                            style={{
                              position: 'absolute', right: '20px', top: '20px',
                              width: '28px', height: '28px', borderRadius: '8px',
                              border: `2px solid ${task.is_completed ? '#4CAF50' : '#e0e0e0'}`,
                              background: task.is_completed ? '#4CAF50' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {task.is_completed && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                        </div>
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
