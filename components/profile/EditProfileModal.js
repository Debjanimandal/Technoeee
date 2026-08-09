'use client';
import { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, CheckCircle2, Clock, 
  MapPin, ShieldCheck, UserCircle, Briefcase, 
  GraduationCap, Medal, Link as LinkIcon 
} from 'lucide-react';

const MENU_TABS = [
  { id: 'basic', label: 'Basic Details' },
  { id: 'about', label: 'About' },
  { id: 'education', label: 'Education' },
  { id: 'personal', label: 'Personal Details' }
];

export default function EditProfileModal({ isOpen, onClose, initialTab = 'about' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Frontend State for all 4 sections
  const [basicDetails, setBasicDetails] = useState({ name: '', email: '' });
  const [aboutText, setAboutText] = useState('');
  const [educationDetails, setEducationDetails] = useState({ school: '', degree: '' });
  const [personalDetails, setPersonalDetails] = useState({ phone: '', location: '' });

  const [profileCompletion, setProfileCompletion] = useState(0);

  // Derived statuses for menu items
  const isBasicFilled = basicDetails.name.length > 0 && basicDetails.email.length > 0;
  const isAboutFilled = aboutText.length > 10;
  const isEduFilled = educationDetails.school.length > 0 && educationDetails.degree.length > 0;
  const isPersonalFilled = personalDetails.phone.length > 0 && personalDetails.location.length > 0;

  const tabStatuses = {
    basic: isBasicFilled,
    about: isAboutFilled,
    education: isEduFilled,
    personal: isPersonalFilled
  };

  // Update completion percentage
  useEffect(() => {
    let completedCount = 0;
    if (isBasicFilled) completedCount++;
    if (isAboutFilled) completedCount++;
    if (isEduFilled) completedCount++;
    if (isPersonalFilled) completedCount++;
    
    setProfileCompletion((completedCount / 4) * 100);
  }, [isBasicFilled, isAboutFilled, isEduFilled, isPersonalFilled]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <button className="icon-btn" onClick={onClose}><ArrowLeft size={20} color="#1c4980" /></button>
            <h2 className="header-title">Edit Profile</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} color="#1c4980" /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          
          {/* Sidebar */}
          <div className="modal-sidebar">
            {/* Profile Completion Widget */}
            <div className="completion-widget">
              <h3 className="completion-title">Complete your Profile</h3>
              <p className="completion-subtitle">Stay ahead of the competition by regularly updating your profile.</p>
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${profileCompletion}%` }}></div>
                </div>
                <span className="progress-text" style={{ color: profileCompletion === 100 ? '#10b981' : '#1c4980' }}>
                  {profileCompletion}%
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="nav-menu">
              {MENU_TABS.map((tab) => {
                const isCompleted = tabStatuses[tab.id];
                const IconComponent = isCompleted ? CheckCircle2 : Clock;
                return (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent 
                      size={16} 
                      color={isCompleted ? '#10b981' : '#94a3b8'} 
                      style={{ marginRight: '12px' }}
                    />
                    <span className="nav-label">{tab.label}</span>
                    {!isCompleted && <span className="required-tag">Required</span>}
                  </button>
                )
              })}
            </div>
            
            {/* Global Save Button */}
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <button
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  background: profileCompletion === 100 ? '#10b981' : '#e2e8f0',
                  color: profileCompletion === 100 ? '#fff' : '#94a3b8',
                  fontWeight: 600, border: 'none', cursor: profileCompletion === 100 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                disabled={profileCompletion !== 100}
                onClick={() => {
                  alert('Profile Details Saved Successfully!');
                  localStorage.setItem('mock_profile_completion', profileCompletion);
                  window.dispatchEvent(new Event('profile_completion_updated'));
                }}
              >
                Save All Changes
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="modal-content">
            <div className="content-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#94a3b8" />
                <h3 className="content-title">
                  {MENU_TABS.find(i => i.id === activeTab)?.label || 'Section'}
                </h3>
              </div>
            </div>

            <div className="content-body">
              {activeTab === 'basic' && (
                <div className="form-group">
                  <label className="form-label">Name <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="Enter your full name" value={basicDetails.name} onChange={e => setBasicDetails({...basicDetails, name: e.target.value})} />
                  
                  <label className="form-label" style={{marginTop: 16}}>Email <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="Enter your email" type="email" value={basicDetails.email} onChange={e => setBasicDetails({...basicDetails, email: e.target.value})} />
                </div>
              )}

              {activeTab === 'about' && (
                <div className="form-group">
                  <label className="form-label">About Me <span style={{color: '#ef4444'}}>*</span></label>
                  <span className="form-hint">Maximum 1000 characters can be added</span>
                  <textarea
                    className="about-textarea"
                    placeholder="Introduce yourself here!"
                    value={aboutText}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) setAboutText(e.target.value);
                    }}
                  ></textarea>
                  <div className="form-footer">
                    <span className="char-count">{aboutText.length} / 1000</span>
                    <button className="save-btn" onClick={() => alert('Saved!')}>Save Changes</button>
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <div className="form-group">
                  <label className="form-label">School / University <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="Enter institution name" value={educationDetails.school} onChange={e => setEducationDetails({...educationDetails, school: e.target.value})} />
                  
                  <label className="form-label" style={{marginTop: 16}}>Degree <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="e.g. Bachelor of Science" value={educationDetails.degree} onChange={e => setEducationDetails({...educationDetails, degree: e.target.value})} />
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="form-group">
                  <label className="form-label">Phone Number <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="Enter phone number" value={personalDetails.phone} onChange={e => setPersonalDetails({...personalDetails, phone: e.target.value})} />
                  
                  <label className="form-label" style={{marginTop: 16}}>Location <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="custom-input" placeholder="City, Country" value={personalDetails.location} onChange={e => setPersonalDetails({...personalDetails, location: e.target.value})} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
        }
        .modal-container {
          background: #f8fafc;
          width: 100%;
          max-width: 1100px;
          height: 90vh;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        /* Header */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .icon-btn:hover { background: #f1f5f9; }

        /* Body */
        .modal-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Sidebar */
        .modal-sidebar {
          width: 320px;
          background: #fff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 24px;
        }

        .resume-promo {
          background: #1c4980;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          cursor: pointer;
        }
        .resume-promo-content {
          display: flex;
          align-items: center;
        }

        .completion-widget {
          background: #f0f7ff;
          border: 1px solid #e0f2fe;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .completion-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px 0;
        }
        .completion-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }
        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-bar-bg {
          flex: 1;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
          transition: width 0.5s ease-in-out;
        }
        .progress-text {
          font-size: 12px;
          font-weight: 700;
        }

        /* Nav Menu */
        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
        }
        .nav-item:hover {
          background: #f8fafc;
        }
        .nav-item.active {
          background: #f0f7ff;
        }
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -24px;
          top: 0; bottom: 0;
          width: 4px;
          background: #3b82f6;
          border-radius: 0 4px 4px 0;
        }
        .nav-label {
          font-size: 14px;
          color: #334155;
          font-weight: 500;
          flex: 1;
        }
        .nav-item.active .nav-label {
          color: #1c4980;
          font-weight: 600;
        }
        .required-tag {
          font-size: 10px;
          color: #ef4444;
          background: #fef2f2;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        /* Content Area */
        .modal-content {
          flex: 1;
          background: #fff;
          margin: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
          border-bottom: 1px solid #e2e8f0;
        }
        .content-title {
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          margin: 0;
        }
        .content-body {
          padding: 32px;
          flex: 1;
          overflow-y: auto;
        }

        /* Form Elements */
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .form-hint {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 16px;
        }
        .about-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          color: #334155;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          line-height: 1.6;
        }
        .about-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .custom-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #334155;
          outline: none;
          transition: border-color 0.2s;
        }
        .custom-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }
        .char-count {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }
        .save-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .save-btn:hover {
          background: #2563eb;
        }

        .placeholder-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          text-align: center;
        }
        .placeholder-state h3 {
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .placeholder-state p { margin: 0; }
      `}</style>
    </div>
  );
}
