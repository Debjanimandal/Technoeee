'use client';
import React, { useState, useEffect } from 'react';

// Basic markdown to HTML parser for the notes
const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  let html = markdown;
  
  // Headers - Modernized
  html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size: 1.35rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #1e293b; letter-spacing: -0.01em;">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size: 1.75rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1rem; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; letter-spacing: -0.02em;">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size: 2.25rem; font-weight: 900; margin-top: 2rem; margin-bottom: 1.5rem; color: #020617; letter-spacing: -0.02em;">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gm, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>');
  
  // Bullet points
  html = html.replace(/^[•*] (.*?)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.75rem; position: relative;">$1</li>');
  html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin-top: 1rem; margin-bottom: 1.5rem; padding-left: 1rem; color: #334155; list-style-type: disc;">$1</ul>');
  
  // Paragraphs / Line breaks
  html = html.replace(/\n\n/g, '<div style="height: 1.25rem;"></div>');
  
  return html;
};

export default function SecureNotesViewer({ title, markdownContent, onClose }) {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Blur on tab switch or any other app coming to focus
    const handleBlur = () => setIsBlurred(true);

    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'C', 's', 'S', 'p', 'P', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
      }
      // PrintScreen — blur immediately and overwrite clipboard
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        setIsBlurred(true);
        navigator.clipboard.writeText('Screenshots are disabled on this platform.').catch(() => {});
      }
    };

    // Also catch PrintScreen on keyUp (catches some OS variants)
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        setIsBlurred(true);
        navigator.clipboard.writeText('Screenshots are disabled on this platform.').catch(() => {});
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(12px)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 40px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '600', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Course
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, letterSpacing: '-0.01em' }}>
            {title} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>| Secure Notes</span>
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.875rem', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Protected View
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '40px 20px',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            minHeight: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '60px 80px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            msUserSelect: 'none',
            MozUserSelect: 'none',
            // Instant blur (0s) when obscuring, gentle fade-in (0.15s) when resuming
            filter: isBlurred ? 'blur(20px) grayscale(80%)' : 'none',
            transition: isBlurred ? 'filter 0s' : 'filter 0.15s ease',
            color: '#475569',
            lineHeight: '1.85',
            fontSize: '1.05rem',
            fontFamily: '"Inter", system-ui, -apple-system, sans-serif'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Click-to-resume overlay — requires explicit user action to unblur */}
          {isBlurred && (
            <div
              onClick={() => setIsBlurred(false)}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', borderRadius: '24px',
              }}
            >
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.90)', padding: '24px 48px', borderRadius: '16px',
                color: 'white', fontWeight: '600', fontSize: '1.1rem', textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                🔒 View Obscured
                <div style={{ fontSize: '0.95rem', fontWeight: 'normal', marginTop: '10px', color: '#cbd5e1' }}>
                  Click here to resume reading
                </div>
              </div>
            </div>
          )}

          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(markdownContent) }} style={{ position: 'relative', zIndex: 2 }} />
        </div>
      </div>
    </div>
  );
}
