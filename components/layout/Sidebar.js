'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  User,
  Users,
  CalendarClock,
  BarChart3,
  BotMessageSquare,
  Video
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard, color: '#3b82f6' },
  { label: 'Courses', href: '/courses', Icon: BookOpen, color: '#10b981' },
  { label: 'My Courses', href: '/my-courses', Icon: GraduationCap, color: '#8b5cf6' },
  { label: 'Study Planner', href: '/planner', Icon: CalendarClock, color: '#ec4899' },
  { label: 'Chatbot', href: '/chatbot', Icon: BotMessageSquare, color: '#6366f1' },
  { label: 'Mock Interview', href: '/mock-interview', Icon: Video, color: '#f59e0b' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Load initial state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      const isCol = savedState === 'true';
      setIsCollapsed(isCol);
      if (isCol) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    }
    
    // Enable transitions slightly after mount to prevent initial flicker
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Sync state with body class and persist
  useEffect(() => {
    if (!isMounted) return; // Prevent overwriting local storage on initial render
    
    localStorage.setItem('sidebar_collapsed', isCollapsed);
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed, isMounted]);

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${!isMounted ? 'no-transition' : ''}`}>
      <div className="sidebar-header">
        <span className="brand-name">Techno EEE</span>
        <button 
          className="menu-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="nav-items-container">
        {NAV_ITEMS.map(({ label, href, Icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`sidebar-item${isActive ? ' active' : ''}`}
            >
              <div className="icon-container">
                <Icon 
                  size={22} 
                  color={isActive ? '#ffffff' : color} 
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ flexShrink: 0 }}
                />
              </div>
              <span className="nav-label">{label}</span>
              {isCollapsed && <span className="tooltip">{label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
