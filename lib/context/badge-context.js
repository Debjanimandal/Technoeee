'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase/client';
import { getLearningStats, getCourseStudyTime, getAdvancedAnalytics } from '@/lib/services/studyService';
import { BADGES } from '@/lib/data/badges';

const BadgeContext = createContext({});

export const useBadges = () => useContext(BadgeContext);

export function BadgeProvider({ children }) {
  const { user } = useAuth();
  
  const [claimedBadges, setClaimedBadges] = useState([]);
  const [badgeNotifications, setBadgeNotifications] = useState([]);
  const [eligibleUnclaimed, setEligibleUnclaimed] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedClaimed = JSON.parse(localStorage.getItem('claimed_badges') || '[]');
      const storedNotifs = JSON.parse(localStorage.getItem('badge_notifications') || '[]');
      setClaimedBadges(storedClaimed);
      setBadgeNotifications(storedNotifs);
    } catch(e) {}
  }, []);

  // Sync state to local storage when it changes
  useEffect(() => {
    if (claimedBadges.length > 0) {
      localStorage.setItem('claimed_badges', JSON.stringify(claimedBadges));
    }
  }, [claimedBadges]);

  useEffect(() => {
    if (badgeNotifications.length >= 0) { // even if 0, save it to clear
      localStorage.setItem('badge_notifications', JSON.stringify(badgeNotifications));
    }
  }, [badgeNotifications]);

  // Main eligibility engine
  const checkEligibility = useCallback(async () => {
    if (!user) return;
    
    // Fetch data required to check badges
    const [statsData, courseTime, advanced, enrRes] = await Promise.all([
      getLearningStats(user.id),
      getCourseStudyTime(user.id),
      getAdvancedAnalytics(user.id, 30),
      supabase.from('enrollments').select('*').eq('user_id', user.id)
    ]);

    const enrollments = enrRes.data || [];
    const uniqueEnrollments = enrollments.filter((e, i, a) => a.findIndex(x => x.course_title === e.course_title) === i);
    
    const userData = {
      enrollments: uniqueEnrollments,
      uniqueEnrollments: uniqueEnrollments.length,
      totalHours: statsData?.total_hours || Object.values(courseTime || {}).reduce((a,b)=>a+b,0),
      activeDays: statsData?.active_days || 0,
      longestSession: statsData?.longest_session_min || 0,
      peakTime: advanced?.peakTime || 'N/A',
      weekendRatio: advanced?.weekendRatio?.weekend || 0,
      courseTime
    };

    const newEligible = [];
    const newNotifs = [...badgeNotifications];
    let notifsChanged = false;

    BADGES.forEach(badge => {
      // 1. If it's already claimed, ignore
      if (claimedBadges.includes(badge.id)) return;
      
      // 2. Check if eligible
      const isEligible = badge.check(userData);
      
      if (isEligible) {
        newEligible.push(badge.id);
        
        // 3. If eligible, check if we already have a notification for it
        if (!newNotifs.some(n => n.badgeId === badge.id)) {
          newNotifs.push({
            id: `notif-badge-${badge.id}`,
            badgeId: badge.id,
            type: 'badge_claim',
            title: 'New Badge Unlocked!',
            message: `You've met the criteria for: ${badge.title}. Click to claim it!`,
            timestamp: new Date().toISOString()
          });
          notifsChanged = true;
        }
      }
    });

    setEligibleUnclaimed(newEligible);
    if (notifsChanged) {
      setBadgeNotifications(newNotifs);
      window.dispatchEvent(new CustomEvent('badge_notification_added'));
    }
  }, [user, claimedBadges, badgeNotifications]);

  // Run engine periodically (every 5 mins) and on mount
  useEffect(() => {
    if (!user) return;
    checkEligibility();
    const interval = setInterval(checkEligibility, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkEligibility]);

  // Function to claim a badge
  const claimBadge = (badgeId) => {
    setClaimedBadges(prev => {
      if (prev.includes(badgeId)) return prev;
      return [...prev, badgeId];
    });
    
    setBadgeNotifications(prev => prev.filter(n => n.badgeId !== badgeId));
    setEligibleUnclaimed(prev => prev.filter(id => id !== badgeId));
  };

  return (
    <BadgeContext.Provider value={{
      claimedBadges,
      badgeNotifications,
      eligibleUnclaimed,
      checkEligibility,
      claimBadge,
      setBadgeNotifications // allow NotificationDropdown to clear other notifs if needed, though badge notifs shouldn't be deleted manually
    }}>
      {children}
    </BadgeContext.Provider>
  );
}
