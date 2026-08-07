'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../public/real_courses_data.json';
import Head from 'next/head';

export default function PlannerPage() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Current month config (e.g., August 2026)
  const daysInMonth = 31;
  const startingDayOfWeek = 6; // Aug 1 2026 is a Saturday (0=Sun, 6=Sat)
  const monthName = "August 2026";
  const todayDate = 7; // Pretend today is Aug 7
  
  useEffect(() => {
    // Load enrolled courses
    const saved = localStorage.getItem('mockEnrolledCoursesV2');
    if (saved) {
      const codes = JSON.parse(saved);
      const enrolled = coursesData.filter(c => codes.includes(c.subject_code));
      setEnrolledCourses(enrolled);
      
      // Generate mock schedule based on enrolled courses
      const mockSchedule = {};
      
      if (enrolled.length > 0) {
        // Distribute topics across the month
        let dayTracker = 1;
        enrolled.forEach(course => {
          if (!course.modules) return;
          course.modules.forEach(mod => {
            // Assign this module to a day (looping through month)
            if (!mockSchedule[dayTracker]) {
              mockSchedule[dayTracker] = [];
            }
            
            // Just take first 2 topics to keep UI clean
            const topicsSnippet = mod.topics ? mod.topics.slice(0, 2).join(", ") : mod.title;
            
            mockSchedule[dayTracker].push({
              time: "10:00 AM - 12:00 PM",
              course: course.course_name,
              module: mod.title,
              topics: topicsSnippet,
              code: course.subject_code
            });
            
            dayTracker += 2; // skip a day
            if (dayTracker > daysInMonth) dayTracker = 1;
          });
        });
      }
      setScheduleData(mockSchedule);
      setSelectedDate(todayDate);
    }
  }, []);

  // Generate calendar grid
  const calendarCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-${i}`} style={{ padding: '15px' }}></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDate === d;
    const isToday = todayDate === d;
    const hasTasks = scheduleData[d] && scheduleData[d].length > 0;
    
    calendarCells.push(
      <div 
        key={d} 
        onClick={() => setSelectedDate(d)}
        style={{ 
          padding: '15px 10px', 
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '12px',
          background: isSelected ? 'linear-gradient(135deg, #3a8aff 0%, #800080 100%)' : (isToday ? '#f0f4f8' : '#fff'),
          color: isSelected ? '#fff' : '#333',
          fontWeight: isSelected || isToday ? 'bold' : 'normal',
          border: isToday && !isSelected ? '2px solid #3a8aff' : '1px solid #eee',
          boxShadow: isSelected ? '0 10px 20px rgba(58,138,255,0.3)' : 'none',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        {d}
        {hasTasks && (
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: isSelected ? '#fff' : '#800080', 
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)' 
          }} />
        )}
      </div>
    );
  }

  // Get selected day's tasks
  const selectedTasks = selectedDate ? (scheduleData[selectedDate] || []) : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f4f7fb', minHeight: '100vh' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>Study Planner</h1>
            <p style={{ color: '#666' }}>Your AI-generated daily schedule based on your enrolled courses and learning pace.</p>
          </div>

          {/* AI Suggestion Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
            borderRadius: '20px', padding: '30px', color: '#fff', marginBottom: '30px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 15px 30px rgba(38, 208, 206, 0.2)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                  ✨ AI Suggestion
                </span>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Based on your progress</span>
              </div>
              
              {enrolledCourses.length > 0 ? (
                <>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Time to hit the books!</h2>
                  <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                    You have a study block for <strong>{enrolledCourses[0]?.course_name}</strong> scheduled today. Review the core concepts and jump into the next module to stay on track.
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>You have no enrolled courses</h2>
                  <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                    Head over to the Course Catalog to enroll in some courses so I can build your custom schedule!
                  </p>
                </>
              )}
            </div>
            
            <button style={{
              background: '#fff', color: '#1a2980', border: 'none', padding: '14px 30px',
              borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 1, transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => window.location.href='/my-courses'}
            >
              Start Now ➔
            </button>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Interactive Calendar */}
            <div style={{
              background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>Working Calendar</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', color: '#3a8aff' }}>
                  <span style={{ cursor: 'pointer' }}>⬅</span>
                  {monthName}
                  <span style={{ cursor: 'pointer' }}>➡</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '15px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#888' }}>{d}</div>
                ))}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {calendarCells}
              </div>
            </div>

            {/* Daily Schedule Panel */}
            <div style={{
              background: '#fff', borderRadius: '24px', padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
              display: 'flex', flexDirection: 'column'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📅</span> Schedule for Aug {selectedDate}
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedTasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {selectedTasks.map((task, idx) => (
                      <div key={idx} style={{
                        background: '#f8f9fa', padding: '20px', borderRadius: '16px',
                        borderLeft: '4px solid #3a8aff', position: 'relative'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3a8aff', marginBottom: '5px' }}>{task.time}</div>
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '5px' }}>{task.course}</h4>
                        <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginBottom: '5px' }}>Module: {task.module}</div>
                        <div style={{ fontSize: '13px', color: '#888' }}>Topics: {task.topics}</div>
                        
                        <button style={{
                          position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                          background: '#fff', border: '1px solid #ccc', borderRadius: '50%', width: '30px', height: '30px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#3a8aff'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#3a8aff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = '#ccc'; }}
                        >✓</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', opacity: 0.7 }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>☕</div>
                    <p>No study sessions scheduled for this day.</p>
                    <p style={{ fontSize: '13px' }}>Take a break or review past materials!</p>
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
