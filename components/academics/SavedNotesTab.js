'use client';
import { useState } from 'react';
import { Folder, FileText, X, ChevronDown, ChevronRight, Download } from 'lucide-react';

const COURSES_DATA = [
  {
    id: 'dbms',
    courseId: 'TIU-UCS-T301',
    title: 'Database Management System',
    color: '#3b82f6', // Blue
    image: '/course-banners/dbms.png',
    modules: [
      { 
        id: 'm1', title: 'Module 1: Intro & ER Model', 
        notes: [{ id: 'n1', title: 'Topic 1: DBMS Architecture.pdf', size: '1.2 MB' }, { id: 'n2', title: 'Topic 2: ER Diagrams.pdf', size: '2.5 MB' }] 
      },
      { 
        id: 'm2', title: 'Module 2: Relational Model', 
        notes: [{ id: 'n3', title: 'Topic 1: Relational Algebra.pdf', size: '1.8 MB' }] 
      },
      { 
        id: 'm3', title: 'Module 3: Normalization', 
        notes: [{ id: 'n4', title: 'Topic 1: 1NF to BCNF.pdf', size: '3.1 MB' }, { id: 'n5', title: 'Topic 2: Transaction Management.pdf', size: '2.0 MB' }] 
      }
    ]
  },
  {
    id: 'ml',
    courseId: 'TIU-UCS-T451',
    title: 'Machine Learning',
    color: '#10b981', // Emerald
    image: '/course-banners/ml.png',
    modules: [
      { 
        id: 'm1', title: 'Module 1: Supervised Learning', 
        notes: [{ id: 'n1', title: 'Linear Regression.pdf', size: '2.1 MB' }, { id: 'n2', title: 'Logistic Regression.pdf', size: '1.5 MB' }] 
      },
      { 
        id: 'm2', title: 'Module 2: Unsupervised Learning', 
        notes: [{ id: 'n3', title: 'K-Means Clustering.pdf', size: '1.9 MB' }] 
      }
    ]
  },
  {
    id: 'ai',
    courseId: 'TIU-UCS-T350',
    title: 'Artificial Intelligence',
    color: '#8b5cf6', // Violet
    image: '/course-banners/ai.png',
    modules: [
      { 
        id: 'm1', title: 'Module 1: Search Algorithms', 
        notes: [{ id: 'n1', title: 'A* Search.pdf', size: '4.2 MB' }, { id: 'n2', title: 'Minimax Algorithm.pdf', size: '1.7 MB' }] 
      }
    ]
  },
  {
    id: 'cn',
    courseId: 'TIU-UCS-T304',
    title: 'Computer Networks',
    color: '#ec4899', // Pink
    image: '/course-banners/cn.png',
    modules: [
      { 
        id: 'm1', title: 'Module 1: OSI Model', 
        notes: [{ id: 'n1', title: 'Network Layers.pdf', size: '3.5 MB' }] 
      },
      { 
        id: 'm2', title: 'Module 2: TCP/IP', 
        notes: [{ id: 'n2', title: 'TCP Congestion Control.pdf', size: '2.8 MB' }, { id: 'n3', title: 'IP Addressing.pdf', size: '1.1 MB' }] 
      }
    ]
  },
  {
    id: 'daa',
    courseId: 'TIU-UCS-T321',
    title: 'Design and Analysis of Algorithm',
    color: '#f59e0b', // Amber
    image: '/course-banners/daa.png',
    modules: [
      { 
        id: 'm1', title: 'Module 1: Complexity Analysis', 
        notes: [{ id: 'n1', title: 'Asymptotic Notations.pdf', size: '1.5 MB' }] 
      },
      { 
        id: 'm2', title: 'Module 2: Dynamic Programming', 
        notes: [{ id: 'n2', title: 'Knapsack Problem.pdf', size: '2.3 MB' }, { id: 'n3', title: 'Matrix Chain Multiplication.pdf', size: '1.9 MB' }] 
      }
    ]
  }
];

