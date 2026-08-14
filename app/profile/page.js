'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { getCourseStudyTime, getLearningStats, getAdvancedAnalytics } from '@/lib/services/studyService';
import { Mail, Phone, MapPin, GraduationCap, Building, BookOpen, Star, Award, TrendingUp, Lock, ArrowRight } from 'lucide-react';
import { BADGES } from '@/lib/data/badges';
import * as Icons from 'lucide-react';
import { useBadges } from '@/lib/context/badge-context';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  // Data state
  const [profileData, setProfileData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courseStudyTime, setCourseStudyTime] = useState({});
  const [userDataForBadges, setUserDataForBadges] = useState(null);
  const [loading, setLoading] = useState(true);
  const { claimedBadges } = useBadges();

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
        const [enrollRes, studyTime, statsData, advanced] = await Promise.all([
          supabase.from('enrollments').select('*').eq('user_id', user.id),
          getCourseStudyTime(user.id),
          getLearningStats(user.id),
          getAdvancedAnalytics(user.id, 30)
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
        
        setUserDataForBadges({
          enrollments: unique,
          uniqueEnrollments: unique.length,
          totalHours: statsData?.total_hours || Object.values(studyTime || {}).reduce((a,b)=>a+b,0),
          activeDays: statsData?.active_days || 0,
          longestSession: statsData?.longest_session_min || 0,
          peakTime: advanced?.peakTime || 'N/A',
          weekendRatio: advanced?.weekendRatio?.weekend || 0,
          courseTime: studyTime || {}
        });
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
  const unlockedBadges = userDataForBadges 
    ? BADGES.filter(b => claimedBadges.includes(b.id))
    : [];
  const topUnlocked = unlockedBadges.slice(0, 3); // show up to 3 here

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f0ff 50%, #eff6ff 100%)', overflowY: 'auto', height: '100vh', paddingBottom: '60px' }}>
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
                    const courseId = course.course_id || `TC-${Math.floor(Math.random()*1000)+100}`;
                    
                    return (
                      <div key={idx} style={{
                        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                        border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s', cursor: 'default'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#bae6fd'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        {/* Decorative background icon */}
                        <BookOpen size={64} color="#f1f5f9" style={{ position: 'absolute', right: '-10px', bottom: '-10px', zIndex: 0, opacity: 0.7, transform: 'rotate(-15deg)' }} />
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ 
                            background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: 800, 
                            padding: '4px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            {courseId}
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

            {/* Achievements Section */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <div style={{ width: '4px', height: '18px', background: '#f59e0b', borderRadius: '4px' }}></div>
                  Latest Achievements
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                
                {loading ? (
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading achievements...</div>
                ) : topUnlocked.length > 0 ? (
                  topUnlocked.map((badge, idx) => {
                    const IconComp = Icons[badge.icon] || Icons.Trophy;
                    return (
                      <div key={idx} style={{
                        background: '#fff', border: `1px solid ${badge.color}40`, borderRadius: '12px',
                        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px',
                        boxShadow: `0 4px 12px ${badge.color}15`, cursor: 'pointer', transition: 'all 0.2s'
                      }} 
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      onClick={() => router.push('/achievements')}>
                        <div style={{ background: badge.color, padding: '10px', borderRadius: '10px', color: '#fff', boxShadow: `0 0 10px ${badge.color}66` }}>
                          <IconComp size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{badge.title}</h3>
                          <p style={{ margin: 0, fontSize: '13px', color: badge.color, fontWeight: '600' }}>{badge.category}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={{
                    background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px',
                    opacity: 0.6
                  }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}><Lock size={20} color="#94a3b8" /></div>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Complete tasks to unlock badges</span>
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
