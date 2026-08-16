'use client';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import AIChatsTab from '@/components/academics/AIChatsTab';

export default function AIChatsPage() {
  const router = useRouter();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f0ff 50%, #eff6ff 100%)', overflowY: 'auto', height: '100vh' }}>
        <DashboardHeader />
        
        <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px', padding: '0 8px' }}>
            <button
              onClick={() => {
                sessionStorage.setItem('keepProfileOpen', 'true');
                router.back(); 
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', 
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                marginBottom: '20px', padding: '8px 18px', borderRadius: '100px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>AI Chats History</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>View, filter, and manage your previous conversations with the AI tutor.</p>
          </div>

          {/* Main Tab Content */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
            border: '1px solid #f1f5f9', 
            minHeight: '600px',
            overflow: 'hidden'
          }}>
            <AIChatsTab />
          </div>
        </div>
      </div>
    </div>
  );
}
