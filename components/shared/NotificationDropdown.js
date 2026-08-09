'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // ─── The On-The-Fly Notification Engine ────────────────────────────────
    const generateNotifications = () => {
      const generated = [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // 1. Inactivity Rule
      const lastLogin = localStorage.getItem('app_last_login');
      if (lastLogin) {
        const daysSince = Math.floor((now - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
        if (daysSince >= 3) {
          generated.push({
            id: 'inactivity-' + todayStr,
            type: 'warning',
            title: 'We Missed You!',
            message: `You haven't logged in for ${daysSince} days. Consistency is key to learning!`,
            url: '/planner'
          });
        }
      }
      localStorage.setItem('app_last_login', todayStr);

      // 2. Weekend Revision Rule
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        generated.push({
          id: 'weekend-rev-' + todayStr,
          type: 'revision',
          title: 'Weekend Revision',
          message: 'It\'s the weekend! Check your planner for Spaced Repetition blocks.',
          url: '/planner'
        });
      }

      // 3. Daily Briefing / Overdue Rule (Mocked from local storage sync)
      try {
        const plannerStart = localStorage.getItem('planner_start_date');
        const completed = JSON.parse(localStorage.getItem('planner_completed') || '[]');
        if (plannerStart) {
          // Simple heuristic: if they have very few completed tasks compared to days passed
          const daysActive = Math.max(1, Math.floor((now - new Date(plannerStart)) / (1000 * 60 * 60 * 24)));
          const expectedTasks = daysActive * 2; // Casual pace
          if (completed.length < expectedTasks - 4) {
            generated.push({
              id: 'overdue-alert-' + todayStr,
              type: 'warning',
              title: 'Falling Behind?',
              message: `You might have overdue tasks. Hit the 'Rebalance' button in your planner to reset your timeline.`,
              url: '/planner'
            });
          } else {
            generated.push({
              id: 'daily-brief-' + todayStr,
              type: 'info',
              title: 'Daily Schedule Ready',
              message: 'Your AI generated schedule for today is ready to be tackled.',
              url: '/planner'
            });
          }
        }
      } catch (e) {}

      // Load dismissed IDs
      const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      
      // Filter out dismissed ones and set state
      setNotifications(generated.filter(n => !dismissed.includes(n.id)));
    };

    generateNotifications();
  }, []);

  // Update badge count globally via an event or just let header read it?
  // We'll dispatch a custom event so the header knows the count.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('notification_count', { detail: notifications.length }));
  }, [notifications]);

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    const newNotifs = notifications.filter(n => n.id !== id);
    setNotifications(newNotifs);
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    dismissed.push(id);
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
  };

  const handleClearAll = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    notifications.forEach(n => dismissed.push(n.id));
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
    setNotifications([]);
  };

  const handleClick = (url) => {
    if (url) {
      router.push(url);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute', top: '60px', right: '40px', width: '350px',
      background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      border: '1px solid #eee', zIndex: 1000, overflow: 'hidden',
      animation: 'slideDown 0.2s ease-out'
    }}>
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-item {
          transition: transform 0.2s, background 0.2s;
        }
        .notif-item:hover {
          background: #f8f9fa;
        }
        /* Simple swipe out animation class applied manually */
        .swiping {
          transform: translateX(100%);
          opacity: 0;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Notifications</h3>
        {notifications.length > 0 && (
          <button 
            onClick={handleClearAll}
            style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
            <div style={{ marginBottom: '12px', color: '#bbb' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>All caught up!</div>
            <div style={{ fontSize: '12px' }}>Check back later for new alerts.</div>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notif={n} onClick={() => handleClick(n.url)} onDismiss={(e) => handleDismiss(e, n.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Swipeable Notification Item Component ─────────────────────────────────
function NotificationItem({ notif, onClick, onDismiss }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSwipingOut, setIsSwipingOut] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50; 

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Swipe left or right dismisses it
    if (isLeftSwipe || isRightSwipe) {
      setIsSwipingOut(true);
      setTimeout(() => onDismiss(e), 200); // wait for animation
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'warning': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
      case 'revision': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      );
      case 'info': default: return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    }
  };

  const getStyles = (type) => {
    switch(type) {
      case 'warning': return { bg: '#ffebee', color: '#d32f2f' };
      case 'revision': return { bg: '#f3e5f5', color: '#ab47bc' };
      case 'info': default: return { bg: '#e3f2fd', color: '#1565c0' };
    }
  };

  const style = getStyles(notif.type);
  const icon = getIcon(notif.type);

  return (
    <div 
      className={`notif-item ${isSwipingOut ? 'swiping' : ''}`}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
      style={{
        padding: '16px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
        display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative',
        transition: 'all 0.2s ease-out'
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', background: style.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{notif.title}</div>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{notif.message}</div>
      </div>
      <button 
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px',
          fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
