'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import coursesData from '../../../public/real_courses_data.json';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import VideoPlayer from '@/components/VideoPlayer';

export default function CourseLearningPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null); 
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedContentIdx, setSelectedContentIdx] = useState(0);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    if (courseId) {
      const found = coursesData.find(c => c.subject_code === courseId);
      if (found) {
        setCourse(found);
      } else {
        router.push('/dashboard');
      }
    }
  }, [courseId, router]);

  if (!course) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Course Environment...</div>;

  const totalModules = course.modules?.length || 0;
  // Mock tracking
  const progressPercent = 0; 
  const remainingHours = parseInt(course.estimated_time) || 40; 
  const estRemaining = Math.max(0, Math.floor(remainingHours * (1 - (progressPercent / 100))));

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f4f7fb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
            borderRadius: '20px', padding: '30px', color: '#fff', marginBottom: '20px',
            boxShadow: '0 15px 30px rgba(38, 208, 206, 0.2)', position: 'relative', overflow: 'hidden'
          }}>
            <Link href="/my-courses" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
              ← Back to My Courses
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                    {course.subject_code}
                  </span>
                  {course.difficulty && (
                    <span style={{ background: 'rgba(255,152,0,0.8)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      🔥 {course.difficulty}
                    </span>
                  )}
                  {course.relevance && (
                    <span style={{ background: 'rgba(76,175,80,0.8)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      💼 {course.relevance}
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.2', maxWidth: '800px' }}>
                  {course.course_name}
                </h1>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '15px' }}>
                  Estimated Total Time: {course.estimated_time} • Remaining: <strong>~{estRemaining} Hours</strong>
                </p>
              </div>
              <div style={{ width: '300px', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span>Course Progress</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Outcomes Section - Moved outside the header for better visuals */}
          {course.outcomes && course.outcomes.length > 0 && (
            <div style={{ 
              background: '#fff', borderRadius: '20px', padding: '25px 30px', marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🎯</span> Course Outcomes
              </h3>
              <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '14.5px', color: '#444', lineHeight: '1.6' }}>
                {course.outcomes.map((outcome, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Split Screen Workspace */}
          <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '600px' }}>
            
            {/* LEFT PANE: Vertical Timeline Tree */}
            <div style={{
              width: '380px', background: '#fff', borderRadius: '20px', padding: '25px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
              overflowY: 'auto', flexShrink: 0
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '25px' }}>Learning Roadmap</h3>
              
              <div style={{ position: 'relative', paddingLeft: '0px' }}>
                {/* The main vertical track line */}
                <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', background: '#bbdefb', borderRadius: '5px' }}></div>
                
                {course.modules?.map((mod, modIdx) => {
                  const isExpanded = expandedModule === modIdx;
                  const isModCompleted = progressPercent > ((modIdx+1) * 20); // mock logic
                  
                  return (
                    <div key={modIdx} style={{ marginBottom: '20px', position: 'relative' }}>
                      {/* Module Node */}
                      <div 
                        onClick={() => {
                          setExpandedModule(isExpanded ? null : modIdx);
                          if (!isExpanded) setSelectedTopic(null); // Reset topic so module intro shows
                        }}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                          padding: '10px 10px 10px 13px', borderRadius: '12px', background: isExpanded ? '#f8f9fa' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%', zIndex: 2, flexShrink: 0,
                          background: isModCompleted || isExpanded ? '#3a8aff' : '#fff', 
                          border: isModCompleted || isExpanded ? '3px solid #e3f2fd' : '3px solid #64b5f6',
                          boxShadow: isModCompleted || isExpanded ? '0 0 10px rgba(58,138,255,0.7)' : 'none',
                        }} />
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: isModCompleted ? '#1a1a1a' : '#555', margin: '0 0 3px 0' }}>
                            {mod.title}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#888' }}>{mod.time || '0 Hours'}</div>
                        </div>
                      </div>

                      {/* Topics Branch (Only if expanded) */}
                      {isExpanded && (
                        /* border-left IS the line. Circle pinned at left:-22px always centers on border. */
                        <div style={{
                          borderLeft: '2px solid #ce93d8',
                          marginLeft: '26px',
                          paddingLeft: '18px',
                          marginTop: '6px',
                          paddingBottom: '4px',
                        }}>
                          {mod.topics?.map((topic, topicIdx) => {
                            const isSelected = selectedTopic === topic;
                            const isCompleted = completedItems.includes(topic);
                            return (
                              <div
                                key={topicIdx}
                                onClick={() => { setSelectedTopic(topic); setSelectedContentIdx(0); }}
                                style={{
                                  position: 'relative',
                                  display: 'flex', alignItems: 'center',
                                  padding: '8px 10px',
                                  borderRadius: '8px', cursor: 'pointer',
                                  marginBottom: '2px',
                                  background: isSelected ? 'rgba(171,71,188,0.06)' : 'transparent',
                                  border: isSelected ? '1px solid rgba(171,71,188,0.25)' : '1px solid transparent',
                                  transition: 'background 0.2s',
                                }}
                              >
                                {/* left:-24px → circle center lands exactly on border-left center */}
                                <div style={{
                                  position: 'absolute',
                                  left: '-24px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '10px', height: '10px', borderRadius: '50%',
                                  background: isCompleted ? '#4caf50' : (isSelected ? '#ab47bc' : '#fff'),
                                  border: isCompleted ? '2px solid #4caf50' : (isSelected ? '2px solid #ab47bc' : '2px solid #ce93d8'),
                                  boxShadow: isCompleted ? '0 0 10px rgba(76,175,80,0.6)' : (isSelected ? '0 0 10px rgba(171,71,188,0.8)' : 'none'),
                                  zIndex: 2,
                                }} />
                                <span style={{ fontSize: '13px', color: isCompleted ? '#2e7d32' : (isSelected ? '#ab47bc' : '#444'), fontWeight: isSelected || isCompleted ? '600' : '500', lineHeight: '1.4' }}>
                                  {topic} {isCompleted && '✓'}
                                </span>
                              </div>
                            );
                          })}

                          {/* Mandatory Module Quiz */}
                          <div
                            onClick={() => { setSelectedTopic(`MANDATORY_QUIZ_${modIdx}`); setSelectedContentIdx(3); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                              padding: '10px 12px', borderRadius: '8px', marginTop: '6px',
                              transition: 'box-shadow 0.2s, background 0.2s',
                              background: selectedTopic === `MANDATORY_QUIZ_${modIdx}` ? '#ffe0b2' : '#fff8f1',
                              border: selectedTopic === `MANDATORY_QUIZ_${modIdx}` ? '1px solid #ff9800' : '1px solid #ffe0b2',
                              boxShadow: selectedTopic === `MANDATORY_QUIZ_${modIdx}` ? '0 0 14px rgba(255,152,0,0.4)' : 'none'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                            <span style={{ fontSize: '15px' }}>📝</span>
                            <span style={{ fontSize: '13px', color: '#e65100', fontWeight: 'bold' }}>Mandatory Module Quiz</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Final End Nodes */}
                <div style={{ marginTop: '40px', position: 'relative' }}>
                  <div 
                      onClick={() => { setSelectedTopic('GRAND_QUIZ'); setSelectedContentIdx(3); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 10px 15px 13px', cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s', zIndex: 2, borderRadius: '12px',
                        background: selectedTopic === 'GRAND_QUIZ' ? 'rgba(58,138,255,0.05)' : 'transparent',
                        border: selectedTopic === 'GRAND_QUIZ' ? '1px solid rgba(58,138,255,0.2)' : '1px solid transparent',
                        boxShadow: selectedTopic === 'GRAND_QUIZ' ? '0 0 15px rgba(58,138,255,0.3)' : 'none'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', border: '3px solid #90caf9', zIndex: 2, flexShrink: 0 }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Grand Final Quiz</h4>
                  </div>
                  <div 
                      onClick={() => { setSelectedTopic('BADGE'); setSelectedContentIdx(0); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 10px 15px 13px', cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s', zIndex: 2, borderRadius: '12px',
                        background: selectedTopic === 'BADGE' ? 'rgba(255,215,0,0.1)' : 'transparent',
                        border: selectedTopic === 'BADGE' ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
                        boxShadow: selectedTopic === 'BADGE' ? '0 0 15px rgba(255,215,0,0.4)' : 'none'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', border: '3px solid #ffd700', boxShadow: '0 0 15px rgba(255,215,0,0.4)', zIndex: 2, flexShrink: 0 }} />
                      <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#b8860b', margin: 0 }}>🏆 Claim Course Badge</h4>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT PANE: Content View */}
            <div style={{
              flex: 1, background: '#fff', borderRadius: '20px', padding: '40px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0',
              display: 'flex', flexDirection: 'column'
            }}>
              
              {!selectedTopic ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                  {expandedModule !== null && course.modules[expandedModule]?.intro ? (
                    <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                      <div style={{ fontSize: '50px', marginBottom: '20px' }}>📚</div>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                        {course.modules[expandedModule].title}
                      </h2>
                      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
                        {course.modules[expandedModule].intro}
                      </p>
                      <p style={{ fontSize: '14px', marginTop: '24px', color: '#aaa' }}>Select a topic from the left to start learning.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎯</div>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>Ready to Learn?</h2>
                      <p style={{ fontSize: '15px' }}>Select a module and topic from the roadmap on the left to begin studying.</p>
                    </div>
                  )}
                </div>
              ) : selectedTopic === 'GRAND_QUIZ' || selectedTopic.startsWith('MANDATORY_QUIZ_') ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ fontSize: '70px', marginBottom: '24px' }}>📝</div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '12px' }}>
                    {selectedTopic === 'GRAND_QUIZ' ? 'Grand Final Quiz' : 'Mandatory Module Quiz'}
                  </h2>
                  <p style={{ fontSize: '15px', color: '#888', textAlign: 'center', maxWidth: '380px' }}>
                    Quizzes are coming soon! This section will be unlocked once you complete the relevant topics.
                  </p>
                  <div style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '30px', background: 'linear-gradient(135deg, #ff9800, #f44336)', color: '#fff', fontSize: '14px', fontWeight: 'bold', opacity: 0.5 }}>
                    Coming Soon
                  </div>
                </div>
              ) : selectedTopic === 'BADGE' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏆</div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#b8860b', marginBottom: '12px' }}>Course Badge</h2>
                  <p style={{ fontSize: '15px', color: '#888', textAlign: 'center', maxWidth: '380px' }}>
                    Complete all modules and the grand final quiz to unlock your course completion badge!
                  </p>
                  <div style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '30px', background: 'linear-gradient(135deg, #ffd700, #ff9800)', color: '#fff', fontSize: '14px', fontWeight: 'bold', opacity: 0.6 }}>
                    🔒 Locked
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                    {selectedTopic}
                  </h2>
                  
                  {/* Content Sub-Timeline (Video -> Notes -> Quiz) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '60px', overflowX: 'visible', padding: '10px 10px' }}>
                    {[
                      { type: course.topicDetails && course.topicDetails[selectedTopic]?.videoUrl2 ? 'Video 1' : 'Video', icon: '▶️', color: '#f44336', bg: '#ffebee' },
                      ...(course.topicDetails && course.topicDetails[selectedTopic]?.videoUrl2 ? [{ type: 'Video 2', icon: '▶️', color: '#3a8aff', bg: '#e3f2fd' }] : []),
                      ...(course.topicDetails && course.topicDetails[selectedTopic]?.videoUrl3 ? [{ type: 'Video 3', icon: '▶️', color: '#9c27b0', bg: '#f3e5f5' }] : []),
                      { type: 'Notes',   icon: '📄', color: '#4caf50', bg: '#e8f5e9' },
                      { type: 'Quiz',    icon: '❓', color: '#ff9800', bg: '#fff3e0' },
                    ].map((item, idx, arr) => {
                      const isSelected = selectedContentIdx === idx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                          <div 
                            onClick={() => setSelectedContentIdx(idx)}
                            style={{ 
                              position: 'relative',
                              cursor: 'pointer', opacity: isSelected ? 1 : 0.6,
                              transition: 'transform 0.2s, opacity 0.2s', zIndex: 2,
                              transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                            }}
                          >
                            {/* The Icon Box */}
                            <div style={{ 
                              width: '50px', height: '50px', borderRadius: '12px', 
                              background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              border: `2px solid ${item.color}`, flexShrink: 0,
                              boxShadow: isSelected ? `0 0 15px ${item.color}66` : 'none',
                              position: 'relative', zIndex: 2, background: '#fff'
                            }}>
                              <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            </div>
                            
                            {/* Absolute Positioned Text (Doesn't affect flex centering) */}
                            <span style={{ 
                              position: 'absolute', top: '58px', left: '50%', transform: 'translateX(-50%)',
                              fontSize: '12px', fontWeight: 'bold', color: isSelected ? item.color : '#888', whiteSpace: 'nowrap'
                            }}>
                              {item.type}
                            </span>
                          </div>
                          
                          {/* Connector Line */}
                          {idx < arr.length - 1 && (
                            <div style={{ 
                              width: '40px', height: '3px', 
                              background: isSelected ? item.color : '#e0e0e0', 
                              opacity: isSelected ? 0.8 : 0.4, 
                              zIndex: 1, marginLeft: '-2px', marginRight: '-2px'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Main Video/Content Player Area */}
                  <div style={{ flex: 1, background: '#f9fafb', borderRadius: '16px', border: '1px dashed #cfd8dc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    
                    {/* Render VideoPlayer if Video is selected AND we have a topicDetails object for this topic */}
                    {selectedContentIdx === 0 && course.topicDetails && course.topicDetails[selectedTopic] ? (
                      <VideoPlayer 
                        videoUrl={course.topicDetails[selectedTopic].videoUrl}
                        title={selectedTopic}
                        summary={course.topicDetails[selectedTopic].summary}
                        thumbnailUrl={course.topicDetails[selectedTopic].thumbnail}
                        isCompleted={completedItems.includes(selectedTopic)}
                        onComplete={() => {
                          if (!completedItems.includes(selectedTopic)) {
                            setCompletedItems(prev => [...prev, selectedTopic]);
                          }
                        }}
                      />
                    ) : selectedContentIdx === 1 && course.topicDetails && course.topicDetails[selectedTopic]?.videoUrl2 ? (
                      <VideoPlayer 
                        videoUrl={course.topicDetails[selectedTopic].videoUrl2}
                        title={selectedTopic + " (Part 2)"}
                        summary={course.topicDetails[selectedTopic].summary2}
                        thumbnailUrl={course.topicDetails[selectedTopic].thumbnail2}
                        isCompleted={completedItems.includes(selectedTopic + "_2")}
                        onComplete={() => {
                          if (!completedItems.includes(selectedTopic + "_2")) {
                            setCompletedItems(prev => [...prev, selectedTopic + "_2"]);
                          }
                        }}
                      />
                    ) : selectedContentIdx === 2 && course.topicDetails && course.topicDetails[selectedTopic]?.videoUrl3 ? (
                      <VideoPlayer 
                        videoUrl={course.topicDetails[selectedTopic].videoUrl3}
                        title={selectedTopic + " (Part 3)"}
                        summary={course.topicDetails[selectedTopic].summary3}
                        thumbnailUrl={course.topicDetails[selectedTopic].thumbnail3}
                        isCompleted={completedItems.includes(selectedTopic + "_3")}
                        onComplete={() => {
                          if (!completedItems.includes(selectedTopic + "_3")) {
                            setCompletedItems(prev => [...prev, selectedTopic + "_3"]);
                          }
                        }}
                      />
                    ) : (
                      <>
                        <div style={{ width: '80px', height: '80px', background: '#e3f2fd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#1565c0' }}>
                          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#455a64', marginBottom: '10px' }}>Contents are coming soon</h3>
                        <p style={{ color: '#78909c', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
                          The videos, study materials, and topic quizzes for this section will be unlocked shortly.
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
