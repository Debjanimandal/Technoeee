'use client';
import React, { useState } from 'react';

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  summary, 
  thumbnailUrl, 
  isCompleted, 
  onComplete 
}) {
  const [isPlaying, setIsPlaying] = useState(false);

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
        {!isPlaying && thumbnailUrl ? (
          <div 
            onClick={() => setIsPlaying(true)}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Play Button Overlay */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#3a8aff" style={{ marginLeft: '6px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        ) : videoUrl ? (
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
              src={videoUrl} 
              width="100%" 
              height="100%" 
              controls 
              autoPlay
              onEnded={() => onComplete && onComplete()}
            />
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
            No video available
          </div>
        )}
      </div>

      {/* Completion Actions (Specifically for GDrive where auto-detect fails) */}
      {isGoogleDrive && !isCompleted && (isPlaying || !thumbnailUrl) && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => onComplete && onComplete()}
            style={{
              padding: '12px 30px',
              background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            }}
          >
            <span>✓</span> Mark Video as Complete
          </button>
        </div>
      )}

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
            <span>✓</span> Completed
          </div>
        </div>
      )}
    </div>
  );
}
