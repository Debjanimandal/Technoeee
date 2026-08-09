import React, { useEffect, useState } from 'react';
import { X, Lock, BrainCircuit, Code2, Network, Cpu, Bot, GitMerge, Database, Globe, Rocket, Footprints, Flame, Target, Battery, Sunrise, Moon, Tent, Zap, Layers, Crown, BookOpenCheck, Medal, Trophy, Hourglass } from 'lucide-react';
import { RARITY_COLORS } from '@/lib/data/badges';

const ICONS = {
  BrainCircuit, Code2, Network, Cpu, Bot, GitMerge, Database, Globe,
  Rocket, Footprints, Flame, Target, Battery, Sunrise, Moon, Tent, 
  Zap, Layers, Crown, BookOpenCheck, Medal, Trophy, Hourglass
};

export default function BadgeModal({ badge, isUnlocked, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Slight delay for entry animation
    requestAnimationFrame(() => setShow(true));
  }, []);

  if (!badge) return null;

  const IconComponent = ICONS[badge.icon] || Trophy;
  const rarityStyle = RARITY_COLORS[badge.rarity] || RARITY_COLORS['Common'];

  return (
    <>
      {/* Global CSS for Animations */}
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes badgeFloat { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes badgeGlow { 0% { box-shadow: 0 0 20px 0px ${badge.color}66; } 50% { box-shadow: 0 0 40px 10px ${badge.color}99; } 100% { box-shadow: 0 0 20px 0px ${badge.color}66; } }
      `}</style>

      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: show ? 1 : 0, transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
      >
        {/* Modal Container */}
        <div 
          style={{
            background: '#fff', borderRadius: '24px', width: '90%', maxWidth: '700px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            display: 'flex', flexDirection: 'row', position: 'relative',
            animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10,
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={20} />
          </button>

          {/* Left Side: Badge Visuals */}
          <div style={{
            flex: '0 0 45%', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
            borderRight: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden'
          }}>
            {/* Background Decorative Element */}
            {isUnlocked && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '150%', height: '150%', background: `radial-gradient(circle, ${badge.color}22 0%, transparent 70%)`,
                zIndex: 0
              }} />
            )}

            {/* The Badge */}
            <div style={{
              width: '160px', height: '160px', borderRadius: '50%',
              background: badge.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', position: 'relative', zIndex: 1,
              animation: isUnlocked ? 'badgeFloat 3s ease-in-out infinite, badgeGlow 3s ease-in-out infinite' : 'none',
              border: `4px solid ${badge.color}`,
              boxShadow: isUnlocked ? 'none' : 'inset 0 4px 10px rgba(0,0,0,0.2)',
            }}>
              <IconComponent size={72} />
              
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', bottom: '-10px', right: '-10px',
                  background: '#fff', borderRadius: '50%', width: '48px', height: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '2px solid #e2e8f0'
                }}>
                  <Lock size={24} color="#64748b" />
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Details */}
          <div style={{ flex: '1', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{
                background: rarityStyle.bg, color: rarityStyle.text, border: `1px solid ${rarityStyle.border}`,
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {badge.rarity}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {badge.category}
              </span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.2 }}>
              {badge.title}
            </h2>
            
            <p style={{ color: '#475569', fontSize: '16px', lineHeight: 1.6, margin: '0 0 32px 0' }}>
              {badge.description}
            </p>

            {/* Status Section */}
            <div style={{
              background: isUnlocked ? '#f0fdf4' : '#f8fafc',
              border: isUnlocked ? '1px solid #bbf7d0' : '1px dashed #cbd5e1',
              borderRadius: '16px', padding: '20px',
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: isUnlocked ? '#166534' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isUnlocked ? 'Status: Unlocked' : 'Status: Locked'}
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: isUnlocked ? '#15803d' : '#94a3b8', fontWeight: '500' }}>
                {isUnlocked 
                  ? "Congratulations! You have successfully earned this achievement." 
                  : "Keep studying and fulfill the criteria to unlock this badge!"}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
