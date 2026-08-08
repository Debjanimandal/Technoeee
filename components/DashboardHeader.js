'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import NotificationDropdown from './NotificationDropdown';

export default function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    // Listen for notification counts from the dropdown component
    const handleNotifCount = (e) => setUnreadCount(e.detail);
    window.addEventListener('notification_count', handleNotifCount);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('notification_count', handleNotifCount);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="dashboard-header">
      <Image src="/image/logo.png" alt="TechnoEEE Logo" width={120} height={40} unoptimized />
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

        {/* User Avatar & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} title="Logout" onClick={handleSignOut}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #041643, #4F6EF7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', fontWeight: 'bold', flexShrink: 0
          }}>
            {(profile?.username || user?.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          {profile?.username && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
              {profile.username}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
