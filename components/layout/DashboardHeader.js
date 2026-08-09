'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import NotificationDropdown from '../shared/NotificationDropdown';

export default function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleNotifCount = (e) => setUnreadCount(e.detail);
    window.addEventListener('notification_count', handleNotifCount);

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('notification_count', handleNotifCount);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    setShowProfileMenu(false);
    await signOut();
    router.replace('/');
  }

  const initial = (profile?.username || user?.email)?.[0]?.toUpperCase() || 'U';

  return (
    <div className="dashboard-header">
      <Image src="/image/logo.png" alt="TechnoEEE Logo" width={160} height={80} style={{ objectFit: 'contain' }} unoptimized />
      <div className="header-right" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Image src="/image/notification.jpg" alt="Notification" width={30} height={30} unoptimized style={{ borderRadius: '50%' }} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                background: '#d32f2f', color: '#fff', fontSize: '10px', fontWeight: 'bold',
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff'
              }}>
                {unreadCount}
              </div>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* User Avatar & Profile Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          {/* Clickable avatar row */}
          <div
            onClick={() => setShowProfileMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #041643, #4F6EF7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '13px', fontWeight: 'bold', flexShrink: 0
            }}>
              {initial}
            </div>
            {profile?.username && (
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                {profile.username}
              </span>
            )}
            {/* Chevron */}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 0.2s', transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: '160px',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* Profile info header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>
                  {profile?.username || 'User'}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
              </div>

              {/* Profile link */}
              <button
                onClick={() => { setShowProfileMenu(false); router.push('/profile'); }}
                style={{
                  width: '100%', padding: '11px 16px', background: 'none',
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </button>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%', padding: '11px 16px', background: 'none',
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: '13px', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '10px',
                  borderTop: '1px solid #f0f0f0',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
