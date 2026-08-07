'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import coursesData from '../../public/real_courses_data.json';
import Link from 'next/link';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    (async () => {
      setLoading(true);

      // 1. Load existing Supabase enrollments
      const { data: dbData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // 2. Deduplicate in-memory — keep only the FIRST record per course_title
      const seen = new Set();
      const deduped = (dbData || []).filter(e => {
        const key = e.course_title?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // 3. Check localStorage for subject codes not yet in Supabase
      const localCodes = JSON.parse(localStorage.getItem('mockEnrolledCoursesV2') || '[]');
      const dbCategories = deduped.map(e => e.category).filter(Boolean);
      const dbTitles = deduped.map(e => e.course_title?.toLowerCase().trim()).filter(Boolean);

      const notYetSynced = localCodes.filter(code => {
        if (dbCategories.includes(code)) return false; // already by subject code
        const course = coursesData.find(c => c.subject_code === code);
        if (!course) return false;
        if (dbTitles.includes(course.course_name?.toLowerCase().trim())) return false; // already by title
        return true;
      });

      // 4. Migrate missing enrollments → Supabase
      if (notYetSynced.length > 0) {
        const toInsert = notYetSynced
          .map(code => {
            const course = coursesData.find(c => c.subject_code === code);
            if (!course) return null;
            return { user_id: user.id, course_title: course.course_name, category: code, progress: 0, status: 'Ongoing' };
          })
          .filter(Boolean);

        if (toInsert.length > 0) {
          await supabase.from('enrollments').insert(toInsert);
        }

        // Reload and deduplicate again
        const { data: refreshed } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        const seen2 = new Set();
        const deduped2 = (refreshed || []).filter(e => {
          const key = e.course_title?.toLowerCase().trim();
          if (seen2.has(key)) return false;
          seen2.add(key);
          return true;
        });
        setEnrolledCourses(deduped2);
      } else {
        setEnrolledCourses(deduped);
      }

      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f0f4f8' }}>
        <DashboardHeader />

        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>My Enrolled Courses</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Track your progress and pick up right where you left off.</p>

          {/* ── Loading ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[1, 2].map(i => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '16px', padding: '25px',
                  border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ height: '12px', width: '30%', background: '#f0f0f0', borderRadius: '6px', marginBottom: '12px' }} />
                  <div style={{ height: '20px', width: '60%', background: '#f0f0f0', borderRadius: '6px', marginBottom: '16px' }} />
                  <div style={{ height: '8px', width: '100%', background: '#f0f0f0', borderRadius: '4px' }} />
                </div>
              ))}
            </div>

          ) : !user ? (
            <div style={{
              background: 'rgba(255,255,255,0.7)', padding: '50px', textAlign: 'center',
              borderRadius: '16px', border: '1px dashed #ccc',
            }}>
              <p style={{ fontSize: '18px', color: '#888' }}>Please sign in to view your courses.</p>
            </div>

          ) : enrolledCourses.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.7)', padding: '60px', textAlign: 'center',
              borderRadius: '16px', border: '1px dashed #ccc',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>No Enrolled Courses Yet</p>
              <p style={{ fontSize: '15px', color: '#888', marginBottom: '24px' }}>Start your learning journey by enrolling in a course.</p>
              <Link href="/courses" style={{
                display: 'inline-block', background: '#3a8aff', color: '#fff',
                textDecoration: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold',
              }}>Browse Catalog</Link>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {enrolledCourses.map((course) => (
                <div key={course.id} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '16px', padding: '25px',
                  display: 'flex', flexDirection: 'column', gap: '15px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {/* Left accent bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#3a8aff' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      {course.category && (
                        <span style={{ fontSize: '12px', color: '#3a8aff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {course.category}
                        </span>
                      )}
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginTop: '5px' }}>
                        {course.course_title}
                      </h2>
                    </div>
                    <span style={{
                      background: course.status === 'Completed' ? '#d1fae5' : course.status === 'Upcoming' ? '#fef3c7' : '#dbeafe',
                      color:      course.status === 'Completed' ? '#065f46' : course.status === 'Upcoming' ? '#92400e' : '#1e40af',
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', flexShrink: 0,
                    }}>
                      {course.status || 'Ongoing'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                      <span>Progress</span>
                      <span style={{ fontWeight: 'bold' }}>{course.progress || 0}% Completed</span>
                    </div>
                    <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${course.progress || 0}%`, height: '100%',
                        background: 'linear-gradient(90deg, #3a8aff, #00d2ff)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      Enrolled {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button style={{
                      background: '#1a1a1a', color: '#fff', border: 'none',
                      padding: '10px 25px', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                    }}>
                      Resume Course ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
