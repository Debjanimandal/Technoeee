'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="dashboard-header">
      <Image src="/image/logo.svg" alt="DevMode Logo" width={120} height={40} unoptimized />
      <div className="header-right">
        <div className="search-container">
          <Image className="search-icon" src="/image/search.jpg" alt="Search Icon" width={16} height={16} unoptimized />
          <input type="text" placeholder="    Search" />
        </div>
        <Image src="/image/notification.jpg" alt="Notification" width={30} height={30} unoptimized style={{ borderRadius: '50%' }} />

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
