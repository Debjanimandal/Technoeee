'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../public/courses_data.json';
import Head from 'next/head';

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);

  // Load enrolled courses from local storage
  useEffect(() => {
    const saved = localStorage.getItem('mockEnrolledCourses');
    if (saved) {
      setEnrolledCourses(JSON.parse(saved));
    }
  }, []);

  const handleEnrollClick = () => {
    setOtpModalOpen(true);
    setOtp(['', '', '', '']);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // only one char per box
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // auto focus next
    if (value && index < 3) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.join('').length === 4) {
      // Mock successful enrollment
      const newEnrolled = [...enrolledCourses, selectedCourse.subject_code];
      setEnrolledCourses(newEnrolled);
      localStorage.setItem('mockEnrolledCourses', JSON.stringify(newEnrolled));
      
      setOtpModalOpen(false);
      // Wait for React to update state, then show alert or just let the button update
      alert("Successfully enrolled!");
    } else {
      alert("Please enter a 4 digit OTP");
    }
  };

  const closeModal = () => {
    setSelectedCourse(null);
    setOtpModalOpen(false);
  };

  // Generate some dummy modules if the course doesn't have any extracted
  const renderModules = (course) => {
    const defaultModules = [
      { title: 'Module 1: Introduction & Basics', topics: ['Overview of the subject', 'Setting up the environment'] },
      { title: 'Module 2: Core Concepts', topics: ['Deep dive into theory', 'Practical examples', 'Assignment 1'] },
      { title: 'Module 3: Advanced Topics & Conclusion', topics: ['Complex scenarios', 'Final Project Guidelines'] }
    ];
    
    const modulesToRender = course.modules && course.modules.length > 0 ? course.modules : defaultModules;

    return modulesToRender.map((mod, idx) => (
      <div key={idx} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.5)', padding: '10px 15px', borderRadius: '8px' }}>
        <h4 style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '5px' }}>{mod.title}</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#4a4a4a', fontSize: '13px' }}>
          {mod.topics && mod.topics.map((topic, tidx) => (
            <li key={tidx}>{topic}</li>
          ))}
        </ul>
      </div>
    ));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f0f4f8', position: 'relative' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>Course Catalog</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Explore all available courses and enroll to start your journey.</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '25px' 
          }}>
            {coursesData.map((course, index) => {
              const isEnrolled = enrolledCourses.includes(course.subject_code);
              
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedCourse(course)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    padding: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,100,255,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '6px',
                    background: 'linear-gradient(90deg, #3a8aff, #800080)'
                  }} />
                  <span style={{ 
                    display: 'inline-block', 
                    background: 'rgba(58, 138, 255, 0.1)', 
                    color: '#3a8aff', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    marginBottom: '15px' 
                  }}>
                    {course.subject_code || 'General'}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '15px', lineHeight: '1.4' }}>
                    {course.course_name}
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>⏱ 40 Hours</span>
                    {isEnrolled ? (
                       <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2ecc71' }}>Enrolled ✓</span>
                    ) : (
                       <span style={{ fontSize: '13px', fontWeight: '600', color: '#3a8aff' }}>View Details ➔</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', width: '90%', maxWidth: '700px', maxHeight: '85vh',
            borderRadius: '20px', padding: '30px', position: 'relative',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)', overflowY: 'auto'
          }}>
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute', top: '20px', right: '20px', background: '#f0f0f0',
                border: 'none', width: '35px', height: '35px', borderRadius: '50%',
                fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
            
            <span style={{ color: '#3a8aff', fontWeight: 'bold', fontSize: '14px' }}>{selectedCourse.subject_code || 'General'}</span>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '10px 0 20px', color: '#1a1a1a' }}>{selectedCourse.course_name}</h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <div style={{ background: '#f8f9fa', padding: '10px 15px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Estimated Time</div>
                <div style={{ fontWeight: 'bold', color: '#1a1a1a' }}>40 Hours</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '10px 15px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Difficulty</div>
                <div style={{ fontWeight: 'bold', color: '#1a1a1a' }}>Intermediate</div>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Course Modules</h3>
            <div style={{ marginBottom: '30px' }}>
              {renderModules(selectedCourse)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {enrolledCourses.includes(selectedCourse.subject_code) ? (
                <button disabled style={{
                  background: '#e0e0e0', color: '#888', border: 'none',
                  padding: '12px 30px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold'
                }}>Already Enrolled ✓</button>
              ) : (
                <button onClick={handleEnrollClick} style={{
                  background: '#3a8aff', color: '#fff', border: 'none', cursor: 'pointer',
                  padding: '12px 30px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold',
                  boxShadow: '0 5px 15px rgba(58,138,255,0.3)', transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#256bcf'}
                onMouseOut={(e) => e.target.style.background = '#3a8aff'}
                >Enroll Now</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP MODAL */}
      {otpModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
          <div style={{
            background: '#fff', width: '400px', borderRadius: '20px', padding: '40px 30px',
            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>Verify Enrollment</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
              We've sent a 4-digit code to your registered email. Enter it below to confirm enrollment.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
              {otp.map((digit, idx) => (
                <input 
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  style={{
                    width: '50px', height: '60px', fontSize: '24px', textAlign: 'center',
                    border: '2px solid #e0e0e0', borderRadius: '12px', background: '#f8f9fa',
                    fontWeight: 'bold', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3a8aff'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setOtpModalOpen(false)} style={{
                flex: 1, background: '#f0f0f0', color: '#1a1a1a', border: 'none',
                padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleVerifyOtp} style={{
                flex: 1, background: '#1a1a1a', color: '#fff', border: 'none',
                padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
              }}>Verify & Enroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
