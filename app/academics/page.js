'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import { FolderOpen, FileText, Award, BotMessageSquare } from 'lucide-react';
import SavedNotesTab from '@/components/academics/SavedNotesTab';
import QuizHistoryTab from '@/components/academics/QuizHistoryTab';
import ResultsTab from '@/components/academics/ResultsTab';
import AIChatsTab from '@/components/academics/AIChatsTab';

const TABS = [
  { id: 'notes', label: 'My Saved Notes', Icon: FolderOpen, color: '#3b82f6' },
  { id: 'history', label: 'Quiz History', Icon: FileText, color: '#f59e0b' },
  { id: 'results', label: 'Results', Icon: Award, color: '#10b981' },
  { id: 'chats', label: 'AI Chats', Icon: BotMessageSquare, color: '#8b5cf6' },
];

export default function AcademicsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notes');

  const renderContent = () => {
    switch (activeTab) {
      case 'notes': return <SavedNotesTab />;
      case 'history': return <QuizHistoryTab />;
      case 'results': return <ResultsTab />;
      case 'chats': return <AIChatsTab />;
      default: return null;
    }
  };

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
                router.push('/dashboard');
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
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>My Academics</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Manage your notes, quiz history, results, and AI chats all in one place.</p>
          </div>

          {/* Academics Layout container */}
          <div style={{ display: 'flex', gap: '32px', flexDirection: 'row', alignItems: 'flex-start' }}>
            
            {/* Inner Sidebar */}
            <div style={{ 
              width: '280px', 
              flexShrink: 0, 
              background: '#fff', 
              borderRadius: '24px', 
              padding: '24px 16px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
              border: '1px solid #f1f5f9',
              position: 'sticky',
              top: '100px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.Icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '16px 20px',
                        border: 'none',
                        borderRadius: '16px',
                        background: isActive ? 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' : 'transparent',
                        color: isActive ? '#ffffff' : '#64748b',
                        fontWeight: isActive ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; } }}
                      onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: isActive ? 'rgba(255,255,255,0.2)' : `${tab.color}15`,
                        transition: 'all 0.2s ease'
                      }}>
                        <Icon size={20} color={isActive ? '#ffffff' : tab.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      </div>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Tab Content */}
            <div style={{ 
              flexGrow: 1, 
              background: '#fff', 
              borderRadius: '24px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
              border: '1px solid #f1f5f9', 
              minHeight: '600px',
              overflow: 'hidden'
            }}>
              {renderContent()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
