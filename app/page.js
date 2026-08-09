'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import coursesData from '../public/real_courses_data.json';

const CATEGORIES = ['All', 'Programming Fundamentals', 'Core CS Foundation', 'High Demand Industry Skill', 'Essential Industry Concept', 'Core Infrastructure', 'Theoretical Computer Science', 'Core Hardware Concept'];

function getRelevanceColor(rel) {
  const r = rel || '';
  if (r.includes('Demand') || r.includes('Trend')) return { bg: '#f3e5f5', text: '#6a1b9a', border: '#e1bee7' };
  if (r.includes('Foundation') || r.includes('Core') || r.includes('Essential')) return { bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' };
  if (r.includes('Theoretical')) return { bg: '#eceff1', text: '#455a64', border: '#cfd8dc' };
  return { bg: '#e8eaf6', text: '#283593', border: '#c5cae9' };
}

function getDifficultyColor(diff) {
  const d = diff || '';
  if (d.includes('Beginner')) return { bg: '#e8f5e9', text: '#2e7d32' };
  if (d.includes('Intermediate')) return { bg: '#fff8e1', text: '#f57f17' };
  if (d.includes('Advanced')) return { bg: '#ffebee', text: '#c62828' };
  return { bg: '#f5f5f5', text: '#616161' };
}

const CHANNELS = [
  { name: 'Marketing Analysis', img: '/image/Ellipse 12.jpg' },
  { name: 'Graphics Designing', img: '/image/Ellipse 12 (1).jpg' },
  { name: 'Web Development', img: '/image/Ellipse 12 (2).jpg' },
  { name: 'Web Designing', img: '/image/Ellipse 12 (3).jpg' },
];

const FAQ_ITEMS = [
  { q: 'How do I become a teacher?', a: 'To become a teacher, you need to sign up on our platform, submit an application with your credentials, and complete our teacher training program.' },
  { q: 'What is Techno EEE?', a: 'In our Techno EEE you will learn how to observe your learning process and how to get improve in such things.' },
  { q: 'How to become a coder?', a: "To become a coder, you'll typically need to learn programming languages, practice regularly, build projects, and potentially pursue formal education or certifications." },
];

export default function Home() {
  const [devMode, setDevMode] = useState(false);
  const [chatChannel, setChatChannel] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrollHide, setScrollHide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
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
    document.body.style.overflow = devMode ? 'auto' : 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
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
          <h1 id="mainHeading">{devMode ? 'BE YOUR BEST IN' : 'DIVE INTO TECHNO EEE'}</h1>
          <div className="paragraph-wrapper">
            <p id="potentialText">
              {devMode ? 'Learn something new today!' : 'Unlock Your Potential and Make an Impact with Your Skills!'}
            </p>
            {!devMode && <p id="kickstartText">Kickstart Your Journey by Enabling Techno EEE!</p>}
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
            <span>Techno EEE</span>
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
            <div className="code-fragment">&#125; // Dev Mode On</div>
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
      <p style={{ textAlign: 'center', color: '#666', marginTop: '-10px', marginBottom: '10px', fontSize: '15px' }}>
        Browse our real academic curriculum — enroll and start learning today
      </p>

      {/* Category Filter */}
      <div className="categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-btn${selectedCategory === cat ? ' featured' : ''}`}
          >{cat}</button>
        ))}
      </div>

      {/* Real Course Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '28px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 20px',
      }}>
        {coursesData
          .filter(c => selectedCategory === 'All' || c.relevance === selectedCategory)
          .slice(0, 8)
          .map((course, i) => {
            const relColor = getRelevanceColor(course.relevance);
            const diffColor = getDifficultyColor(course.difficulty);
            const isHighDemand = course.relevance && (course.relevance.includes('Demand') || course.relevance.includes('Trend'));
            return (
              <div
                key={i}
                onClick={() => router.push('/courses')}
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: isHighDemand ? '1px solid rgba(138,43,226,0.35)' : '1px solid rgba(200,210,230,0.6)',
                  borderRadius: '16px',
                  padding: '24px 22px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isHighDemand
                    ? '0 0 30px rgba(138,43,226,0.4)'
                    : '0 8px 25px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'visible',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = isHighDemand
                    ? '0 0 45px rgba(138,43,226,0.6)'
                    : '0 16px 40px rgba(0,100,255,0.12)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isHighDemand
                    ? '0 0 30px rgba(138,43,226,0.4)'
                    : '0 8px 25px rgba(0,0,0,0.06)';
                }}
              >
                {/* Top gradient bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '5px',
                  background: 'linear-gradient(90deg, #3a8aff, #800080)',
                  borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
                }} />

                {/* Relevance badge */}
                <div style={{
                  position: 'absolute', top: '-12px', right: '18px',
                  background: relColor.bg, color: relColor.text,
                  border: `1px solid ${relColor.border}`,
                  padding: '3px 11px', borderRadius: '20px',
                  fontSize: '10.5px', fontWeight: '700',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.1)', zIndex: 10,
                }}>
                  {course.relevance || 'Course'}
                </div>

                {/* Subject code chip */}
                <div style={{ marginBottom: '12px', marginTop: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    background: 'rgba(58,138,255,0.1)', color: '#3a8aff',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '11.5px', fontWeight: '700',
                  }}>
                    {course.subject_code || 'General'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '15px', fontWeight: '700', color: '#1a1a1a',
                  marginBottom: '14px', lineHeight: '1.45',
                }}>
                  {course.course_name}
                </h3>

                {/* Footer row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>⏱ {course.estimated_time || '45 Hours'}</span>
                    {course.difficulty && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        background: diffColor.bg, color: diffColor.text,
                        padding: '2px 8px', borderRadius: '10px',
                      }}>{course.difficulty}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#3a8aff' }}>View Details ➔</span>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* View All CTA */}
      <div style={{ textAlign: 'center', marginTop: '36px', marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/courses')}
          style={{
            padding: '13px 40px',
            background: 'linear-gradient(135deg, #3a8aff, #800080)',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(58,138,255,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(58,138,255,0.45)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(58,138,255,0.35)'; }}
        >
          View All Courses ➔
        </button>
      </div>

      {/* Community Section */}
      <div className="section-header">Explore Our Community</div>
      <div className="community-container">
        <div className="channels-section" style={{ display: chatChannel ? 'none' : 'block' }}>
          <h2>Channels</h2>
          {CHANNELS.map(ch => (
            <div key={ch.name} className="channel" onClick={() => setChatChannel(ch.name)}>
              <img src={ch.img} alt="Channel Icon" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }} />
              <span>{ch.name}</span>
            </div>
          ))}
        </div>
        <div className={`chat-section${chatChannel ? ' active' : ''}`} id="chatSection">
          <div className="chat-header">
            <div className="user-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={() => setChatChannel(null)} style={{ cursor: 'pointer' }}>
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
              <img src="/image/Ellipse 12 (4).jpg" alt="User Avatar" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }} />
              <span id="channelName">{chatChannel} Chat</span>
            </div>
            <div className="icons">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-10V5l8-3 8 3v7c0 5.5-8 10-8 10z"></path>
              </svg>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Doubts or Queries" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"></path>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </div>
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

      <Footer />
    </main>
  );
}
