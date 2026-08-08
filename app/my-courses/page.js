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
      const localCodes = JSON.parse(localStorage.getItem('mockEnrolledCoursesV3') || '[]');
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
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important; }
      `}</style>

      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
          <DashboardHeader />

          <div style={{ padding: '0 32px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                My Enrolled Courses 📚
              </h1>
              <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Track your progress and pick up right where you left off.</p>
            </div>

            {/* ── Loading ── */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ height: '12px', width: '30%', background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '6px', marginBottom: '16px' }} />
                    <div style={{ height: '24px', width: '80%', background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '6px', marginBottom: '24px' }} />
                    <div style={{ height: '8px', width: '100%', background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>

            ) : !user ? (
              <div style={{ background: '#fff', padding: '60px', textAlign: 'center', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
                <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>Please sign in to view your courses.</p>
              </div>

            ) : enrolledCourses.length === 0 ? (
              <div style={{ background: '#fff', padding: '80px', textAlign: 'center', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>🎓</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>No Enrolled Courses Yet</h2>
                <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto', lineHeight: '1.5' }}>
                  Your learning journey starts here. Explore our catalog and pick up a new skill today!
                </p>
                <Link href="/courses" className="hover-lift" style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 15px rgba(79,70,229,0.3)' }}>
                  Explore Catalog
                </Link>
              </div>

            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="hover-lift" style={{
                    background: '#fff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '24px', padding: '24px',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {/* Top gradient accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '4px' }}>
                      {course.category ? (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', background: '#e0e7ff', padding: '6px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {course.category}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          General
                        </span>
                      )}
                      <span style={{
                        background: course.status === 'Completed' ? '#dcfce7' : course.status === 'Upcoming' ? '#fef9c3' : '#f1f5f9',
                        color:      course.status === 'Completed' ? '#166534' : course.status === 'Upcoming' ? '#854d0e' : '#475569',
                        padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', flexShrink: 0, textTransform: 'uppercase'
                      }}>
                        {course.status || 'Ongoing'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px', lineHeight: '1.4', flex: 1 }}>
                      {course.course_title}
                    </h2>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
                        <span>Progress</span>
                        <span style={{ color: '#0f172a' }}>{course.progress || 0}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${course.progress || 0}%`, height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: '4px',
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                        Enrolled {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button onClick={() => window.location.href = `/learn/${course.category}`} className="hover-lift" style={{
                        background: '#4f46e5', color: '#fff', border: 'none',
                        padding: '10px 20px', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                        boxShadow: '0 4px 10px rgba(79,70,229,0.2)'
                      }}>
                        Resume ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
