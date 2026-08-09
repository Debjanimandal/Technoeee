import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { RARITY_COLORS } from '@/lib/data/badges';
import * as Icons from 'lucide-react';
import { useBadges } from '@/lib/context/badge-context';

export default function BadgeClaimModal({ badge, onClose, onClaim }) {
  const [show, setShow] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const { claimBadge } = useBadges();

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  if (!badge) return null;

  const IconComponent = Icons[badge.icon] || Icons.Trophy;
  const rarityStyle = RARITY_COLORS[badge.rarity] || RARITY_COLORS['Common'];

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      claimBadge(badge.id);
      if (onClaim) onClaim(badge.id);
      onClose();
    }, 1500); // simulate claim animation/delay
  };

  return (
    <>
      <style>{`
        @keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes pulseStrong { 0% { box-shadow: 0 0 20px 0px ${badge.color}66; } 50% { box-shadow: 0 0 60px 20px ${badge.color}; } 100% { box-shadow: 0 0 20px 0px ${badge.color}66; } }
      `}</style>
      
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: show ? 1 : 0, transition: 'opacity 0.4s ease'
        }}
      >
        <div 
          style={{
            background: '#fff', borderRadius: '32px', width: '90%', maxWidth: '450px',
            padding: '40px 30px', textAlign: 'center', position: 'relative',
            boxShadow: `0 30px 60px rgba(0,0,0,0.4), 0 0 40px ${badge.color}40`,
            animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            overflow: 'hidden'
          }}
        >
          {/* Confetti/Rays Background */}
          <div style={{
            position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
            background: `conic-gradient(from 0deg, transparent 0deg, ${badge.color}15 30deg, transparent 60deg, ${badge.color}15 90deg, transparent 120deg, ${badge.color}15 150deg, transparent 180deg, ${badge.color}15 210deg, transparent 240deg, ${badge.color}15 270deg, transparent 300deg, ${badge.color}15 330deg, transparent 360deg)`,
            animation: 'spinSlow 20s linear infinite', zIndex: 0
          }} />

          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: '20px', right: '20px', zIndex: 10,
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '16px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>
              <Sparkles size={16} />
              New Achievement
              <Sparkles size={16} />
            </div>

            <div style={{
              width: '140px', height: '140px', borderRadius: '50%',
              background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', border: '4px solid #fff', margin: '0 auto 24px auto',
              animation: 'pulseStrong 2s infinite ease-in-out'
            }}>
              <IconComponent size={64} />
            </div>

            <span style={{
              background: rarityStyle.bg, color: rarityStyle.text, border: `1px solid ${rarityStyle.border}`,
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              {badge.rarity}
            </span>

            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.2 }}>
              {badge.title}
            </h2>
            
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.5, margin: '0 0 32px 0', padding: '0 16px' }}>
              {badge.description}
            </p>

            <button
              onClick={handleClaim}
              disabled={claiming}
              style={{
                background: claiming ? '#10b981' : badge.color,
                color: '#fff', border: 'none', borderRadius: '16px',
                padding: '16px 32px', fontSize: '18px', fontWeight: '800',
                cursor: claiming ? 'default' : 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                boxShadow: `0 10px 25px -5px ${claiming ? '#10b981' : badge.color}80`,
                transition: 'all 0.3s'
              }}
            >
              {claiming ? (
                <>
                  <CheckCircle size={24} />
                  Claimed!
                </>
              ) : (
                'Claim Badge'
              )}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
