'use client';
import Image from 'next/image';

export default function DashboardHeader() {
  return (
    <div className="dashboard-header">
      <Image src="/image/logo.svg" alt="DevMode Logo" width={120} height={40} unoptimized />
      <div className="header-right">
        <div className="search-container">
          <Image className="search-icon" src="/image/search.jpg" alt="Search Icon" width={16} height={16} unoptimized />
          <input type="text" placeholder="    Search" />
        </div>
        <Image src="/image/notification.jpg" alt="Notification" width={30} height={30} unoptimized style={{ borderRadius: '50%' }} />
        <Image src="/image/profile_dev.jpg" alt="Profile" width={30} height={30} unoptimized style={{ borderRadius: '50%' }} />
      </div>
    </div>
  );
}
