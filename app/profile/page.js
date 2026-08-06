'use client';
import { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Tooltip } from 'chart.js';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Tooltip);

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const performanceChartRef = useRef(null);
  const performanceChartInstance = useRef(null);
  const strengthsChartRef = useRef(null);
  const strengthsChartInstance = useRef(null);
  const improvementChartRef = useRef(null);
  const improvementChartInstance = useRef(null);

  const [enrollments, setEnrollments] = useState([]);
  const [modulesProgress, setModulesProgress] = useState([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [dbLoading, setDbLoading] = useState(true);

  // Load enrollments & modules from Supabase
  useEffect(() => {
    if (!user) { setDbLoading(false); return; }
    async function loadData() {
      setDbLoading(true);
      const { data: enrData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const { data: modData } = await supabase
        .from('modules_progress')
        .select('*')
        .eq('user_id', user.id);

      setEnrollments(enrData || []);
      setModulesProgress(modData || []);
      setDbLoading(false);
    }
    loadData();
  }, [user]);

  // Group enrollments by status
  const grouped = {
    Ongoing:   enrollments.filter(e => e.status === 'Ongoing'),
    Upcoming:  enrollments.filter(e => e.status === 'Upcoming'),
    Completed: enrollments.filter(e => e.status === 'Completed'),
  };

  // Get modules for a given enrollment
  function getModules(enrollmentId) {
    return modulesProgress.filter(m => m.enrollment_id === enrollmentId);
  }

  // Build charts
  useEffect(() => {
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
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { display: false } } },
          plugins: { legend: { display: false } },
        },
      });
    }
    if (strengthsChartRef.current) {
      if (strengthsChartInstance.current) strengthsChartInstance.current.destroy();
      strengthsChartInstance.current = new Chart(strengthsChartRef.current, {
        type: 'bar',
        data: {
          labels: ['HTML', 'CSS', 'UI Design', 'Research'],
          datasets: [{ label: 'Score', data: [95, 88, 92, 85], backgroundColor: '#4CAF50', borderRadius: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100, grid: { display: false } } },
          plugins: { legend: { display: false } },
        },
      });
    }
    if (improvementChartRef.current) {
      if (improvementChartInstance.current) improvementChartInstance.current.destroy();
      improvementChartInstance.current = new Chart(improvementChartRef.current, {
        type: 'bar',
        data: {
          labels: ['JavaScript', 'Prototyping', 'Algorithms'],
          datasets: [{ label: 'Score', data: [45, 30, 50], backgroundColor: '#FF5722', borderRadius: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100, grid: { display: false } } },
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

  const toggleSubject = (id) => setExpandedSubjectId(expandedSubjectId === id ? null : id);

  return (
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

        {/* Analytics Top Row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Weekly Performance</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Hours spent learning per day</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={performanceChartRef}></canvas>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0000FF' }}>Total: 31 hrs this week</div>
          </div>
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Strong Foundations</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Your top performing subjects</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={strengthsChartRef}></canvas>
            </div>
          </div>
          <div style={{ flex: '1 1 30%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Needs Improvement</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Focus areas to boost your score</p>
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <canvas ref={improvementChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Enrolled Subjects from Supabase */}
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Enrolled Subjects</h2>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
            {['Ongoing', 'Upcoming', 'Completed'].map((category) => (
              <button
                key={category}
                onClick={() => { setActiveTab(category); setExpandedSubjectId(null); }}
                style={{
                  background: 'none', border: 'none', fontSize: '15px',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {dbLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading your courses...</div>
            ) : !user ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Please sign in to see your enrolled courses.</div>
            ) : grouped[activeTab].length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No subjects in this category yet.</div>
            ) : (
              grouped[activeTab].map((subject) => {
                const modules = getModules(subject.id);
                return (
                  <div key={subject.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleSubject(subject.id)}
                      style={{ padding: '15px 20px', background: '#fcfcfc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fcfcfc'}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{subject.course_title}</h3>
                        {subject.category && <span style={{ fontSize: '11px', color: '#888', marginBottom: '8px', display: 'block' }}>{subject.category}</span>}
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
                    {expandedSubjectId === subject.id && (
                      <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', background: '#fff' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Modules</h4>
                        {modules.length === 0 ? (
                          <p style={{ color: '#aaa', fontSize: '13px' }}>No modules added yet.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {modules.map((mod, idx) => (
                              <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#444' }}>{idx + 1}. {mod.module_name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
                                  <div style={{ flex: 1, height: '5px', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: `${mod.progress}%`, backgroundColor: mod.progress === 100 ? '#4CAF50' : '#0000FF', borderRadius: '3px' }}></div>
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
  );
}
