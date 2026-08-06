'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const courseResponses = {
  'css': 'CSS (Cascading Style Sheets) is used to style web pages, controlling layout, colors, and fonts. Example: `p { color: blue; }` sets paragraph text to blue. Want to know about a specific CSS property?',
  'html': 'HTML (HyperText Markup Language) structures content on the web. Example: `<div>Hello</div>` creates a container. Need help with a specific HTML tag?',
  'javascript': 'JavaScript adds interactivity to web pages. Example: `console.log("Hello");` prints to the console. Ask about a specific JavaScript feature!',
  'python': 'Python is a versatile programming language used in our Programming course. Example: `print("Hello")` outputs text. Want to learn about a Python concept?',
  'java': 'Java is a robust, object-oriented language taught in our Programming course. Example: `System.out.println("Hello");` prints text. Need help with Java syntax?',
  'ui/ux': 'UI/UX Designing focuses on user interfaces and experiences. UI is about visual design; UX is about usability. Want details on tools like Figma?',
  'web designing': "Our Web Designing course covers HTML, CSS, and JavaScript for building responsive websites. It's $99 for 8 weeks. Ask about a topic or type \"enroll now\" to join!",
  'programming': "Our Programming course teaches Python, Java, and C++. It's $120 for 10 weeks. Want to explore a specific language?",
  'ui/ux designing': "The UI/UX Designing course covers user-centered design and prototyping. It's $110 for 9 weeks. Interested in specific tools or techniques?",
};

const followUpDetails = {
  'css': [
    'CSS also supports responsive design with media queries, e.g., `@media (max-width: 600px) { body { font-size: 14px; } }`. Type "next" for more or "stop" to stop.',
    'Advanced CSS techniques include Flexbox for layouts and CSS Grid for complex grids. Type "next" for more or "stop" to stop.',
    'CSS preprocessors like Sass or Less can enhance productivity. Type "next" for more or "stop" to stop.',
  ],
  'html': [
    'HTML5 introduces semantic tags like `<header>`, `<footer>`, and `<article>` for better structure. Type "next" for more or "stop" to stop.',
    'It supports multimedia with `<audio>` and `<video>` tags, reducing reliance on plugins. Type "next" for more or "stop" to stop.',
    'HTML forms can be enhanced with attributes like `required` and `pattern` for validation. Type "next" for more or "stop" to stop.',
  ],
  'javascript': [
    'JavaScript uses event listeners, e.g., `document.addEventListener("click", function() { ... });`. Type "next" for more or "stop" to stop.',
    'It supports modern features like async/await for handling asynchronous operations. Type "next" for more or "stop" to stop.',
    'Frameworks like React and Node.js extend JavaScript for full-stack development. Type "next" for more or "stop" to stop.',
  ],
  'python': [
    'Python supports OOP with classes. Type "next" for more or "stop" to stop.',
    'It has powerful libraries like NumPy and Pandas. Type "next" for more or "stop" to stop.',
    "Python's simplicity makes it ideal for beginners and AI projects. Type \"next\" for more or \"stop\" to stop.",
  ],
  'java': [
    'Java uses inheritance with `extends` for code reuse. Type "next" for more or "stop" to stop.',
    'It supports multithreading with the `Thread` class. Type "next" for more or "stop" to stop.',
    "Java's JVM ensures platform independence. Type \"next\" for more or \"stop\" to stop.",
  ],
  'ui/ux': [
    'UI/UX tools include Adobe XD for prototyping and Sketch for vector design. Type "next" for more or "stop" to stop.',
    'User testing is key in UX, often using tools like UsabilityHub. Type "next" for more or "stop" to stop.',
    'Trends include microinteractions to enhance user engagement. Type "next" for more or "stop" to stop.',
  ],
  'web designing': [
    'Web Designing includes learning SEO basics to improve site visibility. Type "next" for more or "stop" to stop.',
    'Responsive design is taught using Bootstrap or Tailwind CSS frameworks. Type "next" for more or "stop" to stop.',
    'Projects may involve building a portfolio site as a capstone. Type "next" for more or "stop" to stop.',
  ],
  'programming': [
    'Programming covers algorithms like sorting and searching. Type "next" for more or "stop" to stop.',
    'Version control with Git is taught to manage code changes. Type "next" for more or "stop" to stop.',
    'Students work on real-world projects like a calculator or game. Type "next" for more or "stop" to stop.',
  ],
  'ui/ux designing': [
    'UI/UX Designing includes wireframing with tools like Figma or InVision. Type "next" for more or "stop" to stop.',
    'A/B testing is used to optimize user interfaces. Type "next" for more or "stop" to stop.',
    'Career paths include UX researcher or UI designer roles. Type "next" for more or "stop" to stop.',
  ],
};

