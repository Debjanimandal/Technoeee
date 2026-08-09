'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/context/auth-context';

const COURSES_DATA = [
  { img: '/image/Rectangle 25.jpg', title: '10,000 STUDENTS LEARN CODING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 26.jpg', title: '10,000 STUDENTS LEARN WEB DESIGNING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 27.jpg', title: '10,000 STUDENTS LEARN UI/UX DESIGNING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 28.jpg', title: '10,000 STUDENTS LEARN PHOTOGRAPHY WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 25 (1).jpg', title: '10,000 STUDENTS LEARN CODING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 26 (1).jpg', title: '10,000 STUDENTS LEARN WEB DESIGNING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 27 (1).jpg', title: '10,000 STUDENTS LEARN UI/UX DESIGNING WITH ME', duration: '1h 30m', instructor: 'Daniel' },
  { img: '/image/Rectangle 28 (1).jpg', title: '10,000 STUDENTS LEARN PHOTOGRAPHY WITH ME', duration: '1h 30m', instructor: 'Daniel' },
];

const CATEGORIES = ['Featured','Music','Drawing & Painting','Animation','Creative Writing','Marketing','UI/UX Design','Social Media','Productivity','Graphics Design','Freelancing & Entrepreneurship','Programming'];

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
      <div className="categories">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} className={`category-btn${i === 0 ? ' featured' : ''}`}>{cat}</button>
        ))}
      </div>
      <div className="course-grid">
        {COURSES_DATA.map((course, i) => (
          <div className="course-card" key={i}>
            <img src={course.img} alt="Course" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <div className="course-info">
              <p className="title">{course.title}</p>
              <p>{course.duration}</p>
              <p className="instructor">{course.instructor}</p>
            </div>
          </div>
        ))}
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
