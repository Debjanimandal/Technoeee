'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '/image/duo-icons_dashboard.jpg', activeIcon: '/image/duo-icons_dashboard.jpg' },
  { label: 'Profile', href: '/profile', icon: '/image/Vector.jpg', activeIcon: '/image/Vector.jpg' },
  { label: 'Communities', href: '/community', icon: '/image/Vector.jpg', activeIcon: '/image/comunity.jpg' },
  { label: 'Analysis', href: '/analysis', icon: '/image/analysis.jpg', activeIcon: '/image/analysis2.jpg' },
  { label: 'Reports', href: '#', icon: '/image/Bar Chart.jpg', activeIcon: '/image/Bar Chart.jpg' },
  { label: 'Chatbot', href: '/chatbot', icon: '/image/chatbot.png', activeIcon: '/image/chatbot.png' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="sidebar">
      {NAV_ITEMS.map(({ label, href, icon, activeIcon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`sidebar-item${isActive ? ' active' : ''}`}
          >
            <Image
              src={isActive ? activeIcon : icon}
              alt={`${label} Icon`}
              width={20}
              height={20}
              unoptimized
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
