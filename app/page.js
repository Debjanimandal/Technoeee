'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/lib/context/auth-context';

const COURSES_DATA = [
  { code: 'TIU-UCS-T214',        title: 'Object Oriented Programming using C++',   duration: '45 Hours', difficulty: 'Beginner',      instructor: 'Dept. of CSE-AI, TIU',    img: '/course-banners/c++.png' },
  { code: 'TIU-PC-UCS-T22101',   title: 'Computer Organization and Architecture',    duration: '45 Hours', difficulty: 'Intermediate',  instructor: 'Dept. of CSE, TIU',       img: '/course-banners/coa.png' },
  { code: 'TIU-UCS-T350',        title: 'Artificial Intelligence',                   duration: '45 Hours', difficulty: 'Advanced',      instructor: 'Dept. of AI, TIU',        img: '/course-banners/ai.png' },
  { code: 'TIU-UCS-T321',        title: 'Design and Analysis of Algorithm',          duration: '45 Hours', difficulty: 'Intermediate',  instructor: 'Dept. of CSE, TIU',       img: '/course-banners/daa.png' },
  { code: 'TIU-UCS-T301',        title: 'Database Management System',                duration: '45 Hours', difficulty: 'Intermediate',  instructor: 'Dept. of CSE, TIU',       img: '/course-banners/dbms.png' },
  { code: 'TIU-UCS-T451',        title: 'Machine Learning',                          duration: '45 Hours', difficulty: 'Advanced',      instructor: 'Dept. of AI, TIU',        img: '/course-banners/ml.png' },
  { code: 'TIU-UCS-T304',        title: 'Computer Networks',                         duration: '45 Hours', difficulty: 'Intermediate',  instructor: 'Dept. of CSE, TIU',       img: '/course-banners/cn.png' },
  { code: 'TIU-UCS-T351',        title: 'Automata Theory & Compiler Design',         duration: '45 Hours', difficulty: 'Advanced',      instructor: 'Dept. of CS Theory, TIU', img: '/course-banners/automata.png' },
];

const CATEGORIES = ['Featured', 'Programming Fundamentals', 'Core CS Foundation', 'High Demand Industry Skill', 'Essential Industry Concept', 'Core Infrastructure', 'Theoretical Computer Science', 'Core Hardware Concept'];

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: 'My Courses',
    desc: 'Enroll in university-grade CS courses and track your progress through structured modules.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Study Planner',
    desc: 'Build a personalized week-by-week schedule and stay on track with smart pacing.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'My Analytics',
    desc: 'Visualize study time, topic strengths, and performance trends with detailed charts.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'AI Chatbot',
    desc: 'Ask any subject question and get instant, intelligent answers powered by AI.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    title: 'Course Badges',
    desc: 'Complete courses and earn shareable badges to showcase your accomplishments.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    title: 'Dashboard',
    desc: 'See all active courses, streaks, and learning stats at a glance in your hub.',
  },
];

const FAQ_ITEMS = [
  { q: 'How do I become a teacher?', a: 'To become a teacher, you need to sign up on our platform, submit an application with your credentials, and complete our teacher training program.' },
  { q: 'What is TechnoEEE?', a: 'In TechnoEEE you will learn how to observe your learning process and how to get improve in such things.' },
  { q: 'How to become a coder?', a: "To become a coder, you'll typically need to learn programming languages, practice regularly, build projects, and potentially pursue formal education or certifications." },
];

