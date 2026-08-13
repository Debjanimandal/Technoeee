'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  summary, 
  thumbnailUrl, 
  isCompleted, 
  onComplete,
  isLocked // Added isLocked prop
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const maxWatchedTime = useRef(0);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // Determine if it's a Google Drive link
  const isGoogleDrive = videoUrl?.includes('drive.google.com');
  
  // Convert Drive view links to preview links for iframe embedding
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (isGoogleDrive && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleTimeUpdate = () => {
    if (!videoRef.current || isCompleted) return;
    
    const currentTime = videoRef.current.currentTime;
    
    // If the user tries to jump forward by more than 2 seconds past their max watched time
    if (currentTime > maxWatchedTime.current + 2) {
      videoRef.current.currentTime = maxWatchedTime.current;
    } else {
      // Update max watched time
      if (currentTime > maxWatchedTime.current) {
        maxWatchedTime.current = currentTime;
      }
    }
  };

  // If locked, we don't allow play
  if (isLocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {summary && (
          <div style={{ 
            marginBottom: '24px', padding: '20px', background: '#f8f9fa', 
            borderRadius: '12px', borderLeft: '4px solid #94a3b8', opacity: 0.8
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'text-bottom', marginRight: '6px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Locked: Complete previous video first
            </h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>{summary}</p>
          </div>
        )}
        <div style={{ 
          position: 'relative', width: '100%', aspectRatio: '16/9', 
          background: '#1e293b', borderRadius: '16px', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'
        }}>
           <div style={{ textAlign: 'center' }}>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             <div>Video Locked</div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Topic Summary Section */}
      {summary && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '12px',
          borderLeft: '4px solid #3a8aff'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>What you'll learn</h3>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* Video Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: '16/9', 
        background: '#000', 
        borderRadius: '16px', 
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        {videoUrl ? (
          isGoogleDrive ? (
            <iframe 
              src={embedUrl}
              width="100%" 
              height="100%" 
              allow="autoplay"
              style={{ border: 'none' }}
              allowFullScreen
            ></iframe>
          ) : (
            <video 
              ref={videoRef}
              src={videoUrl} 
              width="100%" 
              height="100%" 
              controls 
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={() => onComplete && onComplete()}
            />
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
            No video available
          </div>
        )}
      </div>

      {isCompleted && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            padding: '10px 24px',
            background: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Completed
          </div>
        </div>
      )}
    </div>
  );
}
