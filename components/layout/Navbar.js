'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '@/lib/context/auth-context';

const COURSES = [
  'Object Oriented Programming using C++',
  'Computer Organization and Architecture',
  'Artificial Intelligence',
  'Design and Analysis of Algorithm',
  'Database Management System',
  'Machine Learning',
  'Computer Networks',
  'Automata Theory & Compiler Design'
];

export default function Navbar({ active, onSignIn, onSignUp }) {
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [coursesNavOpen, setCoursesNavOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const exploreRef = useRef(null);
  const coursesNavRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  function handleExploreSelect(section) {
    if (pathname === '/') {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${section}`);
    }
    setExploreOpen(false);
  }

  const filteredCourses = COURSES.filter(c =>
    c.toLowerCase().includes(searchValue.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(e.target)) {
        setExploreOpen(false);
      }
      if (coursesNavRef.current && !coursesNavRef.current.contains(e.target)) {
        setCoursesNavOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function handleSearchChange(e) {
    setSearchValue(e.target.value);
    setDropdownOpen(true);
  }

  function selectCourse(course) {
    setSearchValue(course);
    setDropdownOpen(false);
    // If not logged in, prompt sign-in; otherwise navigate to courses page
    if (!user) {
      openModal('signin');
    } else {
      router.push('/courses');
    }
  }

  function submitSearch() {
    if (pathname === '/') {
      const el = document.getElementById('courses');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#courses');
    }
  }

  function openModal(tab) {
    setActiveTab(tab);
    setModalOpen(true);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <>
      <div className={`navbar${active ? ' active' : ''}`} id="navbar">
        <div className="logo">
          <Image src="/image/logo.png" alt="TechnoEEE Logo" width={110} height={48} style={{ objectFit: 'contain' }} unoptimized />
        </div>
        <div className="navbar-center">
          <div 
            className="browse-dropdown" 
            ref={exploreRef}
            onClick={() => setExploreOpen(!exploreOpen)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px', color: '#333', fontSize: '14px' }}
          >
            <span>Explore</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {exploreOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: '-10px', marginTop: '15px',
                background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                padding: '8px 0', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', zIndex: 2000
              }}>
                {[
                  { id: 'courses', label: 'Courses' },
                  { id: 'community', label: 'Features' },
                  { id: 'testimonials', label: 'Testimonials' },
                  { id: 'faq', label: 'FAQ' }
                ].map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleExploreSelect(item.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#1e58ec'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#444'; }}
                    style={{
                      padding: '10px 20px', fontSize: '14px', color: '#444', 
                      cursor: 'pointer', transition: 'color 0.2s', fontWeight: 500
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div id="search_icon" className="search-bar" style={{ position: 'relative' }}>
            <div
              onClick={() => {
                if (searchValue.trim()) submitSearch();
              }}
              style={{
                position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)',
                width: '32px', height: '32px', backgroundColor: '#1352f1', borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              ref={searchRef}
              type="text"
              id="searchInput"
              placeholder={active ? 'what you want to learn today ?..' : 'Search for skills, subjects'}
              value={searchValue}
              onChange={handleSearchChange}
              onClick={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchValue.trim()) {
                  submitSearch();
                  setDropdownOpen(false);
                }
              }}
              autoComplete="off"
            />
            {searchValue && (
              <div
                onClick={() => {
                  setSearchValue('');
                  setDropdownOpen(false);
                }}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', zIndex: 10
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            )}
            {dropdownOpen && filteredCourses.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  width: '100%', background: '#fff',
                  borderRadius: '14px', overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(19,82,241,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(19,82,241,0.12)',
                  zIndex: 2000, maxHeight: '260px', overflowY: 'auto'
                }}
              >
                <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>
                  Courses
                </div>
                {filteredCourses.map(course => (
                  <div
                    key={course}
                    onClick={() => selectCourse(course)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      fontSize: '14px', color: '#1e293b', fontWeight: '500',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1352f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                    <span>{course}</span>
                    {!user && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#1352f1', fontWeight: '700', background: '#eff4ff', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>Sign in</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div 
            className="courses-dropdown" 
            ref={coursesNavRef}
            onClick={() => setCoursesNavOpen(!coursesNavOpen)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px', color: '#333', fontSize: '14px' }}
          >
            <span>Courses</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {coursesNavOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: '-10px', marginTop: '15px',
                background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                padding: '8px 0', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', zIndex: 2000
              }}>
                {[
                  { id: 'courses', label: 'C++ Programming' },
                  { id: 'courses', label: 'Machine Learning' },
                  { id: 'courses', label: 'Artificial Intelligence' },
                  { id: 'courses', label: 'DBMS' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleExploreSelect(item.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#1e58ec'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#444'; }}
                    style={{
                      padding: '10px 20px', fontSize: '14px', color: '#444', 
                      cursor: 'pointer', transition: 'color 0.2s', fontWeight: 500
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="nav-links">
          {user ? (
            /* Logged-in state */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '6px 14px', fontSize: '14px', fontWeight: '600'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #041643, #4F6EF7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: 'bold'
                }}>
                  {(profile?.username || user.email)?.[0]?.toUpperCase()}
                </div>
                <span>{profile?.username || user.email}</span>
              </div>
              <button
                className="signin-btn"
                onClick={handleSignOut}
                style={{ cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          ) : (
            /* Logged-out state */
            <>
              <button className="signin-btn" onClick={() => openModal('signin')}>Sign in</button>
              <button className="signup-btn" onClick={() => openModal('signup')}>Sign up</button>
            </>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={activeTab}
      />
    </>
  );
}
