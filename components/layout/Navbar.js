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
              onClick={() => active && setDropdownOpen(true)}
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
            {dropdownOpen && active && (
              <div ref={dropdownRef} className="custom-dropdown active">
                {filteredCourses.map(course => (
                  <div key={course} onClick={() => selectCourse(course)}>{course}</div>
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
