'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../public/real_courses_data.json';
import Head from 'next/head';

export default function MyCoursesPage() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('mockEnrolledCoursesV2');
    if (saved) {
      const subjectCodes = JSON.parse(saved);
      // Filter the full coursesData to only those the user is enrolled in
      const myCourses = coursesData.filter(course => subjectCodes.includes(course.subject_code));
      setEnrolledCourses(myCourses);
    }
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f0f4f8' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>My Enrolled Courses</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Track your progress and pick up right where you left off.</p>

          {enrolledCourses.length === 0 ? (
            <div style={{ 
              background: 'rgba(255,255,255,0.7)', padding: '50px', textAlign: 'center', 
              borderRadius: '16px', border: '1px dashed #ccc' 
            }}>
              <p style={{ fontSize: '18px', color: '#888' }}>You haven't enrolled in any courses yet.</p>
              <button 
                onClick={() => window.location.href='/courses'}
                style={{ 
                  marginTop: '15px', background: '#3a8aff', color: '#fff', border: 'none', 
                  padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >Browse Catalog</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {enrolledCourses.map((course, idx) => {
                // Mock progress data for UI demonstration
                const progress = Math.floor(Math.random() * 60) + 10; // random between 10-70%
                
                return (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    padding: '25px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#3a8aff' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#3a8aff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {course.subject_code || 'General'}
                        </span>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginTop: '5px' }}>
                          {course.course_name}
                        </h2>
                      </div>
                      <span style={{ 
                        background: '#e8f5e9', color: '#2ecc71', padding: '5px 12px', 
                        borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                      }}>Ongoing</span>
                    </div>

                    {/* Progress Tracking */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                        <span><strong>Current:</strong> Module 2 (Core Concepts)</span>
                        <span style={{ fontWeight: 'bold' }}>{progress}% Completed</span>
                      </div>
                      <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3a8aff, #00d2ff)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>⏱ Estimated remaining: 24 Hours</span>
                      <button style={{
                        background: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 25px', 
                        borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                      }}>Resume Course ➔</button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
