'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const AnalyticsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const AchievementIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const AcademicsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>;
const FeedbackIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const AboutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

export default function ProfileDropdown({ isOpen, onClose, user, profile, onSignOut, onEditProfile, onOpenAboutMe }) {
  const router = useRouter();
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('mock_profile_completion');
      if (stored) {
        setProfileCompletion(Number(stored));
      } else {
        const hasBasic = user?.email || profile?.username;
        setProfileCompletion(hasBasic ? 25 : 0);
      }
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

  return (
    <div style={{
      position: 'absolute', top: '56px', right: '0px', width: '300px',
      background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
      borderRadius: '24px', 
      boxShadow: '0 16px 40px rgba(0,10,40,0.12), 0 0 2px rgba(0,0,0,0.1)',
      zIndex: 1000, overflow: 'hidden',
      animation: 'slideDown 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
      padding: '16px 0 12px',
      display: 'flex', flexDirection: 'column'
    }}>
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .profile-menu-item {
          padding: 8px 16px;
          margin: 2px 16px;
          cursor: pointer;
          color: #3f4c63;
          font-size: 15px;
          font-weight: 700;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }
        .menu-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .profile-menu-item:global(.menu-icon) {
          opacity: 0.6;
          transition: all 0.2s ease;
        }
        .profile-menu-item:hover {
          background: rgba(58, 138, 255, 0.08);
          color: #3a8aff;
          transform: translateX(4px);
        }
        .profile-menu-item:hover :global(.menu-icon) {
          opacity: 1;
          color: #3a8aff;
        }
        .profile-menu-item:hover svg {
          opacity: 1 !important;
          stroke: #3a8aff;
        }
        .logout-item {
          color: #e53935;
        }
        .logout-item:global(.menu-icon) {
          opacity: 0.8;
          color: #e53935;
        }
        .logout-item:hover {
          background: rgba(229, 57, 53, 0.08);
          color: #c62828;
        }
        .logout-item:hover :global(.menu-icon) {
          color: #c62828;
        }
      `}</style>

      {/* Header section (Icon + Circular Progress + Username) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '8px' }}>
        
        {/* Profile Avatar with Progress Ring */}
        <div style={{ position: 'relative', width: '92px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <svg width="92" height="92" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="46" cy="46" r={radius} stroke="#f0f3f8" strokeWidth="4" fill="none" />
            <circle 
              cx="46" cy="46" r={radius} 
              stroke="#3a8aff" strokeWidth="4" fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #041643, #3a8aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '28px', fontWeight: '800',
            boxShadow: '0 8px 20px rgba(58,138,255,0.25)'
          }}>
            {(profile?.username || user?.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          {/* Progress Badge */}
          <div style={{
            position: 'absolute', bottom: '-4px', background: '#fff', 
            fontSize: '11px', fontWeight: '800', padding: '3px 8px', 
            borderRadius: '12px', border: '1px solid rgba(58,138,255,0.2)', 
            color: '#3a8aff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            {profileCompletion}%
          </div>
        </div>

        <span style={{ fontSize: '19px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.3px', marginTop: '8px' }}>
          {profile?.username || user?.email?.split('@')[0] || 'User'}
        </span>
        {user?.email && (
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '2px' }}>
            {user.email}
          </span>
        )}
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#3a8aff', marginTop: '6px', background: 'rgba(58,138,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
          Complete your profile
        </span>
      </div>

      <div className="profile-menu-item" onClick={onEditProfile}>
        <div className="menu-item-left">
          <EditIcon />
          <span>Edit Profile</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item" onClick={() => { onClose(); router.push('/profile'); }}>
        <div className="menu-item-left">
          <AboutIcon />
          <span>About Me</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item" onClick={() => { onClose(); router.push('/settings'); }}>
        <div className="menu-item-left">
          <SettingsIcon />
          <span>Settings</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item" onClick={() => { onClose(); router.push('/academics'); }}>
        <div className="menu-item-left">
          <AcademicsIcon />
          <span>Academics</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item" onClick={() => { onClose(); router.push('/reports'); }}>
        <div className="menu-item-left">
          <AnalyticsIcon />
          <span>My analytics</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item" onClick={() => { onClose(); router.push('/achievements'); }}>
        <div className="menu-item-left">
          <AchievementIcon />
          <span>My achievements</span>
        </div>
        <ChevronIcon />
      </div>
      
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 16px' }}></div>
      
      <div className="profile-menu-item" onClick={() => { onClose(); /* Handle Feedback */ }}>
        <div className="menu-item-left">
          <FeedbackIcon />
          <span>Feedback</span>
        </div>
        <ChevronIcon />
      </div>
      <div className="profile-menu-item logout-item" onClick={() => { onClose(); onSignOut(); }}>
        <div className="menu-item-left">
          <LogoutIcon />
          <span>Log Out</span>
        </div>
      </div>
    </div>
  );
}
