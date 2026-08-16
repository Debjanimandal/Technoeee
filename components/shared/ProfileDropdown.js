'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const icon = (d, extra = '') => () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{ flexShrink: 0 }}>
    {extra ? <>{d}{extra}</> : d}
  </svg>
);

const EditIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const SettingsIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>;
const AnalyticsIcon= () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const AchievIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
const LogoutIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const AcademicsIcon= () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const FeedbackIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const AboutIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="menu-icon" style={{flexShrink:0}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;

import { FolderOpen, FileText, Award, BotMessageSquare } from 'lucide-react';

const MENU = [
  { label: 'Edit Profile',    Icon: EditIcon,      action: 'edit'         },
  { label: 'About Me',        Icon: AboutIcon,     route: '/profile'      },
  { label: 'Settings',        Icon: SettingsIcon,  route: '/settings'     },
  { label: 'Academics',       Icon: AcademicsIcon, action: 'submenu', subId: 'academics' },
  { label: 'My Analytics',    Icon: AnalyticsIcon, route: '/reports'      },
  { label: 'My Achievements', Icon: AchievIcon,    route: '/achievements' },
];

const SUBMENU_ACADEMICS = [
  { label: 'My Saved Notes', route: '/academics/saved-notes', Icon: FolderOpen },
  { label: 'Quiz History', route: '/academics/quiz-history', Icon: FileText },
  { label: 'Results', route: '/academics/results', Icon: Award },
  { label: 'AI Chats', route: '/academics/ai-chats', Icon: BotMessageSquare },
];

export default function ProfileDropdown({ isOpen, onClose, user, profile, onSignOut, onEditProfile }) {
  const router = useRouter();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [hoveredMenu, setHoveredMenu] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('mock_profile_completion');
    setProfileCompletion(stored ? Number(stored) : (user?.email || profile?.username ? 25 : 0));
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

  function handleItem(item) {
    if (item.action === 'edit') { onEditProfile?.(); return; }
    if (item.action === 'submenu') return; // Do nothing on click for submenus
    onClose();
    router.push(item.route);
  }

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: 0,
      width: 'clamp(220px, 17vw, 272px)',
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(16px)',
      borderRadius: '18px',
      boxShadow: '0 12px 36px rgba(0,10,40,0.13), 0 0 0 1px rgba(0,0,0,0.06)',
      zIndex: 1000,
      animation: 'slideDown 0.22s cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pd-item {
          padding: 7px 14px;
          margin: 2px 10px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }
        .pd-item:hover {
          background: rgba(58,138,255,0.08);
          color: #1352f1;
          transform: translateX(3px);
        }
        .pd-item:hover svg { stroke: #1352f1 !important; }
        .pd-item-left { display: flex; align-items: center; gap: 10px; }
        .pd-logout { color: #e53935; }
        .pd-logout:hover { background: rgba(229,57,53,0.08); color: #c62828; transform: translateX(3px); }
        .pd-logout:hover svg { stroke: #c62828 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Avatar + ring */}
        <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
          <svg width="68" height="68" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="34" cy="34" r={radius} stroke="#f0f3f8" strokeWidth="3.5" fill="none" />
            <circle cx="34" cy="34" r={radius} stroke="#3a8aff" strokeWidth="3.5" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #041643, #3a8aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '20px', fontWeight: '800',
            boxShadow: '0 4px 14px rgba(58,138,255,0.28)'
          }}>
            {(profile?.username || user?.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{
            position: 'absolute', bottom: '-3px',
            background: '#fff', fontSize: '10px', fontWeight: '800',
            padding: '2px 6px', borderRadius: '10px',
            border: '1px solid rgba(58,138,255,0.2)',
            color: '#3a8aff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', zIndex: 10
          }}>
            {profileCompletion}%
          </div>
        </div>

        <span style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.2px', marginTop: '2px' }}>
          {profile?.username || user?.email?.split('@')[0] || 'User'}
        </span>
        {user?.email && (
          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', fontWeight: '500', textAlign: 'center', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
        )}
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#3a8aff', marginTop: '6px', background: 'rgba(58,138,255,0.09)', padding: '2px 8px', borderRadius: '10px' }}>
          Complete your profile
        </span>
      </div>

      {/* ── Menu items ── */}
      <div style={{ padding: '6px 0' }}>
        {MENU.map(item => (
          <div 
            key={item.label} 
            className="pd-item" 
            onClick={() => handleItem(item)}
            onMouseEnter={() => {
              if (item.subId) {
                if (window.hoverTimeout) clearTimeout(window.hoverTimeout);
                setHoveredMenu(item.subId);
              }
            }}
            onMouseLeave={() => {
              if (item.subId) {
                window.hoverTimeout = setTimeout(() => {
                  setHoveredMenu(null);
                }, 300); // 300ms delay prevents gap issues
              }
            }}
            style={{ position: 'relative' }}
          >
            <div className="pd-item-left">
              <item.Icon />
              <span>{item.label}</span>
            </div>
            <ChevronIcon />
            
            {/* Submenu rendering */}
            {item.action === 'submenu' && item.subId === 'academics' && hoveredMenu === 'academics' && (
              <div 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '100%',
                  marginRight: '12px',
                  width: '210px',
                  background: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 36px rgba(0,10,40,0.13), 0 0 0 1px rgba(0,0,0,0.06)',
                  zIndex: 1001,
                  padding: '8px 0',
                  cursor: 'default'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (window.hoverTimeout) clearTimeout(window.hoverTimeout);
                }}
              >
                {SUBMENU_ACADEMICS.map(subItem => {
                  const SubIcon = subItem.Icon;
                  return (
                    <div 
                      key={subItem.label} 
                      className="pd-item" 
                      onClick={() => { onClose(); router.push(subItem.route); }}
                    >
                      <div className="pd-item-left">
                        <SubIcon size={15} className="menu-icon" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                        <span>{subItem.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />

      <div style={{ padding: '6px 0 8px' }}>
        <div className="pd-item" onClick={() => { onClose(); }}>
          <div className="pd-item-left"><FeedbackIcon /><span>Feedback</span></div>
          <ChevronIcon />
        </div>
        <div className="pd-item pd-logout" onClick={() => { onClose(); onSignOut?.(); }}>
          <div className="pd-item-left"><LogoutIcon /><span>Log Out</span></div>
        </div>
      </div>
    </div>
  );
}
