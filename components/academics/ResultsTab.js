'use client';
import { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, ChevronDown, ChevronUp, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase';

const COURSE_BANNER_MAP = {
  'TIU-UCS-T214':       { color: '#0ea5e9' },
  'TIU-PC-UCS-T22101':  { color: '#f43f5e' },
  'TIU-UCS-T350':       { color: '#8b5cf6' },
  'TIU-UCS-T321':       { color: '#ec4899' },
  'TIU-UCS-T301':       { color: '#3b82f6' },
  'TIU-UCS-T451':       { color: '#10b981' },
  'TIU-UCS-T304':       { color: '#f59e0b' },
  'TIU-UCS-T351':       { color: '#6366f1' },
};

// Grade utility
function getGrade(percent) {
  if (percent >= 90) return { letter: 'O',   gp: 10, label: 'Outstanding' };
  if (percent >= 80) return { letter: 'A+',  gp: 9,  label: 'Excellent' };
  if (percent >= 70) return { letter: 'A',   gp: 8,  label: 'Very Good' };
  if (percent >= 60) return { letter: 'B+',  gp: 7,  label: 'Good' };
  if (percent >= 50) return { letter: 'B',   gp: 6,  label: 'Above Average' };
  if (percent >= 40) return { letter: 'C',   gp: 5,  label: 'Average' };
  return { letter: 'F', gp: 0, label: 'Fail' };
}

const MOCK_RESULTS = [
  {
    courseId: 'TIU-UCS-T301', title: 'Database Management System', credits: 4, completed: true, progress: 100,
    modules: [
      { name: 'Module 1: Introduction to DBMS',          quiz: 'Module 1 Mandatory Quiz',        maxMarks: 20, obtained: 17, attempts: 1 },
      { name: 'Module 2: Relational Data Model',          quiz: 'Module 2 Mandatory Quiz',        maxMarks: 20, obtained: 19, attempts: 2 },
      { name: 'Module 3: SQL',                            quiz: 'Module 3 Mandatory Quiz',        maxMarks: 20, obtained: 18, attempts: 1 },
      { name: 'Module 4: Normal Forms',                   quiz: 'Module 4 Mandatory Quiz',        maxMarks: 20, obtained: 16, attempts: 2 },
      { name: 'Module 5: ER Model',                       quiz: 'Module 5 Mandatory Quiz',        maxMarks: 20, obtained: 17, attempts: 1 },
      { name: 'Module 6: Data Storage & Indexes',         quiz: 'Module 6 Mandatory Quiz',        maxMarks: 20, obtained: 15, attempts: 1 },
      { name: 'Module 7: Transaction Processing',         quiz: 'Module 7 Mandatory Quiz',        maxMarks: 20, obtained: 18, attempts: 1 },
      { name: 'Module 8: Recovery Techniques',            quiz: 'Module 8 Mandatory Quiz',        maxMarks: 20, obtained: 16, attempts: 1 },
      { name: 'Grand Final',                              quiz: 'DBMS Grand Final Assessment',    maxMarks: 100, obtained: 88, attempts: 1 },
    ]
  },
  {
    courseId: 'TIU-UCS-T451', title: 'Machine Learning', credits: 4, completed: false, progress: 40,
    modules: [
      { name: 'Module 1: Introduction to ML',             quiz: 'Module 1 Mandatory Quiz',        maxMarks: 20, obtained: 14, attempts: 1 },
      { name: 'Module 2: Classification & Learning',      quiz: 'Module 2 Mandatory Quiz',        maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 3: Linear & Probabilistic Models',  quiz: 'Module 3 Mandatory Quiz',        maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 4: Distance Based Models',          quiz: 'Module 4 Mandatory Quiz',        maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 5: Rule & Tree Based Models',       quiz: 'Module 5 Mandatory Quiz',        maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 6: Trends in ML',                   quiz: 'Module 6 Mandatory Quiz',        maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                              quiz: 'ML Grand Final Assessment',      maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
  {
    courseId: 'TIU-UCS-T350', title: 'Artificial Intelligence', credits: 4, completed: false, progress: 25,
    modules: [
      { name: 'Module 1: Basics of AI',                    quiz: 'Module 1 Mandatory Quiz',       maxMarks: 20, obtained: 16, attempts: 1 },
      { name: 'Module 2: Search Algorithms',               quiz: 'Module 2 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 3: Knowledge & Reasoning',           quiz: 'Module 3 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 4: NLP & Expert Systems',            quiz: 'Module 4 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                               quiz: 'AI Grand Final Assessment',     maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
  {
    courseId: 'TIU-UCS-T304', title: 'Computer Network', credits: 4, completed: false, progress: 10,
    modules: [
      { name: 'Module 1: OSI & TCP/IP',                    quiz: 'Module 1 Mandatory Quiz',       maxMarks: 30, obtained: 28, attempts: 1 },
      { name: 'Module 2: Data Link Layer',                  quiz: 'Module 2 Mandatory Quiz',       maxMarks: 30, obtained: null, attempts: 0 },
      { name: 'Module 3: Network Layer',                    quiz: 'Module 3 Mandatory Quiz',       maxMarks: 30, obtained: null, attempts: 0 },
      { name: 'Module 4: Transport Layer',                  quiz: 'Module 4 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 5: Application Layer',                quiz: 'Module 5 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                                quiz: 'CN Grand Final Assessment',    maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
  {
    courseId: 'TIU-UCS-T321', title: 'Design and Analysis of Algorithm', credits: 4, completed: true, progress: 100,
    modules: [
      { name: 'Module 1: Foundation & Analysis',           quiz: 'Module 1 Mandatory Quiz',       maxMarks: 20, obtained: 17, attempts: 2 },
      { name: 'Module 2: Algorithmic Paradigms',           quiz: 'Module 2 Mandatory Quiz',       maxMarks: 20, obtained: 18, attempts: 1 },
      { name: 'Module 3: Graph Algorithms',                quiz: 'Module 3 Mandatory Quiz',       maxMarks: 20, obtained: 16, attempts: 1 },
      { name: 'Module 4: NP-Completeness',                 quiz: 'Module 4 Mandatory Quiz',       maxMarks: 20, obtained: 15, attempts: 2 },
      { name: 'Module 5: Advanced Topics',                 quiz: 'Module 5 Mandatory Quiz',       maxMarks: 20, obtained: 17, attempts: 1 },
      { name: 'Grand Final',                               quiz: 'DAA Grand Final Assessment',    maxMarks: 100, obtained: 88, attempts: 1 },
    ]
  },
  {
    courseId: 'TIU-UCS-T214', title: 'Object Oriented Programming using C++', credits: 4, completed: false, progress: 15,
    modules: [
      { name: 'Module 1: Introduction to OOP',             quiz: 'Module 1 Mandatory Quiz',       maxMarks: 20, obtained: 12, attempts: 1 },
      { name: 'Module 2: Basic Concepts of OOP',           quiz: 'Module 2 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 3: Fundamentals of OOPs',            quiz: 'Module 3 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 4: Advanced OOP Concepts',           quiz: 'Module 4 Mandatory Quiz',       maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                               quiz: 'OOP Grand Final Assessment',    maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
  {
    courseId: 'TIU-PC-UCS-T22101', title: 'Computer Organization and Architecture', credits: 4, completed: false, progress: 0,
    modules: [
      { name: 'Module 1: Introduction to Computer Systems', quiz: 'Module 1 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 2: Data Representation & Arithmetic', quiz: 'Module 2 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 3: ISA & CPU Organization',           quiz: 'Module 3 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 4: Memory & I/O Organization',        quiz: 'Module 4 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 5: Pipelining & ILP',                 quiz: 'Module 5 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 6: Multiprocessors & Adv. Arch.',     quiz: 'Module 6 Mandatory Quiz',      maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                                quiz: 'COA Grand Final Assessment',   maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
  {
    courseId: 'TIU-UCS-T351', title: 'Automata Theory & Compiler Design', credits: 4, completed: false, progress: 0,
    modules: [
      { name: 'Module 1: Regular Languages & Finite Automata', quiz: 'Module 1 Mandatory Quiz',   maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 2: Context-Free Grammar',                quiz: 'Module 2 Mandatory Quiz',   maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 3: Turing Machines',                     quiz: 'Module 3 Mandatory Quiz',   maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Module 4: Undecidability',                      quiz: 'Module 4 Mandatory Quiz',   maxMarks: 20, obtained: null, attempts: 0 },
      { name: 'Grand Final',                                   quiz: 'Automata Grand Final',      maxMarks: 100, obtained: null, attempts: 0 },
    ]
  },
];

export default function ResultsTab() {
  const { user } = useAuth();
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(null);

  useEffect(() => {
    if (!user) { setEnrolledCourses([]); return; }
    (async () => {
      const { data } = await supabase.from('enrollments').select('category, course_title').eq('user_id', user.id);
      const dbItems = (data || []).flatMap(e => [e.category?.toLowerCase().trim(), e.course_title?.toLowerCase().trim()]).filter(Boolean);
      const local = JSON.parse(localStorage.getItem('mockEnrolledCoursesV3') || '[]').map(s => s?.toLowerCase().trim()).filter(Boolean);
      setEnrolledCourses([...new Set([...dbItems, ...local])]);
    })();
  }, [user]);

  const filteredCourses = (enrolledCourses === null ? [] : MOCK_RESULTS.filter(c => {
    const idMatch = enrolledCourses.includes(c.courseId.toLowerCase().trim());
    const titleMatch = enrolledCourses.some(e => e.includes(c.title.toLowerCase().trim().substring(0, 15)) || c.title.toLowerCase().trim().includes(e.substring(0, 15)));
    return idMatch || titleMatch;
  }));

  if (enrolledCourses === null) {
    return <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '16px' }}>Loading marksheets...</div>;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <GraduationCap size={34} color="#3b82f6" />
          Official Course Marksheets
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Based on highest scores across all attempts. Grade is calculated per module quiz. PDF downloads unlock at 100% course completion.
        </p>
      </div>

      {filteredCourses.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>No enrolled courses found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredCourses.map(course => {
            const meta = COURSE_BANNER_MAP[course.courseId] || { color: '#64748b' };
            const isExpanded = expandedCourse === course.courseId;
            
            // Compute course-level SGPA from completed modules only
            const completedModules = course.modules.filter(m => m.obtained !== null && m.maxMarks);
            const totalCreditsAttempted = completedModules.length > 0 ? course.credits : 0;
            const sgpa = completedModules.length > 0
              ? (completedModules.reduce((sum, m) => {
                  const pct = (m.obtained / m.maxMarks) * 100;
                  return sum + getGrade(pct).gp;
                }, 0) / completedModules.length).toFixed(2)
              : null;

            return (
              <div key={course.courseId} style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${isExpanded ? meta.color + '55' : '#e2e8f0'}`, transition: 'all 0.25s ease' }}>
                {/* Course Header */}
                <div onClick={() => setExpandedCourse(isExpanded ? null : course.courseId)}
                  style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? `${meta.color}08` : '#fff', borderBottom: isExpanded ? `1px solid ${meta.color}25` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '18px', flexShrink: 0 }}>
                      {course.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{course.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '3px 10px', borderRadius: '8px' }}>{course.courseId}</span>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Credits: {course.credits}</span>
                        <span style={{ fontSize: '13px', color: course.completed ? '#10b981' : '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {course.completed && <CheckCircle size={14} />}
                          {course.completed ? 'Completed' : `${course.progress}% In Progress`}
                        </span>
                        {sgpa && (
                          <span style={{ fontSize: '13px', fontWeight: '800', color: meta.color, background: `${meta.color}15`, padding: '3px 10px', borderRadius: '8px' }}>
                            SGPA: {sgpa}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      disabled={!course.completed}
                      onClick={e => { e.stopPropagation(); alert('PDF Download – will be linked once backend is ready.'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: course.completed ? '#e0f2fe' : '#f1f5f9', color: course.completed ? '#0284c7' : '#94a3b8', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: course.completed ? 'pointer' : 'not-allowed', opacity: course.completed ? 1 : 0.5, whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                    >
                      <Download size={16} /> Download Marksheet
                    </button>
                    {isExpanded ? <ChevronUp size={22} color="#94a3b8" /> : <ChevronDown size={22} color="#94a3b8" />}
                  </div>
                </div>

                {/* Marksheet Table */}
                {isExpanded && (
                  <div style={{ background: '#fff' }}>
                    {/* Watermark header inside the transcript */}
                    <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Academic Year 2025-26</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>TECHNOEEE Learning Platform</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>GRADING SCALE</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>O(10) · A+(9) · A(8) · B+(7) · B(6) · C(5) · F(0)</p>
                      </div>
                    </div>

                    <div style={{ padding: '16px 28px 28px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderRadius: '12px' }}>
                            <th style={{ textAlign: 'left', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Module</th>
                            <th style={{ textAlign: 'left', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Assessment</th>
                            <th style={{ textAlign: 'center', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Attempts</th>
                            <th style={{ textAlign: 'center', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Max Marks</th>
                            <th style={{ textAlign: 'center', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Marks Obtained</th>
                            <th style={{ textAlign: 'center', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Grade</th>
                            <th style={{ textAlign: 'center', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Grade Point</th>
                          </tr>
                        </thead>
                        <tbody>
                          {course.modules.map((mod, i) => {
                            const isPending = mod.obtained === null;
                            const pct = isPending ? null : Math.round((mod.obtained / mod.maxMarks) * 100);
                            const grade = isPending ? null : getGrade(pct);

                            return (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.15s' }}>
                                <td style={{ padding: '16px', color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>{mod.name}</td>
                                <td style={{ padding: '16px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{mod.quiz}</td>
                                <td style={{ padding: '16px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>{mod.attempts}</td>
                                <td style={{ padding: '16px', color: '#64748b', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>{mod.maxMarks}</td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                  {isPending ? (
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>
                                  ) : (
                                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{mod.obtained}</span>
                                  )}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                  {isPending ? (
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                                  ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', fontWeight: '900', fontSize: '14px', background: grade.gp >= 8 ? '#dcfce7' : grade.gp >= 6 ? '#fef9c3' : grade.gp >= 4 ? '#fed7aa' : '#fee2e2', color: grade.gp >= 8 ? '#166534' : grade.gp >= 6 ? '#854d0e' : grade.gp >= 4 ? '#9a3412' : '#991b1b' }}>
                                      {grade.letter}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                  {isPending ? (
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                                  ) : (
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: meta.color }}>{grade.gp}.0</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                        {/* Summary Footer */}
                        {completedModules.length > 0 && (
                          <tfoot>
                            <tr style={{ background: `${meta.color}08`, borderTop: '2px solid #e2e8f0' }}>
                              <td colSpan={3} style={{ padding: '16px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                Course Summary ({completedModules.length}/{course.modules.length} modules graded)
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>—</td>
                              <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>—</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: meta.color }}>SGPA</span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span style={{ fontSize: '20px', fontWeight: '900', color: meta.color, background: `${meta.color}15`, padding: '6px 14px', borderRadius: '12px', display: 'inline-block' }}>{sgpa}</span>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
