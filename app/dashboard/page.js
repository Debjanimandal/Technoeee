'use client';
import { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

// Course card background colors cycle
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

export default function DashboardPage() {
  const { user } = useAuth();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Load enrollments from Supabase
  useEffect(() => {
    if (!user) { setDbLoading(false); return; }
    async function loadCourses() {
      setDbLoading(true);
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setCourses(data || []);
      setDbLoading(false);
    }
    loadCourses();
  }, [user]);

  // Chart
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'],
          datasets: [
            { label: 'UI/UX Designing', data: [10,20,30,40,50,60,55,70,65,80], borderColor: '#0000FF', backgroundColor: 'rgba(0,0,255,0.1)', fill: false, tension: 0.4 },
            { label: 'HTML & CSS', data: [5,15,25,35,45,40,50,45,55,60], borderColor: '#800080', backgroundColor: 'rgba(128,0,128,0.1)', fill: false, tension: 0.4 },
            { label: 'Content Writing', data: [0,5,10,15,20,25,30,35,40,45], borderColor: '#FFA500', backgroundColor: 'rgba(255,165,0,0.1)', fill: false, tension: 0.4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { display: false } } },
          plugins: { legend: { display: false } },
        },
      });
    }
    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f5f5f5' }}>
        <DashboardHeader />
        <div style={{ marginBottom: '20px' }}><h1>My Courses</h1></div>

        {/* Course Cards from Supabase */}
        {dbLoading ? (
          <div style={{ padding: '20px', color: '#888', fontSize: '14px' }}>Loading your courses...</div>
        ) : !user ? (
          <div style={{ padding: '20px', color: '#888', fontSize: '14px' }}>Please sign in to see your courses.</div>
        ) : courses.length === 0 ? (
          <div style={{ padding: '20px', color: '#888', fontSize: '14px', background: '#fff', borderRadius: '12px', border: '1px dashed #ccc', textAlign: 'center' }}>
            No courses enrolled yet. Enroll in a course to get started!
          </div>
        ) : (
          <div className="dash-courses-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {courses.map((c, i) => (
              <div key={c.id} style={{
                flex: '1 1 200px', padding: '15px', border: '1px solid #000',
                borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                backgroundColor: CARD_COLORS[i % CARD_COLORS.length]
              }}>
                {c.category && (
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', border: '1px solid #000', borderRadius: '5px', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
                    {c.category}
                  </div>
                )}
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{c.course_title}</h3>
                <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${c.progress}%`, backgroundColor: '#000', borderRadius: '3px' }}></div>
                </div>
                <p style={{ fontSize: '12px', color: '#311919', marginBottom: '10px' }}>{c.progress}% complete</p>
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                  fontSize: '11px', fontWeight: '600',
                  background: c.status === 'Completed' ? '#d1fae5' : c.status === 'Upcoming' ? '#fef3c7' : '#dbeafe',
                  color: c.status === 'Completed' ? '#065f46' : c.status === 'Upcoming' ? '#92400e' : '#1e40af',
                }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="dash-bottom-row" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>COURSE PERFORMANCE</h2>
              <div style={{ width: '100%', height: '200px', borderRadius: '5px', position: 'relative' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>ASSIGNMENT PENDING</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Design an Educational Website','Design a Medical Website','Develop a basic Website using only HTML'].map(a => (
                  <li key={a} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0', fontSize: '14px' }}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

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
  );
}
