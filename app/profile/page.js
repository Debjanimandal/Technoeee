'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { Mail, Phone, MapPin, GraduationCap, Building, BookOpen } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  
  // Data state
  const [profileData, setProfileData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      // 1. Load LocalStorage Profile Data
      const saved = localStorage.getItem('user_profile_data');
      if (saved) {
        try { setProfileData(JSON.parse(saved)); } catch (e) {}
      }

      // 2. Load Enrollments
      if (user) {
        const { data } = await supabase.from('enrollments')
          .select('course_id, course_title')
          .eq('user_id', user.id);
        
        // deduplicate by course_title
        const seen = new Set();
        const unique = (data || []).filter(e => {
          const key = e.course_title?.toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setEnrollments(unique);
      }
      setLoading(false);
    };

    loadData();
    window.addEventListener('profile_completion_updated', loadData);
    return () => window.removeEventListener('profile_completion_updated', loadData);
  }, [user, isEditing]);

  // Derived Display Values
  const displayName = profileData?.basicDetails?.name || profile?.username || 'Student Name';
  const displayEmail = profileData?.basicDetails?.email || user?.email;
  const displayPhone = profileData?.personalDetails?.phone;
  const displayLocation = profileData?.personalDetails?.location;
  const displayAbout = profileData?.aboutText;
  const displaySchool = profileData?.educationDetails?.school;
  const displayDegree = profileData?.educationDetails?.degree;
  const avatarLetter = displayName[0]?.toUpperCase() || 'S';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh', paddingBottom: '60px' }}>
        <DashboardHeader />

        <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '20px' }}>
          
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button 
              onClick={() => setIsEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#3a8aff', color: '#fff', border: 'none', padding: '10px 24px', 
                borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(58,138,255,0.2)', transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Edit CV Profile
            </button>
          </div>

          {/* CV Document Container */}
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '48px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
            position: 'relative'
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

            {/* Enrolled Courses (Visual Badges) */}
            <div>
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

          </div>
        </div>
      </div>
      
      <EditProfileModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        onBack={() => setIsEditing(false)} 
      />
    </div>
  );
}
