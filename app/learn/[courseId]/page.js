'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import coursesData from '../../../public/data/real_courses_data.json';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import VideoPlayer from '@/components/shared/VideoPlayer';
import { useBadges } from '@/lib/context/badge-context';
import { BADGES } from '@/lib/data/badges';
import * as Icons from 'lucide-react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

import SecureNotesViewer from '@/components/shared/SecureNotesViewer';

export default function CourseLearningPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null); 
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedContentIdx, setSelectedContentIdx] = useState(0);
  const [completedItems, setCompletedItems] = useState([]);
  const [isNotesViewerOpen, setIsNotesViewerOpen] = useState(false);
  
  const { claimedBadges, claimBadge } = useBadges();
  const [progressPercent, setProgressPercent] = useState(0);

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

  useEffect(() => {
    async function fetchProgress() {
      if (user && course) {
        const { data } = await supabase
          .from('enrollments')
          .select('progress')
          .eq('user_id', user.id)
          .eq('course_title', course.course_name)
          .maybeSingle();
        
        if (data && data.progress) {
          setProgressPercent(data.progress);
        }
      }
    }
    fetchProgress();
  }, [user, course]);

  if (!course) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Course Environment...</div>;

  const totalModules = course.modules?.length || 0;
  // Mock tracking
  const remainingHours = parseInt(course.estimated_time) || 40; 
  const estRemaining = Math.max(0, Math.floor(remainingHours * (1 - (progressPercent / 100))));

  // Robust topic lookup — handles apostrophe encoding differences (Flynn's vs Flynn's)
  const getTopicDetails = (topicName) => {
    if (!course || !course.topicDetails || !topicName) return null;
    if (course.topicDetails[topicName]) return course.topicDetails[topicName];
    const norm = (s) => s.replace(/\u2019|â€™/g, "'").trim();
    const searchNorm = norm(topicName);
    for (const key of Object.keys(course.topicDetails)) {
      if (norm(key) === searchNorm) return course.topicDetails[key];
    }
    return null;
  };

  const currentTopicData = getTopicDetails(selectedTopic);

  // --- Automation / Sequential Locking Logic ---
  const isTestCourse = course?.subject_code === 'TIU-PC-UCS-T22101';
  let moduleVideosFlattened = [];
  if (isTestCourse && expandedModule !== null && course?.modules?.[expandedModule]?.topics) {
    course.modules[expandedModule].topics.forEach((topicName) => {
      const tData = getTopicDetails(topicName);
      if (Array.isArray(tData)) {
        tData.forEach((vid, i) => moduleVideosFlattened.push({ topic: topicName, idx: i, ...vid }));
      } else if (tData) {
        moduleVideosFlattened.push({ topic: topicName, idx: 0, ...tData });
        if (tData.videoUrl2) moduleVideosFlattened.push({ topic: topicName, idx: 1, videoUrl: tData.videoUrl2, summary: tData.summary2 || tData.summary });
        if (tData.videoUrl3) moduleVideosFlattened.push({ topic: topicName, idx: 2, videoUrl: tData.videoUrl3, summary: tData.summary3 || tData.summary });
      }
    });
  }

  const isVideoUnlocked = (topicName, vidIdx) => {
    if (!isTestCourse) return true;
    const flatIdx = moduleVideosFlattened.findIndex(v => v.topic === topicName && v.idx === vidIdx);
    if (flatIdx <= 0) return true;
    const prevVideo = moduleVideosFlattened[flatIdx - 1];
    const prevCompletedId = prevVideo.idx === 0 ? prevVideo.topic : `${prevVideo.topic}_${prevVideo.idx + 1}`;
    return completedItems.includes(prevCompletedId);
  };
  // ---------------------------------------------

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f4f7fb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader />
        
        <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '20px',
            padding: '30px',
            color: '#fff',
            marginBottom: '20px',
            boxShadow: '0 15px 30px rgba(15, 23, 42, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: '-40px', right: '180px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(43,88,118,0.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-50px', right: '80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(78,67,118,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '20px', right: '280px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(43,88,118,0.06)', pointerEvents: 'none' }} />
            
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
                    <span style={{ background: 'rgba(255,152,0,0.8)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icons.Flame size={14} fill="#fff" />
                      {course.difficulty}
                    </span>
                  )}
                  {course.relevance && (
                    <span style={{ background: 'rgba(76,175,80,0.8)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icons.Briefcase size={14} />
                      {course.relevance}
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
                <Icons.Target size={20} color="#3b82f6" />
                Course Outcomes
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
                            <Icons.FileQuestion size={16} color="#e65100" />
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
                      <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#b8860b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icons.Award size={18} color="#b8860b" />
                        Claim Course Badge
                      </h4>
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
                      <div style={{ width: '60px', height: '60px', marginBottom: '20px', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ede9fe', borderRadius: '16px' }}>
                        <Icons.BookOpen size={32} color="#7c3aed" />
                      </div>
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
                      <div style={{ width: '72px', height: '72px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', borderRadius: '20px' }}>
                        <Icons.Target size={36} color="#3b82f6" />
                      </div>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>Ready to Learn?</h2>
                      <p style={{ fontSize: '15px' }}>Select a module and topic from the roadmap on the left to begin studying.</p>
                    </div>
                  )}
                </div>
              ) : selectedTopic === 'GRAND_QUIZ' || selectedTopic.startsWith('MANDATORY_QUIZ_') ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ width: '80px', height: '80px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed', borderRadius: '20px', border: '2px solid #fed7aa' }}>
                    <Icons.FileQuestion size={40} color="#ea580c" />
                  </div>
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
                (() => {
                  const badge = BADGES.find(b => b.category === 'Course Completion' && b.check({ enrollments: [{ course_id: course.subject_code, progress: 100 }] }));
                  if (!badge) return <div style={{ textAlign: 'center', padding: '50px' }}>No badge configured for this course.</div>;

                  const IconComp = Icons[badge.icon] || Icons.Trophy;
                  const isClaimed = claimedBadges.includes(badge.id);
                  const isEligible = progressPercent >= 100;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <div style={{
                        width: '120px', height: '120px', borderRadius: '50%', background: isClaimed ? badge.color : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: isClaimed ? '#fff' : '#cbd5e1',
                        border: isClaimed ? `4px solid ${badge.color}` : '4px solid #e2e8f0', marginBottom: '24px',
                        boxShadow: isClaimed ? `0 0 30px ${badge.color}66` : 'none', position: 'relative'
                      }}>
                        <IconComp size={60} />
                        {!isClaimed && (
                          <div style={{ position: 'absolute', bottom: 5, right: 5, background: '#fff', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Lock size={20} color="#94a3b8" />
                          </div>
                        )}
                      </div>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: isClaimed ? badge.color : '#0f172a', marginBottom: '12px' }}>
                        {badge.title}
                      </h2>
                      <p style={{ fontSize: '15px', color: '#64748b', textAlign: 'center', maxWidth: '380px', marginBottom: '32px' }}>
                        {badge.description}
                      </p>
                      
                      {isClaimed ? (
                        <div style={{ padding: '12px 32px', background: '#dcfce7', color: '#166534', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icons.CheckCircle size={20} /> Claimed!
                        </div>
                      ) : isEligible ? (
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('trigger_badge_claim', { detail: badge.id }))}
                          style={{
                            background: badge.color, color: '#fff', border: 'none', padding: '16px 40px',
                            borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                            boxShadow: `0 10px 25px -5px ${badge.color}80`, transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          Claim Badge
                        </button>
                      ) : (
                        <div style={{ padding: '12px 32px', background: '#f1f5f9', color: '#94a3b8', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lock size={18} /> Complete 100% to Unlock
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                    {selectedTopic}
                  </h2>
                  
                  {/* Content Sub-Timeline (Video -> Notes -> Quiz) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '60px', overflowX: 'visible', padding: '10px 10px' }}>
                    {(() => {
                      const isTopicArray = Array.isArray(currentTopicData);
                      const videoCount = isTopicArray ? currentTopicData.length : (currentTopicData?.videoUrl3 ? 3 : currentTopicData?.videoUrl2 ? 2 : 1);
                      const timelineItems = [];
                      
                      for (let i = 0; i < videoCount; i++) {
                         timelineItems.push({ type: `Video ${videoCount > 1 ? i + 1 : ''}`.trim(), icon: <Icons.PlayCircle size={24} strokeWidth={2.5} />, color: '#3b82f6', bg: '#eff6ff', isVideo: true, videoIdx: i });
                      }
                      timelineItems.push({ type: 'Notes',   icon: <Icons.FileText size={22} strokeWidth={2.5} />, color: '#8b5cf6', bg: '#f5f3ff', isVideo: false });
                      timelineItems.push({ type: 'Quiz',    icon: <Icons.HelpCircle size={24} strokeWidth={2.5} />, color: '#b91c1c', bg: '#fef2f2', isVideo: false });
                      
                      return timelineItems.map((item, idx, arr) => {
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
                              <div style={{ 
                                width: '50px', height: '50px', borderRadius: '12px', 
                                background: isSelected ? item.color : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: `2px solid ${item.color}`, flexShrink: 0,
                                boxShadow: isSelected ? `0 0 15px ${item.color}66` : 'none',
                                position: 'relative', zIndex: 2, color: isSelected ? '#fff' : item.color
                              }}>
                                {item.icon}
                              </div>
                              <span style={{ 
                                position: 'absolute', top: '58px', left: '50%', transform: 'translateX(-50%)',
                                fontSize: '12px', fontWeight: 'bold', color: isSelected ? item.color : '#888', whiteSpace: 'nowrap'
                              }}>
                                {item.type}
                              </span>
                             </div>
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
                      });
                    })()}
                  </div>

                  {/* Main Video/Content Player Area */}
                  <div style={{ flex: 1, background: '#f9fafb', borderRadius: '16px', border: '1px dashed #cfd8dc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    
                    {(() => {
                      const isTopicArray = Array.isArray(currentTopicData);
                      const videoCount = isTopicArray ? currentTopicData.length : (currentTopicData?.videoUrl3 ? 3 : currentTopicData?.videoUrl2 ? 2 : 1);
                      
                      if (selectedContentIdx < videoCount && currentTopicData) {
                        let activeData = null;
                        if (isTopicArray) {
                          activeData = currentTopicData[selectedContentIdx];
                        } else {
                          activeData = currentTopicData;
                          if (selectedContentIdx === 1) activeData = { ...currentTopicData, videoUrl: currentTopicData.videoUrl2, summary: currentTopicData.summary2 || currentTopicData.summary, thumbnail: currentTopicData.thumbnail2 || currentTopicData.thumbnail };
                          if (selectedContentIdx === 2) activeData = { ...currentTopicData, videoUrl: currentTopicData.videoUrl3, summary: currentTopicData.summary3 || currentTopicData.summary, thumbnail: currentTopicData.thumbnail3 || currentTopicData.thumbnail };
                        }
                        
                        const completedId = selectedContentIdx === 0 ? selectedTopic : `${selectedTopic}_${selectedContentIdx + 1}`;
                        const locked = !isVideoUnlocked(selectedTopic, selectedContentIdx);

                        if (activeData?.videoUrl) {
                          return (
                            <VideoPlayer 
                              videoUrl={activeData.videoUrl}
                              title={selectedTopic + (videoCount > 1 ? ` (Part ${selectedContentIdx + 1})` : '')}
                              summary={activeData.summary}
                              thumbnailUrl={activeData.thumbnail}
                              isCompleted={completedItems.includes(completedId)}
                              isLocked={locked}
                              onComplete={() => {
                                if (!completedItems.includes(completedId)) {
                                  setCompletedItems(prev => [...prev, completedId]);
                                }
                              }}
                            />
                          );
                        }
                      }
                      
                      // Notes Tab Logic
                      if (selectedContentIdx === videoCount) {
                        const isLocked = !isVideoUnlocked(selectedTopic, 0); // If topic is locked, notes are locked
                        let notesContent = isTopicArray ? currentTopicData[0]?.notes : currentTopicData?.notes;

                        if (isLocked) {
                          return (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                              <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#64748b' }}>
                                <Lock size={40} />
                              </div>
                              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>Notes Locked</h3>
                              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                                You must complete the videos in the previous topic before you can access these notes.
                              </p>
                            </div>
                          );
                        }

                        if (!notesContent) {
                          return (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>No Notes Available</h3>
                              <p style={{ color: '#64748b' }}>Notes for this topic have not been uploaded yet.</p>
                            </div>
                          );
                        }

                        return (
                          <div style={{ textAlign: 'center', padding: '40px', width: '100%', maxWidth: '600px' }}>
                            <div style={{ width: '80px', height: '80px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#3b82f6' }}>
                              <Icons.FileText size={40} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Topic Notes</h3>
                            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px' }}>
                              These notes are highly secure and can only be viewed in the secure reader.
                            </p>
                            <button 
                              onClick={() => setIsNotesViewerOpen(true)}
                              style={{
                                padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
                                fontWeight: '600', transition: 'background-color 0.2s',
                                display: 'inline-flex', alignItems: 'center', gap: '8px'
                              }}
                            >
                              <Lock size={18} />
                              Open Secure Reader
                            </button>
                          </div>
                        );
                      }
                      
                      // Fallback for Quiz or upcoming content
                      return (
                        <>
                          <div style={{ width: '80px', height: '80px', background: '#e3f2fd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#1565c0' }}>
                            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </div>
                          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#455a64', marginBottom: '10px' }}>Contents are coming soon</h3>
                          <p style={{ color: '#78909c', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
                            The videos, study materials, and topic quizzes for this section will be unlocked shortly.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}

            </div>
          </div>
          
        </div>
      </div>

      {isNotesViewerOpen && (
        <SecureNotesViewer 
          title={selectedTopic}
          markdownContent={Array.isArray(currentTopicData) ? currentTopicData[0]?.notes : currentTopicData?.notes}
          onClose={() => setIsNotesViewerOpen(false)}
        />
      )}
    </div>
  );
}
