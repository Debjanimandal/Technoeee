'use client';
import { useEffect, useRef } from 'react';
import { saveStudySession } from './studyService';

/**
 * useStudySession — automatically tracks study time for a lesson.
 *
 * Usage:
 *   useStudySession({ userId, enrollmentId, courseTitle, lessonId });
 *
 * Starts a timer when the component mounts.
 * Saves the session to Supabase when:
 *  - Component unmounts (student leaves the page)
 *  - Tab becomes hidden (student switches tabs)
 *  - Browser window closes (beforeunload)
 *
 * Sessions shorter than 1 minute are silently ignored.
 */
export function useStudySession({ userId, enrollmentId, courseTitle, lessonId }) {
  const startTimeRef = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!userId || !enrollmentId || !courseTitle) return;

    // Record session start
    startTimeRef.current = new Date().toISOString();
    savedRef.current = false;

    async function save() {
      if (savedRef.current) return; // prevent double-save
      savedRef.current = true;

      const endTime = new Date().toISOString();
      await saveStudySession({
        userId,
        enrollmentId,
        courseTitle,
        lessonId: lessonId || null,
        sessionStart: startTimeRef.current,
        sessionEnd: endTime,
      });
    }

    // Trigger save when tab is hidden (user switches away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') save();
    };

    // Trigger save when browser closes / navigates away
    const handleBeforeUnload = () => save();

    // Re-start session when user comes back to the tab
    const handleVisibilityShow = () => {
      if (document.visibilityState === 'visible' && savedRef.current) {
        startTimeRef.current = new Date().toISOString();
        savedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityShow);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      save(); // save on component unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, enrollmentId, courseTitle, lessonId]);
}
