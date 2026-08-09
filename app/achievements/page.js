'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { getLearningStats, getDailyStudyData, getCourseStudyTime, getAdvancedAnalytics } from '@/lib/services/studyService';
import { BADGES } from '@/lib/data/badges';
import BadgeModal from '@/components/achievements/BadgeModal';
import { Lock, Sparkles } from 'lucide-react';
import { useBadges } from '@/lib/context/badge-context';

// Dynamic icon importer for grid
import * as Icons from 'lucide-react';

export default function AchievementsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const { claimedBadges } = useBadges();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [statsData, courseTime, advanced, enrRes] = await Promise.all([
        getLearningStats(user.id),
        getCourseStudyTime(user.id),
        getAdvancedAnalytics(user.id, 30),
        supabase.from('enrollments').select('*').eq('user_id', user.id)
      ]);

      const enrollments = enrRes.data || [];
      const uniqueEnrollments = enrollments.filter((e, i, a) => a.findIndex(x => x.course_title === e.course_title) === i);
      
      setUserData({
        enrollments,
        uniqueEnrollments: uniqueEnrollments.length,
        totalHours: statsData?.total_hours || Object.values(courseTime).reduce((a,b)=>a+b,0),
        activeDays: statsData?.active_days || 0,
        longestSession: statsData?.longest_session_min || 0,
        peakTime: advanced?.peakTime || 'N/A',
        weekendRatio: advanced?.weekendRatio?.weekend || 0,
        courseTime
      });
      setLoading(false);
    })();
  }, [user]);

  // Compute unlocked status for each badge
  const processedBadges = useMemo(() => {
    if (!userData) return [];
    return BADGES.map(badge => {
      const isEligible = badge.check(userData);
      const isClaimed = claimedBadges.includes(badge.id);
      return {
        ...badge,
        unlocked: isClaimed, // Strictly requires claiming now
        eligibleNotClaimed: isEligible && !isClaimed
      };
    });
  }, [userData, claimedBadges]);

  const unlockedCount = processedBadges.filter(b => b.unlocked).length;

  return (
    <>
      <style>{`
        @keyframes floatIdle { 0% { transform: translateY(0px); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0px); } }
        .badge-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .badge-card:hover { transform: translateY(-8px) scale(1.02); z-index: 10; }
        .unlocked-glow { animation: floatIdle 4s ease-in-out infinite; }
      `}</style>
      
      <div className="app-layout">
        <Sidebar />
        <div className="page-content" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
          <DashboardHeader />

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', paddingTop: '20px' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => { sessionStorage.setItem('keepProfileOpen', 'true'); router.back(); }}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '700', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                >
                  <Icons.ArrowLeft size={18} />
                  Back
                </button>
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                    My Achievements 🏆
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
                    Track your progress, unlock badges, and build your learning legacy.
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              {!loading && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Unlocked</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{unlockedCount} <span style={{ fontSize: '14px', color: '#94a3b8' }}>/ {BADGES.length}</span></div>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Completion</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{Math.round((unlockedCount / BADGES.length) * 100)}%</div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>Loading your achievements...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                {processedBadges.map((badge, idx) => {
                  const IconComp = Icons[badge.icon] || Icons.Trophy;
                  const isUnlocked = badge.unlocked;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (badge.eligibleNotClaimed) {
                          window.dispatchEvent(new CustomEvent('trigger_badge_claim', { detail: badge.id }));
                        } else {
                          setSelectedBadge(badge);
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
                        borderRadius: '16px', padding: '24px 20px', textAlign: 'center',
                        border: isUnlocked ? `1px solid ${badge.color}66` : badge.eligibleNotClaimed ? `2px dashed ${badge.color}` : '1px solid #e2e8f0',
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        boxShadow: isUnlocked ? `0 10px 25px -5px ${badge.color}20` : badge.eligibleNotClaimed ? `0 0 15px ${badge.color}40` : '0 4px 6px -1px rgba(0,0,0,0.05)',
                        transform: 'translateY(0)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: badge.eligibleNotClaimed ? 'pulse-glow 2s infinite alternate' : 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = isUnlocked 
                          ? `0 20px 25px -5px ${badge.color}30` 
                          : badge.eligibleNotClaimed ? `0 0 20px ${badge.color}60` : '0 10px 15px -3px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isUnlocked 
                          ? `0 10px 25px -5px ${badge.color}20` 
                          : badge.eligibleNotClaimed ? `0 0 15px ${badge.color}40` : '0 4px 6px -1px rgba(0,0,0,0.05)';
                      }}
                    >
                      {/* Background Glow */}
                      {(isUnlocked || badge.eligibleNotClaimed) && (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                          width: '100px', height: '100px', background: `${badge.color}15`,
                          borderRadius: '50%', filter: 'blur(20px)', zIndex: 0
                        }} />
                      )}

                      <div style={{
                        width: '80px', height: '80px', margin: '0 auto 16px auto',
                        borderRadius: '50%', background: (isUnlocked || badge.eligibleNotClaimed) ? badge.color : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: (isUnlocked || badge.eligibleNotClaimed) ? '#fff' : '#cbd5e1', position: 'relative', zIndex: 1,
                        border: isUnlocked ? `2px solid ${badge.color}` : '2px solid transparent',
                        boxShadow: isUnlocked ? `0 0 0 4px ${badge.color}22` : 'none',
                        filter: (isUnlocked || badge.eligibleNotClaimed) ? 'none' : 'grayscale(100%)',
                        animation: badge.eligibleNotClaimed ? 'float 3s ease-in-out infinite' : isUnlocked ? 'float 6s ease-in-out infinite' : 'none'
                      }}>
                        <IconComp size={36} />
                        {(!isUnlocked && !badge.eligibleNotClaimed) && (
                          <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <Lock size={12} color="#94a3b8" />
                          </div>
                        )}
                        {badge.eligibleNotClaimed && (
                          <div style={{ position: 'absolute', bottom: -5, right: -5, background: badge.color, color: '#fff', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: '2px solid #fff' }}>
                            <Sparkles size={12} />
                          </div>
                        )}
                      </div>

                      <h3 style={{ position: 'relative', zIndex: 1, fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
                        {badge.title}
                      </h3>
                      
                      {badge.eligibleNotClaimed ? (
                        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', fontWeight: '800', color: badge.color, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          Click to Claim!
                        </div>
                      ) : (
                        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', fontWeight: '600', color: isUnlocked ? badge.color : '#94a3b8' }}>
                          {badge.category}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedBadge && (
        <BadgeModal 
          badge={selectedBadge} 
          isUnlocked={selectedBadge.unlocked} 
          onClose={() => setSelectedBadge(null)} 
        />
      )}
    </>
  );
}
