'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import NotificationDropdown from '../shared/NotificationDropdown';
import ProfileDropdown from '../shared/ProfileDropdown';
import AuthModal from '../auth/AuthModal';
import EditProfileModal from '../profile/EditProfileModal';
import BadgeClaimModal from '../achievements/BadgeClaimModal';
import { BADGES } from '@/lib/data/badges';

export default function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileTab, setEditProfileTab] = useState('about');
  const [globalCompletion, setGlobalCompletion] = useState(75);
  const [badgeToClaim, setBadgeToClaim] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    // Initial load
    const stored = localStorage.getItem('mock_profile_completion');
    if (stored) setGlobalCompletion(Number(stored));

    if (sessionStorage.getItem('keepProfileOpen') === 'true') {
      setShowProfileMenu(true);
      sessionStorage.removeItem('keepProfileOpen');
    }

    // Listen for updates from modal
    const handleProfileUpdate = () => {
      const updated = localStorage.getItem('mock_profile_completion');
      if (updated) setGlobalCompletion(Number(updated));
    };
    window.addEventListener('profile_completion_updated', handleProfileUpdate);
    return () => window.removeEventListener('profile_completion_updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    const handleNotifCount = (e) => setUnreadCount(e.detail);
    window.addEventListener('notification_count', handleNotifCount);

    const handleTriggerClaim = (e) => {
      const badgeId = e.detail;
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) setBadgeToClaim(badge);
    };
    window.addEventListener('trigger_badge_claim', handleTriggerClaim);

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

  return (
    <div className="dashboard-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => {
            if (pathname === '/dashboard') {
              router.push('/');
            } else {
              router.back();
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1352f1', padding: '4px'
          }}
          title="Go back"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style={{ width: '120px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/image/logo.png" alt="TechnoEEE Logo" width={120} height={60} style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }} unoptimized />
        </div>
      </div>
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
            <Image src="/image/notification.jpg" alt="Notification" width={40} height={40} unoptimized style={{ borderRadius: '50%' }} />
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
            onClaimBadgeClick={(badgeId) => {
              const badge = BADGES.find(b => b.id === badgeId);
              if (badge) {
                setBadgeToClaim(badge);
                setShowNotifications(false);
              }
            }}
          />
        </div>

        {/* Profile Pill Toggle */}
        <div 
          ref={profileRef}
          style={{ position: 'relative' }}
        >
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 6px 4px 10px', borderRadius: '30px',
              background: '#e0f2fe', border: '1px solid #bae6fd',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <Menu size={18} color="#334155" strokeWidth={2.5} />
            
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Image src="/image/profile_icon.png" alt="Profile" width={40} height={40} unoptimized />
            </div>
          </button>
          
          <ProfileDropdown 
            isOpen={showProfileMenu} 
            onClose={() => setShowProfileMenu(false)}
            user={user}
            profile={profile}
            onSignOut={handleSignOut}
            onEditProfile={() => {
              setShowProfileMenu(false);
              setEditProfileTab('basic');
              setShowEditProfileModal(true);
            }}
            onOpenAboutMe={() => {
              setShowProfileMenu(false);
              setEditProfileTab('about');
              setShowEditProfileModal(true);
            }}
          />
        </div>
      </div>
      
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialTab="signup" 
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          onBack={() => {
            setShowEditProfileModal(false);
            setShowProfileMenu(true);
          }}
          initialTab={editProfileTab}
        />
      )}

      {badgeToClaim && (
        <BadgeClaimModal
          badge={badgeToClaim}
          onClose={() => setBadgeToClaim(null)}
          onClaim={() => {
            // After successful claim, could redirect or show toast
            setBadgeToClaim(null);
          }}
        />
      )}
    </div>
  );
}
