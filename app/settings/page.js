'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, ArrowLeft, X, Check } from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState(null);
  const [emailPreference, setEmailPreference] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(newPassword);
  const hasNoSpaces = newPassword.length > 0 && !/\s/.test(newPassword);
  const isLongEnough = newPassword.length >= 9;
  
  const isNewPasswordValid = hasLowercase && hasUppercase && hasNumber && hasSpecial && hasNoSpaces && isLongEnough;
  const showPasswordError = newPassword.length > 0 && !isNewPasswordValid;
  const isFormValid = currentPassword.length > 0 && isNewPasswordValid && newPassword === confirmPassword;

  const sections = [
    { id: 'notifications', title: 'Notifications', content: 'Notification preferences will go here.' },
    { id: 'password', title: 'Password', content: 'Password change options will go here.' },
    { id: 'security', title: 'Security', content: 'Two-factor authentication and security settings.' },
  ];

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f8fafc', overflowY: 'auto', height: '100vh', paddingBottom: '60px' }}>
        
        <DashboardHeader />

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'stretch',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{
              backgroundColor: toast.type === 'success' ? '#22c55e' : '#64748b',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={16} color={toast.type === 'success' ? '#22c55e' : '#64748b'} strokeWidth={3} />
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              color: toast.type === 'success' ? '#22c55e' : '#64748b',
              fontWeight: '600',
              fontSize: '15px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X color={toast.type === 'success' ? '#22c55e' : '#64748b'} size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingTop: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
              <button 
                onClick={() => {
                  sessionStorage.setItem('keepProfileOpen', 'true');
                  router.push('/dashboard');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '9999px', padding: '8px 20px 8px 16px',
                  fontSize: '15px', fontWeight: '600', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
              >
                <ArrowLeft size={18} color="#2b5876" strokeWidth={2.5} />
                <span style={{ color: '#2b5876' }}>Back</span>
              </button>
            </div>

            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '800', 
              color: '#0f172a', 
              marginBottom: '32px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Settings
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sections.map((section) => (
                <div 
                  key={section.id} 
                  style={{ 
                    borderRadius: '20px', 
                    backgroundColor: '#fff', 
                    overflow: 'hidden',
                    border: '1px solid rgba(99,102,241,0.15)',
                    boxShadow: '0 10px 40px rgba(79,70,229,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.3s ease'
                  }}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '24px',
                      backgroundColor: openSection === section.id ? 'rgba(99,102,241,0.02)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => { if (openSection !== section.id) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseOut={(e) => { if (openSection !== section.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#0f172a',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}>
                        {section.title}
                      </span>
                    </div>
                    {openSection === section.id ? (
                      <ChevronUp size={18} color="#666" />
                    ) : (
                      <ChevronDown size={18} color="#666" />
                    )}
                  </button>
                  
                  <div style={{
                    maxHeight: openSection === section.id ? '500px' : '0px',
                    opacity: openSection === section.id ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    <div style={{ padding: '0 20px 20px', fontSize: '14px', color: '#666' }}>
                      {section.id === 'notifications' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '8px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                              Email Notification Preferences
                            </h3>
                            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b', marginBottom: '16px', maxWidth: '95%' }}>
                              Automated notifications will be sent to your registered email whenever new course videos, notes, or resources are uploaded for your current and upcoming courses.
                            </p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Receive course updates via email</span>
                              
                              {/* Toggle Switch */}
                              <button
                                onClick={() => setEmailPreference(!emailPreference)}
                                style={{
                                  position: 'relative',
                                  width: '44px',
                                  height: '24px',
                                  borderRadius: '9999px',
                                  backgroundColor: emailPreference ? '#2b5876' : '#cbd5e1',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.3s'
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: emailPreference ? '22px' : '2px',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: '#fff',
                                  transition: 'left 0.3s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : section.id === 'password' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '8px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                              Change Password
                            </h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#64748b', marginBottom: '20px' }}>
                              If you wish to change your password, you can change from here.
                            </p>
                            
                            <form onSubmit={(e) => { e.preventDefault(); if (isFormValid) alert('Password updated successfully!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>Enter current password</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px', maxWidth: '400px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>Enter new password</label>
                                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: showPasswordError ? '1px solid #d9534f' : '1px solid #cbd5e1', outline: 'none' }} />
                                  {showPasswordError && (
                                    <p style={{ color: '#d9534f', fontSize: '13px', marginTop: '6px', lineHeight: '1.4' }}>
                                      The password must have at least 9 characters with a combination of small case and upper case alphabets, special characters, numbers & no white spaces.
                                    </p>
                                  )}
                                </div>
                                <div style={{ flex: '1 1 200px', maxWidth: '400px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>Confirm password</label>
                                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                </div>
                              </div>
                              <div>
                                <button type="submit" disabled={!isFormValid} style={{ padding: '12px 32px', backgroundColor: isFormValid ? '#2b5876' : '#f1f5f9', color: isFormValid ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: isFormValid ? 'pointer' : 'not-allowed', marginTop: '8px', transition: 'all 0.2s', boxShadow: isFormValid ? '0 4px 12px rgba(43,88,118,0.2)' : 'none' }}>
                                  Submit
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      ) : section.id === 'security' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '8px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                              Multi-Factor Authentication (MFA)
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
                              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#64748b', margin: 0 }}>
                                Turn on MFA to make sure only you can access your account.
                              </p>
                              
                              {/* Toggle Switch */}
                              <button
                                onClick={() => {
                                  const newValue = !mfaEnabled;
                                  setMfaEnabled(newValue);
                                  setToast({
                                    message: newValue ? 'MFA enabled.' : 'MFA disabled.',
                                    type: newValue ? 'success' : 'error'
                                  });
                                }}
                                style={{
                                  position: 'relative',
                                  width: '44px',
                                  height: '24px',
                                  borderRadius: '9999px',
                                  backgroundColor: mfaEnabled ? '#2b5876' : '#cbd5e1',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.3s'
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: mfaEnabled ? '22px' : '2px',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: '#fff',
                                  transition: 'left 0.3s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        section.content
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