export default function SavedNotesTab() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  const handleModuleToggle = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const openDrawer = (course) => {
    setSelectedCourse(course);
    // Expand first module by default
    if (course.modules.length > 0) {
      setExpandedModules({ [course.modules[0].id]: true });
    }
  };

  const closeDrawer = () => {
    setSelectedCourse(null);
  };

  const handlePdfClick = (pdfTitle) => {
    alert(`Opening ${pdfTitle}...`);
  };

  return (
    <div style={{ padding: '32px', position: 'relative', minHeight: '600px', overflow: 'hidden' }}>
      
      {/* Main Grid View */}
      <div style={{ transition: 'opacity 0.3s ease', opacity: selectedCourse ? 0.3 : 1, pointerEvents: selectedCourse ? 'none' : 'auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>My Saved Notes</h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Click on a subject folder to view its modules and saved PDFs.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {COURSES_DATA.map(course => {
            const totalPdfs = course.modules.reduce((total, mod) => total + mod.notes.length, 0);
            return (
              <div 
                key={course.id}
                onClick={() => openDrawer(course)}
                style={{
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left'
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
                  width: '100%', height: '140px', overflow: 'hidden', position: 'relative'
                }}>
                  <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.4) 100%)' }} />
                </div>
                
                <div style={{ padding: '18px 20px 20px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      background: 'rgba(58, 138, 255, 0.1)',
                      color: '#3a8aff',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {course.courseId}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '14px', lineHeight: '1.4' }}>
                    {course.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '13px', color: '#475569', fontWeight: '600',
                      background: '#f1f5f9',
                      padding: '5px 12px', borderRadius: '8px',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                      <Folder size={14} color="#64748b" strokeWidth={2.5} />
                      {totalPdfs} Saved PDFs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Half-Page Pop Up (Sliding Drawer) */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        minWidth: '400px',
        height: '100%',
        background: '#ffffff',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.08)',
        borderLeft: '1px solid #e2e8f0',
        transform: selectedCourse ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}>
        {selectedCourse && (
          <>
            {/* Drawer Header */}
            <div style={{ 
              padding: '24px 32px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: selectedCourse.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'block' }}>Subject</span>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{selectedCourse.title}</h2>
              </div>
              <button 
                onClick={closeDrawer}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#e2e8f0', color: '#475569', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#cbd5e1'}
                onMouseOut={(e) => e.currentTarget.style.background = '#e2e8f0'}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Drawer Content (Modules) */}
            <div style={{ padding: '24px 32px', overflowY: 'auto', flexGrow: 1 }}>
              {selectedCourse.modules.map(module => {
                const isExpanded = expandedModules[module.id];
                return (
                  <div key={module.id} style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Module Header (Accordion Toggle) */}
                    <button 
                      onClick={() => handleModuleToggle(module.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', background: isExpanded ? '#f8fafc' : '#ffffff', border: 'none', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${selectedCourse.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Folder size={16} color={selectedCourse.color} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{module.title}</span>
                      </div>
                      {isExpanded ? <ChevronDown size={20} color="#64748b" /> : <ChevronRight size={20} color="#64748b" />}
                    </button>
                    
                    {/* Module Content (PDFs) */}
                    {isExpanded && (
                      <div style={{ padding: '8px 20px 20px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                        {module.notes.map((note, index) => (
                          <div 
                            key={note.id}
                            onClick={() => handlePdfClick(note.title)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 16px', marginTop: '8px', borderRadius: '8px',
                              background: '#f8fafc', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = selectedCourse.color; e.currentTarget.style.background = '#ffffff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f8fafc'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <FileText size={18} color="#ef4444" strokeWidth={2.5} />
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{note.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{note.size}</span>
                              <Download size={16} color="#94a3b8" strokeWidth={2} />
                            </div>
                          </div>
                        ))}
                        {module.notes.length === 0 && (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No notes saved in this module.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