const futureInsights = {
  'css': 'The future of CSS includes Container Queries, and improved animations with Houdini.',
  'html': 'HTML is evolving with Web Components and better accessibility standards.',
  'javascript': "JavaScript's future includes WebAssembly integration and dominance in full-stack development.",
  'python': "Python's future is bright with growth in AI, machine learning, and data science.",
  'java': 'Java will continue to thrive in enterprise applications and cloud computing.',
  'ui/ux': 'UI/UX is set to grow with AI-driven design tools and AR/VR integration.',
  'web designing': 'Web Designing is trending toward AI-assisted layouts and progressive web apps.',
  'programming': "Programming's future lies in automation, quantum computing, and AI.",
  'ui/ux designing': 'UI/UX Designing will see advancements in voice interfaces and personalized UX.',
};

const courseRoadmaps = {
  'web designing': '- Week 1-2: Introduction to HTML\n- Week 3-4: Mastering CSS\n- Week 5-6: JavaScript Basics\n- Week 7-8: Final Project',
  'programming': '- Week 1-3: Python Fundamentals\n- Week 4-6: Java Basics\n- Week 7-9: C++ Introduction\n- Week 10: Capstone Project',
  'ui/ux designing': '- Week 1-3: Design Principles\n- Week 4-6: Tool Mastery (Figma)\n- Week 7-9: User Testing\n- Week 10: Final Project',
};

const courses = ['Web Designing', 'Programming', 'UI/UX Designing'];

function normalizeInput(input) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function extractKeywords(text) {
  const keywords = {
    'design': ['design', 'ui', 'ux', 'art', 'creative', 'visual'],
    'programming': ['code', 'coding', 'program', 'develop', 'algorithm', 'script'],
    'web': ['web', 'website', 'html', 'css', 'javascript', 'site'],
  };
  const norm = normalizeInput(text);
  for (let cat in keywords) {
    for (let kw of keywords[cat]) {
      if (norm.includes(kw)) return cat;
    }
  }
  return null;
}

