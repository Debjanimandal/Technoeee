'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { getCourseStudyTime } from '@/lib/services/studyService';
import { Mail, Phone, MapPin, GraduationCap, Building, Star, Award, TrendingUp, Lock } from 'lucide-react';

const COURSE_BANNER_MAP = {
  'TIU-UCS-T214':      '/course-banners/cpp.png',
  'TIU-PC-UCS-T22101': '/course-banners/coa.png',
  'TIU-UCS-T350':      '/course-banners/ai.png',
  'TIU-UCS-T321':      '/course-banners/daa.png',
  'TIU-UCS-T301':      '/course-banners/dbms.png',
  'TIU-UCS-T451':      '/course-banners/ml.png',
  'TIU-UCS-T304':      '/course-banners/cn.png',
  'TIU-UCS-T351':      '/course-banners/automata.png',
};

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  // Data state
  const [profileData, setProfileData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courseStudyTime, setCourseStudyTime] = useState({});
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      // 1. Load LocalStorage Profile Data
      const saved = localStorage.getItem('user_profile_data');
      if (saved) {
        try { setProfileData(JSON.parse(saved)); } catch (e) {}
      }

      // 2. Load Enrollments and Analytics
      if (user) {
        const [enrollRes, studyTime] = await Promise.all([
          supabase.from('enrollments').select('*').eq('user_id', user.id),
          getCourseStudyTime(user.id)
        ]);
        
        // deduplicate by course_title
        let unique = (enrollRes.data || []).filter((e, i, a) => a.findIndex(x => x.course_title === e.course_title) === i);
        
        // Fallback if supabase hasn't populated yet
        if (unique.length === 0) {
           unique = [
            { course_id: 'TIU-UCS-T351', course_title: 'Automata Theory & Compiler Design', progress: 0 },
            { course_id: 'TIU-UCS-T214', course_title: 'Object Oriented Programming using C++', progress: 0 },
            { course_id: 'TIU-UCS-T304', course_title: 'Computer Network', progress: 0 },
            { course_id: 'TIU-PC-UCS-T22101', course_title: 'Computer Organization and Architecture', progress: 0 },
            { course_id: 'TIU-UCS-T451', course_title: 'Machine Learning', progress: 0 }
           ];
        }
        setEnrollments(unique);
        setCourseStudyTime(studyTime || {});
      }
      setLoading(false);
    };

    loadData();
    window.addEventListener('profile_completion_updated', loadData);
    return () => window.removeEventListener('profile_completion_updated', loadData);
  }, [user]);

  // Derived Display Values
  const displayName = profileData?.basicDetails?.name || profile?.username || 'Student Name';
  const displayEmail = profileData?.basicDetails?.email || user?.email;
  const displayPhone = profileData?.personalDetails?.phone;
  const displayLocation = profileData?.personalDetails?.location;
  const displayAbout = profileData?.aboutText;
  const displaySchool = profileData?.educationDetails?.school;
  const displayDegree = profileData?.educationDetails?.degree;
  const avatarLetter = displayName[0]?.toUpperCase() || 'S';

  // Compute Genuine Strengths
  const strongCourses = [];
  if (enrollments.length > 0) {
    const maxH = Math.max(...Object.values(courseStudyTime), 0.001);
    const scored = enrollments.map(e => {
      const hours = courseStudyTime[e.course_title] || 0;
      const studyScore = (hours / maxH) * 100;
      const progress   = e.progress || 0;
      const composite  = Math.round(progress * 0.6 + studyScore * 0.4);
      return { ...e, composite };
    }).sort((a, b) => b.composite - a.composite);
    strongCourses.push(...scored.filter(e => e.composite >= 50));
  }
  
  // Dynamic Achievements
  const hasFastStarter = enrollments.length >= 5;
  const hasConsistentLearner = Object.values(courseStudyTime).reduce((a, b) => a + b, 0) > 10; // > 10 hours total

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh', paddingBottom: '60px' }}>
        <DashboardHeader />

        <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '20px' }}>
          
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button 
              onClick={() => {
                sessionStorage.setItem('keepProfileOpen', 'true');
                router.back();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
                fontSize: '14px', fontWeight: '700', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>

          {/* Profile Document Container (A4 Style) */}
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '48px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
            position: 'relative', minHeight: '1050px' // A4 approximation
          }}>
             {/* Verified Badge */}
             <div style={{
              position: 'absolute', top: '48px', right: '48px', display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f0fdf4', color: '#166534', padding: '8px 16px', borderRadius: '30px', 
              fontWeight: 700, fontSize: '13px', border: '1px solid #bbf7d0'
            }}>
              <img src="/image/logo.png" alt="Techno EEE" style={{ height: '18px' }} />
              Verified Profile
            </div>

            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px', fontWeight: '800',
                boxShadow: '0 12px 24px rgba(59,130,246,0.3)', flexShrink: 0
              }}>
                {avatarLetter}
              </div>
              
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-1px' }}>
                  {displayName}
                </h1>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                  {displayEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="#64748b" /> {displayEmail}
                    </div>
                  )}
                  {displayPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={16} color="#64748b" /> {displayPhone}
                    </div>
                  )}
                  {displayLocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#64748b" /> {displayLocation}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid #f1f5f9', margin: '32px 0' }} />

            {/* Professional Summary */}
            {displayAbout && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                  Professional Summary
                </h2>
                <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                  {displayAbout}
                </p>
              </div>
            )}

            {/* Education */}
            {(displaySchool || displayDegree) && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                  Education Background
                </h2>
                <div style={{ 
                  background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'flex-start', gap: '16px' 
                }}>
                  <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '12px' }}>
                    <Building size={24} color="#0284c7" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{displaySchool || 'Institution Name'}</h3>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: 500 }}>
                      <GraduationCap size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                      {displayDegree || 'Degree Information'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strong Foundations */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                Strong Foundations
              </h2>
              {strongCourses.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {strongCourses.map((s, idx) => (
                    <div key={idx} style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <TrendingUp size={20} color="#16a34a" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>{s.course_title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                  Keep learning and scoring high progress to unlock your core strengths!
                </div>
              )}
            </div>

            {/* Enrolled Courses (Visual Badges) */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                Active Course Enrollments
              </h2>
              
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading courses...</div>
              ) : enrollments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {enrollments.map((course, idx) => {
                    // Use category (subject_code) for banner; fallback to course_id from profile data
                    const subjectCode = course.category || course.course_id || '';
                    return (
                      <div key={idx} style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0', borderRadius: '14px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s', cursor: 'default'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#bae6fd'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
                      >
                        {/* Banner thumbnail */}
                        <div style={{ position: 'relative', height: '110px', overflow: 'hidden' }}>
                          <img
                            src={COURSE_BANNER_MAP[subjectCode] || '/course-banners/cpp.png'}
                            alt={course.course_title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.45) 100%)' }} />
                        </div>

                        {/* Card body */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{
                            background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: 800,
                            padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px',
                            letterSpacing: '0.5px'
                          }}>
                            {subjectCode || 'General'}
                          </div>
                          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.4 }}>
                            {course.course_title}
                          </h3>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
                  No active enrollments found.
                </div>
              )}
            </div>

            {/* Achievements */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                Key Achievements
              </h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* Fast Starter */}
                {hasFastStarter ? (
                  <div style={{
                    background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 200px'
                  }}>
                    <div style={{ background: '#ede9fe', padding: '10px', borderRadius: '10px' }}>
                      <Star size={24} color="#7c3aed" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#5b21b6', margin: '0 0 4px 0' }}>Fast Starter</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#7c3aed' }}>Enrolled in 5+ subjects.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px',
                    opacity: 0.6
                  }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}><Lock size={20} color="#94a3b8" /></div>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Enroll in 5+ subjects</span>
                  </div>
                )}

                {/* Consistent Learner */}
                {hasConsistentLearner ? (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 200px'
                  }}>
                    <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '10px' }}>
                      <Award size={24} color="#d97706" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', margin: '0 0 4px 0' }}>Dedicated Learner</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>Accumulated over 10 hours of study.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px',
                    opacity: 0.6
                  }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}><Lock size={20} color="#94a3b8" /></div>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Study for 10+ hours</span>
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
