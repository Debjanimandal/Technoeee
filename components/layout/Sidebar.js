'use client';
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
  return (
    <div className="sidebar">
      {NAV_ITEMS.map(({ label, href, Icon, color }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`sidebar-item${isActive ? ' active' : ''}`}
          >
            <Icon 
              size={20} 
              color={isActive ? '#ffffff' : color} 
              strokeWidth={isActive ? 2.5 : 2}
              style={{ flexShrink: 0 }}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