export default function ChatbotPage() {
  const router = useRouter();
  const messagesRef = useRef(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Welcome to the Course Q&A Assistant! I'm here to help you explore courses. Type 'help' for suggestions." }
  ]);
  const [chatState, setChatState] = useState({
    stage: 'qa',
    userData: { course: null, name: null, email: null },
    lastQuestion: null,
    followUpIndex: 0,
    isFollowUpActive: false,
  });

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  function addMessage(type, text) {
    setMessages(prev => [...prev, { type, text }]);
  }

  function processMessage(rawMessage) {
    const message = rawMessage.trim();
    if (!message) { addMessage('error', 'Please type a question or code snippet.'); return; }
    addMessage('user', 'You: ' + message);
    const norm = normalizeInput(message);
    const hasFuture = norm.includes('future');
    const isYes = norm === 'yes';
    const isNext = norm === 'next';
    const isStop = norm === 'stop';

    setTimeout(() => {
      setChatState(prev => {
        const state = { ...prev, userData: { ...prev.userData } };

        if (state.stage !== 'qa') {
          switch (state.stage) {
            case 'enrollmentGreeting':
              if (norm === 'yes') {
                state.stage = 'courseSelection';
                addMessage('bot', `Please choose a course: ${courses.join(', ')}. Type the course name or a number (1, 2, 3).`);
              } else if (norm === 'no') {
                state.stage = 'qa';
                addMessage('bot', 'No problem! Ask a question about our courses or type "enroll now" to start enrollment.');
              } else {
                addMessage('error', 'Please type "yes" or "no" to continue.');
              }
              break;
            case 'courseSelection':
              const idx = parseInt(message) - 1;
              const selected = courses[idx] || courses.find(c => normalizeInput(c) === norm);
              if (selected) {
                state.userData.course = selected;
                state.stage = 'userDetails';
                addMessage('bot', `Awesome, you've chosen ${selected}! Please provide your full name.`);
              } else {
                addMessage('error', `Invalid course. Choose from: ${courses.join(', ')} (or use 1, 2, 3).`);
              }
              break;
            case 'userDetails':
              if (!state.userData.name) {
                if (message.length < 2) { addMessage('error', 'Please provide a valid full name.'); }
                else { state.userData.name = message; addMessage('bot', 'Thanks! Now provide your email address.'); }
              } else if (!state.userData.email) {
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message)) {
                  state.userData.email = message;
                  state.stage = 'confirmation';
                  addMessage('bot', `Confirm your enrollment:\nCourse: ${state.userData.course}\nName: ${state.userData.name}\nEmail: ${state.userData.email}\nType "confirm", "restart", or "back".`);
                } else { addMessage('error', 'Please enter a valid email (e.g., user@example.com).'); }
              }
              break;
            case 'confirmation':
              if (norm === 'confirm') {
                state.stage = 'done';
                addMessage('bot', 'Enrollment confirmed! You\'ll receive a confirmation email soon. Type "ask" to return to Q&A or "enroll now" for another enrollment.');
              } else if (norm === 'restart') {
                state.stage = 'enrollmentGreeting';
                state.userData = { course: null, name: null, email: null };
                addMessage('bot', 'Let\'s start over. Would you like to enroll? (Type "yes" or "no")');
              } else if (norm === 'back') {
                state.stage = 'qa';
                state.userData = { course: null, name: null, email: null };
                addMessage('bot', 'Back to Q&A. What\'s your question? Type "help" for suggestions.');
              } else { addMessage('error', 'Please type "confirm", "restart", or "back".'); }
              break;
            case 'done':
              if (norm === 'ask') {
                state.stage = 'qa';
                state.userData = { course: null, name: null, email: null };
                addMessage('bot', 'What\'s your question? Type "help" for suggestions.');
              } else if (norm === 'enroll now') {
                state.stage = 'enrollmentGreeting';
                state.userData = { course: null, name: null, email: null };
                addMessage('bot', 'Would you like to start the enrollment process? (Type "yes" or "no")');
              } else { addMessage('error', 'Type "ask" to return to Q&A or "enroll now" to start another enrollment.'); }
              break;
          }
          return state;
        }

        // Q&A stage
        if (norm === 'enroll now') {
          state.stage = 'enrollmentGreeting';
          addMessage('bot', 'Would you like to start the enrollment process? (Type "yes" or "no")');
        } else if (norm === 'help') {
          addMessage('bot', 'Ask about: CSS, HTML, JavaScript, Python, Java, UI/UX, Web Designing, Programming, or UI/UX Designing. Describe your interests for a course suggestion. Include "future" for future insights or "yes" for detailed info, then "next"/"stop".');
        } else if (isYes && state.lastQuestion) {
          state.isFollowUpActive = true;
          state.followUpIndex = 0;
          addMessage('bot', followUpDetails[state.lastQuestion][0]);
        } else if (isNext && state.isFollowUpActive && state.lastQuestion) {
          state.followUpIndex = (state.followUpIndex + 1) % followUpDetails[state.lastQuestion].length;
          addMessage('bot', followUpDetails[state.lastQuestion][state.followUpIndex]);
        } else if (isStop && state.isFollowUpActive) {
          state.isFollowUpActive = false;
          state.followUpIndex = 0;
          addMessage('bot', 'Follow-up stopped. Ask a new question or type "help" for suggestions.');
        } else {
          const matchedKey = Object.keys(courseResponses).find(key => norm.includes(key));
          if (matchedKey) {
            state.lastQuestion = matchedKey;
            state.followUpIndex = 0;
            state.isFollowUpActive = false;
            const base = courseResponses[matchedKey];
            const future = futureInsights[matchedKey] || 'No specific future insights available yet.';
            addMessage('bot', hasFuture ? `${base}\nFuture Insight: ${future}` : base);
          } else {
            const interest = extractKeywords(message);
            if (interest) {
              const suggested = { design: 'UI/UX Designing', programming: 'Programming', web: 'Web Designing' }[interest];
              const roadmap = courseRoadmaps[suggested.toLowerCase()];
              addMessage('bot', `Based on your interest, I suggest the ${suggested} course. Here's a roadmap:\n${roadmap}\nType "enroll now" to start or ask more questions!`);
            } else {
              addMessage('error', "I'm not sure I understood that. Try asking about CSS, HTML, JavaScript, Python, UI/UX, or describe your interests. Type \"help\" for suggestions.");
            }
          }
        }
        return state;
      });
    }, 500);
  }

  function handleSend() {
    processMessage(input);
    setInput('');
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ fontFamily: '"Poppins", sans-serif', margin: 0, padding: 0, backgroundColor: '#0a0e1a', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '700px', width: '100%', margin: '50px auto', padding: '20px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative' }}>
        <h2 style={{ color: '#ffffff', fontSize: '32px', textAlign: 'center', marginBottom: '20px' }}>Course Q&amp;A Assistant</h2>
        <button
          onClick={() => router.back()}
          style={{ position: 'absolute', top: '20px', left: '20px', padding: '10px 20px', border: '1px solid #007bff', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', fontSize: '14px', cursor: 'pointer', fontFamily: '"Poppins", sans-serif' }}
        >
          Back
        </button>
        <div style={{ border: '1px solid #8b8585', padding: '20px', height: '500px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #8b8585', padding: '10px', fontSize: '14px' }}>
            {messages.map((msg, i) => (
              <p key={i} style={{
                margin: '5px 0', padding: '10px', borderRadius: '5px', maxWidth: '80%', wordWrap: 'break-word', whiteSpace: 'pre-wrap',
                animation: 'slideIn 0.3s ease-out',
                ...(msg.type === 'user' ? { backgroundColor: '#007bff', color: 'white', marginLeft: 'auto', textAlign: 'right' }
                  : msg.type === 'error' ? { backgroundColor: 'rgba(255,0,0,0.2)', color: '#fff', marginRight: 'auto' }
                  : { backgroundColor: 'rgba(0,5,8,0.8)', color: '#fff', textShadow: '0 0 6px rgba(255,255,255,0.6)', marginRight: 'auto' })
              }}>
                {msg.text}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', padding: '10px' }}>
            <textarea
              id="chatInput"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question or code..."
              aria-label="Chat input"
              style={{ flex: 1, padding: '10px', marginRight: '10px', border: '1px solid #8b8585', borderRadius: '5px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.7)', resize: 'none', height: '60px', fontFamily: '"Poppins", sans-serif' }}
            />
            <button
              onClick={handleSend}
              style={{ padding: '10px 20px', border: '1px solid #007bff', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', fontSize: '14px', cursor: 'pointer', fontFamily: '"Poppins", sans-serif' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
