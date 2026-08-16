import React, { useState } from 'react';
import { BotMessageSquare, Search, Trash2, Calendar, MessageSquare, ChevronRight, ArrowLeft } from 'lucide-react';

const MOCK_CHATS = [
  { id: 1, title: 'Conversation 1', date: '2026-08-14', subject: 'Database Management', preview: 'Can you explain BCNF normalization?',
    messages: [
      { role: 'user', content: 'Can you explain BCNF normalization?' },
      { role: 'ai', content: 'BCNF (Boyce-Codd Normal Form) is a stricter version of 3NF. A table is in BCNF if and only if for every one of its dependencies X -> Y, X is a superkey.' }
    ]
  },
  { id: 2, title: 'Conversation 2', date: '2026-08-15', subject: 'Machine Learning', preview: 'What is the difference between K-Means and KNN?',
    messages: [
      { role: 'user', content: 'What is the difference between K-Means and KNN?' },
      { role: 'ai', content: 'K-Means is an unsupervised clustering algorithm used to group unlabeled data. KNN (K-Nearest Neighbors) is a supervised classification/regression algorithm.' }
    ]
  },
  { id: 3, title: 'Conversation 3', date: '2026-08-16', subject: 'General Study', preview: 'How can I improve my focus?',
    messages: [
      { role: 'user', content: 'How can I improve my focus?' },
      { role: 'ai', content: 'Try using the Pomodoro technique, block distracting websites, and ensure you are getting enough sleep!' }
    ]
  }
];

export default function AIChatsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState(MOCK_CHATS);

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this chat history?')) {
      setChats(chats.filter(c => c.id !== id));
      if (activeChat?.id === id) setActiveChat(null);
    }
  };

  if (activeChat) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
        {/* Chat Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setActiveChat(null)}
              style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} color="#475569" />
            </button>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{activeChat.title}</h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{activeChat.subject} • {activeChat.date}</span>
            </div>
          </div>
          <button onClick={(e) => handleDelete(e, activeChat.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fef2f2', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {activeChat.messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', padding: '0 4px' }}>{msg.role === 'user' ? 'You' : 'AI Tutor'}</span>
              <div style={{ 
                maxWidth: '75%', padding: '16px 20px', borderRadius: '16px', lineHeight: '1.6', fontSize: '15px',
                background: msg.role === 'user' ? '#3b82f6' : '#f1f5f9',
                color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BotMessageSquare className="text-indigo-500" size={28} />
            AI Chats History
          </h2>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Review your past conversations and queries with the AI Tutor.</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Filter by subject or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', 
              width: '300px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>No conversations found.</div>
        ) : (
          filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px',
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer',
                transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={24} color="#4f46e5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{chat.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {chat.date}</span>
                    <span style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                    <span style={{ fontWeight: '500', color: '#4f46e5' }}>{chat.subject}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                    "{chat.preview}"
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={(e) => handleDelete(e, chat.id)} 
                  style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#cbd5e1', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={20} color="#94a3b8" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
