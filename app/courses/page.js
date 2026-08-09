'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import coursesData from '../../public/data/real_courses_data.json';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';

const ModuleItem = ({ mod }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ 
      marginBottom: '10px', background: '#fff', borderRadius: '12px', 
      overflow: 'hidden', border: '1px solid #e0e0e0',
      boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
      transition: 'all 0.3s'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', background: isOpen ? 'rgba(58, 138, 255, 0.05)' : '#fff', transition: 'background 0.3s' 
        }}
      >
        <h4 style={{ fontWeight: '600', color: isOpen ? '#3a8aff' : '#1a1a1a', margin: 0, fontSize: '14px', flex: 1, paddingRight: '15px' }}>
          {mod.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: '#666', fontWeight: '600', background: '#f0f4f8', padding: '4px 10px', borderRadius: '12px' }}>
            ⏱ {mod.time || "5 Hours"}
          </span>
          <span style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.3s',
            color: '#888', fontSize: '12px'
          }}>▼</span>
        </div>
      </div>
      <div style={{ 
        maxHeight: isOpen ? '1000px' : '0', 
        overflow: 'hidden', 
        transition: 'max-height 0.4s ease-in-out',
        background: '#fcfcfc'
      }}>
        <ul style={{ listStyleType: 'none', padding: '15px 20px', margin: 0 }}>
          {mod.topics && mod.topics.map((topic, tidx) => (
            <li key={tidx} style={{ 
              marginBottom: '10px', fontSize: '13.5px', color: '#333', 
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '12px 18px', background: '#fff', borderRadius: '8px',
              border: '1px solid #eee', borderLeft: '3px solid #3a8aff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.01)'
            }}>
              <span style={{ color: '#3a8aff', fontSize: '14px', lineHeight: '1.5', fontWeight: '900' }}>➤</span>
              <span style={{ lineHeight: '1.5', fontWeight: '500' }}>{topic}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const getDifficultyColor = (diff) => {
  const d = diff || '';
  if (d.includes('Beginner')) return { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' };
  if (d.includes('Intermediate')) return { bg: '#fff8e1', text: '#f57f17', border: '#ffecb3' };
  if (d.includes('Advanced')) return { bg: '#ffebee', text: '#c62828', border: '#ffcdd2' };
  return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
};

const getRelevanceColor = (rel) => {
  const r = rel || '';
  if (r.includes('Demand') || r.includes('Trend')) return { bg: '#f3e5f5', text: '#6a1b9a', border: '#e1bee7' };
  if (r.includes('Foundation') || r.includes('Core') || r.includes('Essential')) return { bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' };
  if (r.includes('Theoretical')) return { bg: '#eceff1', text: '#455a64', border: '#cfd8dc' };
  return { bg: '#e8eaf6', text: '#283593', border: '#c5cae9' };
};

export default function CoursesPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [pendingCourse, setPendingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.subject_code && course.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'All' || course.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Load enrolled courses — from Supabase if logged in, fallback to localStorage
  useEffect(() => {
    async function loadEnrolled() {
      if (user) {
        const { data } = await supabase
          .from('enrollments')
          .select('course_title')
          .eq('user_id', user.id);
        const codes = (data || []).map(e => e.course_title);
        // Also check localStorage for any locally enrolled courses not yet in DB
        const local = JSON.parse(localStorage.getItem('mockEnrolledCoursesV3') || '[]');
        const merged = [...new Set([...codes, ...local])];
        setEnrolledCourses(merged);
      } else {
        const saved = localStorage.getItem('mockEnrolledCoursesV3');
        if (saved) setEnrolledCourses(JSON.parse(saved));
      }
    }
    loadEnrolled();
  }, [user]);

  // ── Handle magic-link return: auto-enroll the pending course ──────────────
  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem('pendingEnrollment');
    if (!pending) return;
    sessionStorage.removeItem('pendingEnrollment');

    const course = JSON.parse(pending);
    (async () => {
      // Check not already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_title', course.course_name)
        .maybeSingle();

      if (existing) return; // already enrolled

      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_title: course.course_name,
        category:     course.subject_code || null,
        progress: 0,
        status:   'Ongoing',
      });
      if (!error) {
        setEnrolledCourses(prev => [...prev, course.course_name]);
        alert('✅ Successfully enrolled in ' + course.course_name + '!');
      }
    })();
  }, [user]);

  const handleEnrollClick = async () => {
    if (!user) { alert('Please sign in to enroll.'); return; }
    setSendingOtp(true);
    try {
      // Store pending enrollment before redirect
      sessionStorage.setItem('pendingEnrollment', JSON.stringify(selectedCourse));

      const appUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${appUrl}/courses`,
        },
      });
      if (error) {
        sessionStorage.removeItem('pendingEnrollment');
        alert('Failed to send verification email: ' + error.message);
        return;
      }
      setOtpModalOpen(true);
    } finally {
      setSendingOtp(false);
    }
  };

  const closeModal = () => {
    setSelectedCourse(null);
    setOtpModalOpen(false);
  };

  const renderModules = (course) => {
    const modulesToRender = course.modules || [];
    if (modulesToRender.length === 0) {
       return <p style={{ color: '#888' }}>No modules available.</p>;
    }

    return modulesToRender.map((mod, idx) => (
      <ModuleItem key={idx} mod={mod} />
    ));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f0f4f8', position: 'relative' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>Course Catalog</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>Explore all available courses and enroll to start your journey.</p>
          
          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search courses by name or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '12px 20px', borderRadius: '12px', border: '1px solid #ccc',
                flex: '1', minWidth: '250px', fontSize: '15px', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterDifficulty(level)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s',
                    background: filterDifficulty === level ? '#3a8aff' : '#e0e0e0',
                    color: filterDifficulty === level ? '#fff' : '#555'
                  }}
                >{level}</button>
              ))}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '25px' 
          }}>
            {filteredCourses.length === 0 ? (
              <p style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No courses match your criteria.</p>
            ) : filteredCourses.map((course, index) => {
              const isEnrolled = enrolledCourses.includes(course.course_name) || enrolledCourses.includes(course.subject_code);
              
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedCourse(course)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: (course.relevance && (course.relevance.includes('Demand') || course.relevance.includes('Trend')))
                              ? '1px solid rgba(138, 43, 226, 0.4)'
                              : '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    padding: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: (course.relevance && (course.relevance.includes('Demand') || course.relevance.includes('Trend'))) 
                                 ? '0 0 35px rgba(138, 43, 226, 0.5)' 
                                 : '0 10px 30px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'visible' // allow badge to overflow
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = (course.relevance && (course.relevance.includes('Demand') || course.relevance.includes('Trend')))
                                                        ? '0 0 45px rgba(138, 43, 226, 0.7)'
                                                        : '0 15px 35px rgba(0,100,255,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = (course.relevance && (course.relevance.includes('Demand') || course.relevance.includes('Trend')))
                                                        ? '0 0 35px rgba(138, 43, 226, 0.5)'
                                                        : '0 10px 30px rgba(0,0,0,0.05)';
                  }}
                >
                  {/* Top gradient border */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '6px',
                    background: 'linear-gradient(90deg, #3a8aff, #800080)',
                    borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
                  }} />



                  {/* Overlapping Badge (Right - Relevance) */}
                  <div style={{
                    position: 'absolute', top: '-12px', right: '20px',
                    background: getRelevanceColor(course.relevance).bg,
                    color: getRelevanceColor(course.relevance).text,
                    border: `1px solid ${getRelevanceColor(course.relevance).border}`,
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    zIndex: 10
                  }}>
                    {course.relevance || "Course"}
                  </div>

                  <div style={{ marginBottom: '15px', marginTop: '10px' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      background: 'rgba(58, 138, 255, 0.1)', 
                      color: '#3a8aff', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                    }}>
                      {course.subject_code || 'General'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '15px', lineHeight: '1.4' }}>
                    {course.course_name}
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>⏱ {course.estimated_time || '45 Hours'}</span>
                    {isEnrolled ? (
                       <div style={{
                         background: 'linear-gradient(135deg, #00b09b, #96c93d)',
                         color: '#fff',
                         border: '1px solid rgba(255,255,255,0.4)',
                         padding: '4px 12px', borderRadius: '20px',
                         fontSize: '11px', fontWeight: '900', 
                         boxShadow: '0 4px 12px rgba(0, 176, 155, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                         letterSpacing: '0.5px', textTransform: 'uppercase',
                         display: 'flex', alignItems: 'center', gap: '4px'
                       }}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         Enrolled
                       </div>
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
        <div 
          onClick={closeModal}
          style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
            background: '#fff', width: '90%', maxWidth: '750px', maxHeight: '85vh',
            borderRadius: '24px', position: 'relative',
            boxShadow: '0 25px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            
            {/* Modal Header (Hero) */}
            <div style={{
              background: selectedCourse.icon ? `linear-gradient(135deg, rgba(26, 41, 128, 0.4) 0%, rgba(38, 208, 206, 0.4) 100%), url(${selectedCourse.icon})` : 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: '40px 30px', color: '#fff', position: 'relative',
              display: 'flex', alignItems: 'center', gap: '25px'
            }}>
              <button 
                onClick={closeModal}
                style={{
                  position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)',
                  border: 'none', width: '35px', height: '35px', borderRadius: '50%', color: '#fff',
                  fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(5px)', transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >✕</button>
              
              <div>
                <span style={{ 
                  display: 'inline-block', 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  color: '#1e3a8a', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontWeight: '800', 
                  fontSize: '13px', 
                  marginBottom: '15px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {selectedCourse.subject_code || 'General'}
                </span>
                <h2 style={{ 
                  fontSize: '32px', 
                  fontWeight: '900', 
                  margin: '0', 
                  lineHeight: '1.2',
                  color: '#ffffff',
                  textShadow: '0px 2px 10px rgba(0,0,0,0.8), 0px 4px 25px rgba(0,0,0,0.6)'
                }}>
                  {selectedCourse.course_name}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '30px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <div style={{ background: '#f8f9fa', padding: '15px 20px', borderRadius: '12px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Time</div>
                  <div style={{ fontWeight: 'bold', color: '#1a1a1a', fontSize: '18px' }}>{selectedCourse.estimated_time || "45 Hours"}</div>
                </div>
                <div style={{ 
                  background: getDifficultyColor(selectedCourse.difficulty).bg, 
                  padding: '15px 20px', borderRadius: '12px', flex: 1,
                  border: `1px solid ${getDifficultyColor(selectedCourse.difficulty).border}`
                }}>
                  <div style={{ fontSize: '12px', color: getDifficultyColor(selectedCourse.difficulty).text, textTransform: 'uppercase', letterSpacing: '1px' }}>Difficulty</div>
                  <div style={{ fontWeight: 'bold', color: getDifficultyColor(selectedCourse.difficulty).text, fontSize: '18px' }}>{selectedCourse.difficulty || "Intermediate"}</div>
                </div>
                <div style={{ 
                  background: getRelevanceColor(selectedCourse.relevance).bg, 
                  padding: '15px 20px', borderRadius: '12px', flex: 1, 
                  border: `1px solid ${getRelevanceColor(selectedCourse.relevance).border}`
                }}>
                  <div style={{ fontSize: '12px', color: getRelevanceColor(selectedCourse.relevance).text, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Relevance</div>
                  <div style={{ fontWeight: 'bold', color: getRelevanceColor(selectedCourse.relevance).text, fontSize: '18px' }}>{selectedCourse.relevance || "High"}</div>
                </div>
              </div>

            {selectedCourse.outcomes && selectedCourse.outcomes.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1a1a1a' }}>Course Outcomes</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {selectedCourse.outcomes.map((co, idx) => (
                    <div key={idx} style={{ 
                      background: '#fff', padding: '15px 20px', borderRadius: '12px',
                      border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
                        color: '#fff', width: '28px', height: '28px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '14px', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ color: '#444', fontSize: '14px', lineHeight: '1.5', fontWeight: '500' }}>
                        {co}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Course Modules</h3>
            <div style={{ marginBottom: '30px' }}>
              {renderModules(selectedCourse)}
            </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                {enrolledCourses.includes(selectedCourse.course_name) ? (
                  <button onClick={() => window.location.href = `/learn/${selectedCourse.subject_code}`} style={{
                    background: '#e0e0e0', color: '#1a1a1a', border: 'none', cursor: 'pointer',
                    padding: '14px 35px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold'
                  }}>Go to Course ➔</button>
                ) : (
                  <button
                    onClick={handleEnrollClick}
                    disabled={sendingOtp}
                    style={{
                      background: sendingOtp ? '#888' : 'linear-gradient(90deg, #1a2980 0%, #26d0ce 100%)',
                      color: '#fff', border: 'none',
                      cursor: sendingOtp ? 'wait' : 'pointer',
                      padding: '14px 35px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
                      boxShadow: '0 10px 20px rgba(38, 208, 206, 0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={(e) => { if (!sendingOtp) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(38, 208, 206, 0.4)'; } }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(38, 208, 206, 0.3)'; }}
                  >{sendingOtp ? 'Sending OTP...' : 'Enroll Now'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL VERIFICATION MODAL */}
      {otpModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
          <div style={{
            background: '#fff', width: '420px', borderRadius: '20px', padding: '40px 30px',
            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
          }}>
            {/* Animated email icon */}
            <div style={{
              width: '72px', height: '72px', background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 10px 25px rgba(26,41,128,0.3)'
            }}>📧</div>

            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>
              Check Your Email
            </h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              We sent a verification link to:
            </p>
            {user?.email && (
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a2980', marginBottom: '20px' }}>
                {user.email}
              </p>
            )}
            <div style={{
              background: '#f0f7ff', border: '1px solid #bde0ff', borderRadius: '12px',
              padding: '16px', marginBottom: '24px', textAlign: 'left'
            }}>
              <p style={{ fontSize: '13px', color: '#333', margin: 0, lineHeight: '1.7' }}>
                <strong>Steps:</strong><br />
                1. Open the email from <strong>Supabase Auth</strong><br />
                2. Click the <strong>"Sign in"</strong> link<br />
                3. You'll be redirected back and <strong>automatically enrolled</strong> ✅
              </p>
            </div>
            <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '24px' }}>
              Link expires in 1 hour · Check spam folder if not received
            </p>
            <button
              onClick={() => setOtpModalOpen(false)}
              style={{
                width: '100%', background: '#f0f0f0', color: '#1a1a1a', border: 'none',
                padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                fontSize: '15px'
              }}
            >Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
