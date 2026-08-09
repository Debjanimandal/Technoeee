'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '@/lib/context/auth-context';

const COURSES = [
  'Featured','Music','Drawing & Painting','Animation','Creative Writing',
  'Marketing','UI/UX Design','Social Media','Productivity',
  'Graphics Design','Freelancing & Entrepreneurship','Programming'
];

export default function Navbar({ active, onSignIn, onSignUp }) {
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

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
          <Image src="/image/logo.png" alt="TechnoEEE Logo" width={160} height={80} style={{ objectFit: 'contain' }} unoptimized />
        </div>
        <div className="navbar-center">
          <div className="browse-dropdown">
            <select><option>Browse</option></select>
          </div>
          <div id="search_icon" className="search-bar" style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              id="searchInput"
              placeholder={active ? 'Select a course...' : 'Search for skills, subjects'}
              value={searchValue}
              onChange={handleSearchChange}
              onClick={() => active && setDropdownOpen(true)}
              autoComplete="off"
            />
            {dropdownOpen && active && (
              <div ref={dropdownRef} className="custom-dropdown active">
                {filteredCourses.map(course => (
                  <div key={course} onClick={() => selectCourse(course)}>{course}</div>
                ))}
              </div>
            )}
          </div>
          <div className="pricing-dropdown">
            <select><option>Pricing</option></select>
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
