'use client';
import { useState, useEffect } from 'react';
import { Folder, FileText, X, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase';

// Banner images and colors matching the courses page
const COURSE_BANNER_MAP = {
  'TIU-UCS-T214':       { img: '/course-banners/cpp.png',      color: '#0ea5e9' },
  'TIU-PC-UCS-T22101':  { img: '/course-banners/coa.png',      color: '#f43f5e' },
  'TIU-UCS-T350':       { img: '/course-banners/ai.png',       color: '#8b5cf6' },
  'TIU-UCS-T321':       { img: '/course-banners/daa.png',      color: '#ec4899' },
  'TIU-UCS-T301':       { img: '/course-banners/dbms.png',     color: '#3b82f6' },
  'TIU-UCS-T451':       { img: '/course-banners/ml.png',       color: '#10b981' },
  'TIU-UCS-T304':       { img: '/course-banners/cn.png',       color: '#f59e0b' },
  'TIU-UCS-T351':       { img: '/course-banners/automata.png', color: '#6366f1' },
};

const COURSES_DATA = [
  {
    id: 'dbms', courseId: 'TIU-UCS-T301', title: 'Database Management System',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to DBMS', notes: [
        { id: 'n1', title: 'General Intro to Database Systems.pdf', size: '1.2 MB' },
        { id: 'n2', title: 'File System vs DBMS.pdf', size: '0.8 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Relational Data Model', notes: [
        { id: 'n3', title: 'Relational Algebra Operators.pdf', size: '1.8 MB' },
        { id: 'n4', title: 'Tuple Relational Calculus.pdf', size: '1.1 MB' },
      ]},
      { id: 'm3', title: 'Module 3: SQL', notes: [
        { id: 'n5', title: 'SQL DDL & DML.pdf', size: '2.3 MB' },
        { id: 'n6', title: 'Nested Queries & Aggregation.pdf', size: '1.5 MB' },
      ]},
      { id: 'm4', title: 'Module 4: Dependencies & Normal Forms', notes: [
        { id: 'n7', title: '1NF to BCNF Guide.pdf', size: '3.1 MB' },
      ]},
      { id: 'm5', title: 'Module 5: ER Model', notes: [
        { id: 'n8', title: 'ER Diagrams & EER Model.pdf', size: '2.5 MB' },
      ]},
      { id: 'm6', title: 'Module 6: Data Storage & Indexes', notes: [] },
      { id: 'm7', title: 'Module 7: Transaction Processing & Concurrency', notes: [
        { id: 'n9', title: 'ACID Properties & 2PL Protocol.pdf', size: '2.0 MB' },
      ]},
      { id: 'm8', title: 'Module 8: Database Recovery Techniques', notes: [] },
    ]
  },
  {
    id: 'ml', courseId: 'TIU-UCS-T451', title: 'Machine Learning',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to ML', notes: [
        { id: 'n1', title: 'Types of Machine Learning.pdf', size: '1.4 MB' },
        { id: 'n2', title: 'Feature Selection & Construction.pdf', size: '1.0 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Classification & Concept Learning', notes: [
        { id: 'n3', title: 'Binary Classification & Performance.pdf', size: '1.7 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Linear & Probabilistic Models', notes: [
        { id: 'n4', title: 'Linear Regression.pdf', size: '2.1 MB' },
        { id: 'n5', title: 'Logistic Regression.pdf', size: '1.5 MB' },
        { id: 'n6', title: 'SVMs & Kernel Methods.pdf', size: '1.8 MB' },
      ]},
      { id: 'm4', title: 'Module 4: Distance Based Models', notes: [
        { id: 'n7', title: 'K-Means Clustering.pdf', size: '1.9 MB' },
        { id: 'n8', title: 'PCA Notes.pdf', size: '1.2 MB' },
      ]},
      { id: 'm5', title: 'Module 5: Rule & Tree Based Models', notes: [] },
      { id: 'm6', title: 'Module 6: Trends in ML', notes: [] },
    ]
  },
  {
    id: 'ai', courseId: 'TIU-UCS-T350', title: 'Artificial Intelligence',
    modules: [
      { id: 'm1', title: 'Module 1: Basics of AI', notes: [
        { id: 'n1', title: 'Intelligent Agents Overview.pdf', size: '1.6 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Search Algorithms & Problem Solving', notes: [
        { id: 'n2', title: 'A* Search Algorithm.pdf', size: '4.2 MB' },
        { id: 'n3', title: 'Minimax & Alpha-Beta Pruning.pdf', size: '1.7 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Knowledge & Reasoning', notes: [
        { id: 'n4', title: 'Predicate Logic Representation.pdf', size: '2.2 MB' },
        { id: 'n5', title: 'Bayesian Networks.pdf', size: '1.9 MB' },
      ]},
      { id: 'm4', title: 'Module 4: NLP & Expert Systems', notes: [] },
    ]
  },
  {
    id: 'cn', courseId: 'TIU-UCS-T304', title: 'Computer Network',
    modules: [
      { id: 'm1', title: 'Module 1: OSI & TCP/IP Models', notes: [
        { id: 'n1', title: 'OSI Reference Model.pdf', size: '2.8 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Data Link Layer', notes: [
        { id: 'n2', title: 'Sliding Window Protocols.pdf', size: '2.1 MB' },
        { id: 'n3', title: 'MAC Protocols & CSMA.pdf', size: '1.6 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Network Layer', notes: [
        { id: 'n4', title: 'IPv4 Addressing & Routing.pdf', size: '3.0 MB' },
      ]},
      { id: 'm4', title: 'Module 4: Transport Layer', notes: [
        { id: 'n5', title: 'TCP & UDP Protocols.pdf', size: '2.4 MB' },
      ]},
      { id: 'm5', title: 'Module 5: Application Layer', notes: [] },
    ]
  },
  {
    id: 'daa', courseId: 'TIU-UCS-T321', title: 'Design and Analysis of Algorithm',
    modules: [
      { id: 'm1', title: 'Module 1: Foundation & Analysis', notes: [
        { id: 'n1', title: 'Asymptotic Notations.pdf', size: '1.5 MB' },
        { id: 'n2', title: 'Master Theorem.pdf', size: '1.1 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Algorithmic Paradigms', notes: [
        { id: 'n3', title: 'Divide & Conquer.pdf', size: '1.8 MB' },
        { id: 'n4', title: 'Greedy & Dynamic Programming.pdf', size: '2.3 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Graph Algorithms', notes: [
        { id: 'n5', title: 'Dijkstra & Bellman-Ford.pdf', size: '2.0 MB' },
      ]},
      { id: 'm4', title: 'Module 4: NP-Completeness', notes: [] },
      { id: 'm5', title: 'Module 5: Advanced Topics', notes: [] },
    ]
  },
  {
    id: 'oop', courseId: 'TIU-UCS-T214', title: 'Object Oriented Programming using C++',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to OOP', notes: [
        { id: 'n1', title: 'OOP vs POP.pdf', size: '1.1 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Basic Concepts of OOP', notes: [
        { id: 'n2', title: 'Classes, Objects & Encapsulation.pdf', size: '1.4 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Fundamentals of OOPs', notes: [
        { id: 'n3', title: 'Inheritance & Polymorphism.pdf', size: '2.0 MB' },
        { id: 'n4', title: 'Virtual Functions & Abstract Classes.pdf', size: '1.5 MB' },
      ]},
      { id: 'm4', title: 'Module 4: Advanced OOP Concepts', notes: [] },
    ]
  },
  {
    id: 'coa', courseId: 'TIU-PC-UCS-T22101', title: 'Computer Organization and Architecture',
    modules: [
      { id: 'm1', title: 'Module 1: Introduction to Computer Systems', notes: [
        { id: 'n1', title: "Von Neumann Model & Flynn's Taxonomy.pdf", size: '1.9 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Data Representation & Arithmetic', notes: [
        { id: 'n2', title: "Booth's Algorithm.pdf", size: '1.3 MB' },
      ]},
      { id: 'm3', title: 'Module 3: ISA & CPU Organization', notes: [
        { id: 'n3', title: 'Instruction Set Architecture.pdf', size: '2.2 MB' },
        { id: 'n4', title: 'Control Unit: Hardwired vs Microprogrammed.pdf', size: '1.7 MB' },
      ]},
      { id: 'm4', title: 'Module 4: Memory & I/O Organization', notes: [
        { id: 'n5', title: 'Cache Memory & Virtual Memory.pdf', size: '2.4 MB' },
      ]},
      { id: 'm5', title: 'Module 5: Pipelining & ILP', notes: [] },
      { id: 'm6', title: 'Module 6: Multiprocessors & Advanced Architectures', notes: [] },
    ]
  },
  {
    id: 'automata', courseId: 'TIU-UCS-T351', title: 'Automata Theory & Compiler Design',
    modules: [
      { id: 'm1', title: 'Module 1: Regular Languages & Finite Automata', notes: [
        { id: 'n1', title: 'DFA & NFA Equivalence.pdf', size: '2.1 MB' },
        { id: 'n2', title: 'Pumping Lemma for Regular Languages.pdf', size: '1.4 MB' },
      ]},
      { id: 'm2', title: 'Module 2: Context-Free Grammar & Languages', notes: [
        { id: 'n3', title: 'CFG, PDA & Chomsky Normal Form.pdf', size: '2.8 MB' },
      ]},
      { id: 'm3', title: 'Module 3: Turing Machines', notes: [] },
      { id: 'm4', title: 'Module 4: Undecidability', notes: [] },
    ]
  },
];

export default function SavedNotesTab() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(null); // null = loading
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (!user) { setEnrolledCourses([]); return; }
    (async () => {
      const { data } = await supabase.from('enrollments').select('category, course_title').eq('user_id', user.id);
      const dbItems = (data || []).flatMap(e => [e.category?.toLowerCase().trim(), e.course_title?.toLowerCase().trim()]).filter(Boolean);
      const local = JSON.parse(localStorage.getItem('mockEnrolledCoursesV3') || '[]').map(s => s?.toLowerCase().trim()).filter(Boolean);
      setEnrolledCourses([...new Set([...dbItems, ...local])]);
    })();
  }, [user]);

  const filteredCourses = enrolledCourses === null ? [] : COURSES_DATA.filter(c => {
    const idMatch = enrolledCourses.includes(c.courseId.toLowerCase().trim());
    const titleMatch = enrolledCourses.some(e => e.includes(c.title.toLowerCase().trim().substring(0, 15)) || c.title.toLowerCase().trim().includes(e.substring(0, 15)));
    return idMatch || titleMatch;
  });

  if (enrolledCourses === null) {
    return <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '16px' }}>Loading your notes...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '600px' }}>
      {/* Left Pane */}
      <div style={{ flex: '1', padding: '32px', borderRight: '1px solid #f1f5f9', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>My Saved Notes</h2>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>Click on a subject folder to view its modules and saved PDFs.</p>

        {filteredCourses.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
            <Folder size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500' }}>No enrolled courses found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {filteredCourses.map(course => {
              const meta = COURSE_BANNER_MAP[course.courseId] || { img: '/course-banners/dbms.png', color: '#64748b' };
              const totalPdfs = course.modules.reduce((acc, m) => acc + m.notes.length, 0);
              const isSelected = selectedCourse?.id === course.id;
              
              return (
                <div
                  key={course.id}
                  onClick={() => { setSelectedCourse(course); setExpandedModule(null); }}
                  style={{
                    background: '#ffffff', borderRadius: '20px',
                    border: isSelected ? `2px solid ${meta.color}` : '2px solid transparent',
                    boxShadow: isSelected ? `0 8px 24px ${meta.color}25` : '0 4px 16px rgba(0,0,0,0.05)',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                  onMouseOver={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; } }}
                  onMouseOut={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; } }}
                >
                  {/* Banner Image */}
                  <div style={{ height: '140px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${meta.color}30 0%, ${meta.color}10 100%)` }}>
                    {!imageErrors[course.id] ? (
                      <img
                        src={meta.img}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImageErrors(prev => ({ ...prev, [course.id]: true }))}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={64} color={meta.color} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: meta.color, letterSpacing: '0.5px', background: `${meta.color}15`, display: 'inline-block', padding: '4px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                      {course.courseId}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', lineHeight: '1.4' }}>{course.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                      <Folder size={15} /> {totalPdfs} Saved PDFs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Pane - Sticky */}
      <div style={{ flex: '1', background: '#fafbfc', position: 'sticky', top: 0, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        {!selectedCourse ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '48px' }}>
            <Folder size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', textAlign: 'center' }}>Select a subject folder to view its modules and notes</p>
          </div>
        ) : (
          <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '1px' }}>SUBJECT</span>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedCourse.title}</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {selectedCourse.modules.length} Modules • {selectedCourse.modules.reduce((a, m) => a + m.notes.length, 0)} Saved PDFs
                </p>
              </div>
              <button onClick={() => setSelectedCourse(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Modules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedCourse.modules.map(module => {
                const meta = COURSE_BANNER_MAP[selectedCourse.courseId] || { color: '#64748b' };
                const isExpanded = expandedModule === module.id;

                return (
                  <div key={module.id} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div
                      onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                      style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#ffffff', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Folder size={20} color={isExpanded ? meta.color : '#94a3b8'} />
                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{module.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{module.notes.length} files</span>
                        {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#94a3b8" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {module.notes.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '10px', fontStyle: 'italic' }}>
                            No notes saved for this module yet.
                          </div>
                        ) : (
                          module.notes.map(note => (
                            <div key={note.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={18} color="#ef4444" />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{note.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{note.size}</span>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} title="Download">
                                  <Download size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
