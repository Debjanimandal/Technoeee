'use client';
import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Image from 'next/image';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const COURSES = [
  { color: '#9AC4FF', category: 'Web Designing', title: 'UI/UX Designing for beginners', progress: 70, lessons: '21/30 lessons' },
  { color: '#DEC4FF', category: 'Web Development', title: 'HTML & CSS for beginners', progress: 70, lessons: '14/20 lessons' },
  { color: '#FFEDCB', category: 'Marketing', title: 'Content writing for beginners', progress: 30, lessons: '6/20 lessons' },
];

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
  'Content writing for beginners': null,
};

export default function DashboardPage() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

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
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { display: false } },
          },
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
        <div className="dash-courses-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {COURSES.map(c => (
            <div key={c.title} style={{
              flex: 1, padding: '15px', border: '1px solid #000',
              borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              backgroundColor: c.color
            }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', border: '1px solid #000', borderRadius: '5px', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>{c.category}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{c.title}</h3>
              <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', marginBottom: '10px' }}>
                <div style={{ height: '100%', width: `${c.progress}%`, backgroundColor: '#000', borderRadius: '3px' }}></div>
              </div>
              <p style={{ fontSize: '12px', color: '#311919', marginBottom: '10px' }}>{c.lessons}</p>
              <button style={{ backgroundColor: '#041643', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: '"Poppins", sans-serif' }}>Resume</button>
            </div>
          ))}
        </div>

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
                {lessons ? (
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
                ) : (
                  <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>NONE</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