export default function Home() {
  const [devMode, setDevMode] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrollHide, setScrollHide] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const fragmentsRef = useRef(null);
  const animationRef = useRef(null);
  const coursesHeaderRef = useRef(null);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Auto-redirect logged-in users straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  // Body overflow control
  useEffect(() => {
    const overflow = devMode ? 'auto' : 'hidden';
    document.body.style.overflow = overflow;
    document.documentElement.style.overflow = overflow;
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [devMode]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (!coursesHeaderRef.current) return;
      const headerTop = coursesHeaderRef.current.getBoundingClientRect().top + window.scrollY;
      const scrollPos = window.scrollY + window.innerHeight;
      setScrollHide(scrollPos > headerTop);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mousemove 3D tilt
  function handleMouseMove(e) {
    if (!fragmentsRef.current || !animationRef.current) return;
    const rect = fragmentsRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 50;
    const y = (e.clientY - rect.top - rect.height / 2) / 50;
    fragmentsRef.current.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  }
  function handleMouseLeave() {
    if (fragmentsRef.current) {
      fragmentsRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
  }

  function scrollToLearn() {
    coursesHeaderRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main>
      {/* Cosmic pulse loading screen */}
      <div className={`navbar-placeholder${devMode ? ' hidden' : ''}`} id="navbarPlaceholder">
        <div className="cosmic-pulse">
          <div className="pulse-orb"></div>
          <div className="energy-wave"></div>
          <div className="energy-wave"></div>
          <div className="energy-wave"></div>
          <div className="spark-particle"></div>
          <div className="spark-particle"></div>
          <div className="spark-particle"></div>
          <div className="spark-particle"></div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar active={devMode} />

      {/* Hero section */}
      <div className={`main-content${devMode ? ' dev-mode-on' : ''}`} id="mainContent">
        <div className={`text-content${devMode ? ' dev-mode-on' : ''}`} id="textContent">
          <h1 id="mainHeading">{devMode ? 'BE YOUR BEST IN' : 'DIVE INTO TECHNOEEE'}</h1>
          <div className="paragraph-wrapper">
            <p id="potentialText">
              {devMode ? 'Learn something new today!' : 'Unlock Your Potential and Make an Impact with Your Skills!'}
            </p>
            {!devMode && <p id="kickstartText">Kickstart Your Journey by Enabling TechnoEEE!</p>}
            {devMode && <p id="startJourneyText">Start your journey</p>}
          </div>
          <div className={`toggle-switch${devMode ? ' dev-mode-on' : ''}`} id="toggleSwitch">
            <input
              type="checkbox"
              id="dev-mode"
              checked={devMode}
              onChange={e => {
                if (e.target.checked && user) {
                  // Already logged in — go straight to dashboard
                  router.push('/home');
                } else {
                  setDevMode(e.target.checked);
                }
              }}
            />
            <label htmlFor="dev-mode"></label>
            <span>TechnoEEE</span>
          </div>
        </div>

        {/* Dev Mode Animation */}
        <div
          className={`dev-mode-animation${devMode ? ' active' : ''}`}
          id="devModeAnimation"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          ref={animationRef}
        >
          {!devMode && (
            <div className="sad-animation">
              <div className="sad-signal"></div>
              <div className="sad-signal"></div>
              <div className="sad-signal"></div>
              <div className="sad-signal"></div>
              <div className="sad-signal"></div>
              <div className="sad-sparkle"></div>
              <div className="sad-sparkle"></div>
              <div className="sad-sparkle"></div>
            </div>
          )}
          <div className="code-fragments" ref={fragmentsRef}>
            <div className="code-fragment">function enableDev() &#123;</div>
            <div className="code-fragment">&nbsp;&nbsp;console.log(&quot;Ready!&quot;);</div>
            <div className="code-fragment">&nbsp;&nbsp;return true;</div>
            <div className="code-fragment">&#125; // TechnoEEE On</div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
          </div>
        </div>
      </div>

      {/* Scroll to learn */}
      <button
        className={`scroll-to-learn${devMode && !scrollHide ? ' active' : ''}`}
        id="scrollToLearn"
        onClick={scrollToLearn}
        style={scrollHide ? { opacity: 0, pointerEvents: 'none' } : {}}
      >
        Scroll to Learn More
      </button>

      {/* Courses Section */}
      <div className="section-header" ref={coursesHeaderRef}>Explore Inspiring Online Courses</div>
      <div className="categories">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} className={`category-btn${i === 0 ? ' featured' : ''}`}>{cat}</button>
        ))}
      </div>
      <div className="course-grid">
        {COURSES_DATA.map((course, i) => (
          <div
            className="course-card"
            key={i}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              position: 'relative',
              transform: hoveredCard === i ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredCard === i ? '0 16px 40px rgba(58,138,255,0.25)' : undefined,
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
          >
            {/* Banner image thumbnail */}
            <div style={{ width: '100%', height: '160px', position: 'relative', overflow: 'hidden' }}>
              <img
                src={course.img}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Course code top-left */}
              <div style={{
                position: 'absolute', top: '10px', left: '10px',
                background: 'rgba(0,0,0,0.5)', borderRadius: '6px',
                padding: '2px 8px', fontSize: '9px',
                color: '#fff', fontWeight: '700', letterSpacing: '0.4px'
              }}>{course.code}</div>
              {/* Difficulty badge bottom-right */}
              <div style={{
                position: 'absolute', bottom: '9px', right: '10px',
                background: 'rgba(0,0,0,0.55)', borderRadius: '10px',
                padding: '2px 9px', fontSize: '9px',
                color: '#fff', fontWeight: '700',
              }}>{course.difficulty}</div>

              {/* Hover overlay with Learn Now button */}
              {hoveredCard === i && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(5,15,40,0.82)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '12px',
                  animation: 'fadeInOverlay 0.2s ease',
                }}>
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600', textAlign: 'center', padding: '0 12px', lineHeight: 1.4 }}>
                    {course.title}
                  </span>
                  <button
                    onClick={() => setAuthOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #3a8aff 0%, #1a2980 100%)',
                      color: '#fff', border: 'none', borderRadius: '20px',
                      padding: '9px 24px', fontSize: '13px', fontWeight: '700',
                      cursor: 'pointer', letterSpacing: '0.3px',
                      boxShadow: '0 6px 18px rgba(58,138,255,0.45)',
                      transform: 'scale(1)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(58,138,255,0.6)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(58,138,255,0.45)'; }}
                  >
                    Learn Now →
                  </button>
                </div>
              )}
            </div>
            {/* Card info */}
            <div className="course-info">
              <p className="title">{course.title}</p>
              <p>{course.duration}</p>
              <p className="instructor">{course.instructor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="section-header">Explore Our Features</div>
      <div className="community-container">
        <div className="channels-section">
          <h2>Platform Features</h2>
          {FEATURES.slice(0, 3).map((f, i) => (
            <div key={i} className="channel" style={{ cursor: 'default' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: '#1a2980', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', marginRight: '12px',
              }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="channels-section">
          <h2>&nbsp;</h2>
          {FEATURES.slice(3).map((f, i) => (
            <div key={i} className="channel" style={{ cursor: 'default' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: '#1a2980', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', marginRight: '12px',
              }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="background-section">
        <div className="section-header highlighted">
          What Our <span className="highlight">Clients</span> Say
        </div>
        <div className="testimonials-container">
          <div className="testimonials">
            {[
              { img: '/image/unsplash_DItYlc26zVI.jpg', role: 'Web Designer', name: 'John Doe', text: 'This platform has been a game-changer for my design skills! The UI/UX courses offered practical tips and real-world projects that helped me create more engaging and user-friendly educational websites.' },
              { img: '/image/unsplash_C8Ta0gwPbQg.jpg', role: 'Engineer', name: 'Jane Smith', text: 'The engineering-focused courses on this platform are top-notch. I learned advanced concepts in a structured way, and the interactive simulations made complex topics like algorithms and data structures much easier to grasp.' },
              { img: '/image/unsplash_ttSRjiYG_WM.jpg', role: 'Developer', name: 'Emily Johnson', text: 'As a developer, I appreciate how this platform offers in-depth coding tutorials. The step-by-step projects helped me build educational apps, and the community support was invaluable for troubleshooting issues.' },
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-header">
                  <img src={t.img} alt={t.name} />
                  <span className="role-label">{t.role}</span>
                </div>
                <p>{t.text}</p>
                <div className="client-details"><h3>{t.name}</h3></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-container">
        <h1>Frequently Asked Question</h1>
        <div className="faq">
          {FAQ_ITEMS.map((item, i) => (
            <div className="faq-item" key={i}>
              <button className="question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {item.q}
                <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`}></i>
              </button>
              <div className={`answer${openFaq === i ? ' open' : ''}`}>{item.a}</div>
            </div>
          ))}
        </div>

        <div className="social-media">
          <h2>FOLLOW US ON</h2>
          <div className="social-icons">
            <a href="#" className="facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" className="youtube"><i className="fab fa-youtube"></i></a>
            <a href="#" className="pinterest"><i className="fab fa-pinterest"></i></a>
            <a href="#" className="linkedin"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      {/* Sign-in modal triggered by Learn Now button */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab="signin"
      />

      {/* Keyframe for hover overlay fade-in */}
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <Footer />
    </main>
  );
}
