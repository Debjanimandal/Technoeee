'use client';
import { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Tooltip } from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Image from 'next/image';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Tooltip);

const SUBJECTS = {
  Ongoing: [
    {
      id: 's1',
      title: 'UI/UX Designing',
      progress: 65,
      modules: [
        { name: 'Color Theory', progress: 100 },
        { name: 'Typography', progress: 100 },
        { name: 'Wireframing', progress: 50 },
        { name: 'Prototyping', progress: 0 }
      ]
    },
    {
      id: 's2',
      title: 'Web Development',
      progress: 40,
      modules: [
        { name: 'HTML Basics', progress: 100 },
        { name: 'CSS Flexbox', progress: 80 },
        { name: 'JavaScript DOM', progress: 10 }
      ]
    }
  ],
  Upcoming: [
    {
      id: 's3',
      title: 'React Native Basics',
      progress: 0,
      modules: [
        { name: 'Setup', progress: 0 },
        { name: 'Components', progress: 0 }
      ]
    }
  ],
  Completed: [
    {
      id: 's4',
      title: 'Python for Beginners',
      progress: 100,
      modules: [
        { name: 'Syntax', progress: 100 },
        { name: 'Data Types', progress: 100 },
        { name: 'Functions', progress: 100 }
      ]
    }
  ]
};

export default function ProfilePage() {
  const performanceChartRef = useRef(null);
  const performanceChartInstance = useRef(null);
  
  const strengthsChartRef = useRef(null);
  const strengthsChartInstance = useRef(null);

  const improvementChartRef = useRef(null);
  const improvementChartInstance = useRef(null);

  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('Ongoing');

  useEffect(() => {
    // 1. Performance Chart (Line)
    if (performanceChartRef.current) {
      if (performanceChartInstance.current) performanceChartInstance.current.destroy();
      performanceChartInstance.current = new Chart(performanceChartRef.current, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            { label: 'Weekly Performance', data: [2, 4, 3, 5, 4, 6, 7], borderColor: '#0000FF', backgroundColor: 'rgba(0,0,255,0.1)', fill: true, tension: 0.4 },
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

    // 2. Strengths Chart (Bar)
    if (strengthsChartRef.current) {
      if (strengthsChartInstance.current) strengthsChartInstance.current.destroy();
      strengthsChartInstance.current = new Chart(strengthsChartRef.current, {
        type: 'bar',
        data: {
          labels: ['HTML', 'CSS', 'UI Design', 'Research'],
          datasets: [
            { label: 'Score', data: [95, 88, 92, 85], backgroundColor: '#4CAF50', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, max: 100, grid: { display: false } },
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    // 3. Improvement Chart (Bar)
    if (improvementChartRef.current) {
      if (improvementChartInstance.current) improvementChartInstance.current.destroy();
      improvementChartInstance.current = new Chart(improvementChartRef.current, {
        type: 'bar',
        data: {
          labels: ['JavaScript', 'Prototyping', 'Algorithms'],
          datasets: [
            { label: 'Score', data: [45, 30, 50], backgroundColor: '#FF5722', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, max: 100, grid: { display: false } },
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    return () => {
      if (performanceChartInstance.current) performanceChartInstance.current.destroy();
      if (strengthsChartInstance.current) strengthsChartInstance.current.destroy();
      if (improvementChartInstance.current) improvementChartInstance.current.destroy();
    };
  }, []);

  const toggleSubject = (id) => {
    if (expandedSubjectId === id) {
      setExpandedSubjectId(null);
    } else {
      setExpandedSubjectId(id);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f5f5f5', overflowY: 'auto', height: '100vh', paddingBottom: '40px' }}>
        <DashboardHeader />
        
        <div style={{ marginBottom: '20px' }}>
          <h1>My Profile & Analytics</h1>
        </div>

        {/* Analytics Top Row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          
          {/* Card 1: Daily/Weekly Performance */}
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Weekly Performance</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Hours spent learning per day</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={performanceChartRef}></canvas>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0000FF' }}>Total: 31 hrs this week</div>
          </div>

          {/* Card 2: Strong Foundation */}
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Strong Foundations</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Your top performing subjects</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={strengthsChartRef}></canvas>
            </div>
          </div>

          {/* Card 3: Needs Improvement */}
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Needs Improvement</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Focus areas to boost your score</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={improvementChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Subjects Enrolled Section */}
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Enrolled Subjects</h2>
          
          {/* Categories Tabs */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
            {Object.keys(SUBJECTS).map((category) => (
              <button 
                key={category} 
                onClick={() => { setActiveTab(category); setExpandedSubjectId(null); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '15px', 
                  fontWeight: activeTab === category ? 'bold' : 'normal',
                  color: activeTab === category ? '#0000FF' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === category ? '2px solid #0000FF' : 'none',
                  paddingBottom: '5px'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sub-cards for selected category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {SUBJECTS[activeTab].map((subject) => (
              <div key={subject.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                
                {/* Subject Header (Clickable) */}
                <div 
                  onClick={() => toggleSubject(subject.id)}
                  style={{ 
                    padding: '15px 20px', 
                    background: '#fcfcfc', 
                    cursor: 'pointer',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fcfcfc'}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{subject.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${subject.progress}%`, backgroundColor: '#0000FF', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{subject.progress}% Completed</span>
                    </div>
                  </div>
                  <div style={{ paddingLeft: '20px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSubjectId === subject.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Modules Expansion */}
                {expandedSubjectId === subject.id && (
                  <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', background: '#fff' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Modules</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {subject.modules.map((mod, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#444' }}>{idx + 1}. {mod.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
                            <div style={{ flex: 1, height: '5px', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${mod.progress}%`, backgroundColor: mod.progress === 100 ? '#4CAF50' : '#0000FF', borderRadius: '3px' }}></div>
                            </div>
                            <span style={{ fontSize: '12px', width: '40px', textAlign: 'right' }}>{mod.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {SUBJECTS[activeTab].length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No subjects in this category.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
