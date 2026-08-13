'use client';
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Video, Mic, MicOff, VideoOff, Square, Play,
  CheckCircle2, ChevronRight, Activity, BrainCircuit,
  Eye, User, Timer, Award, MessageSquare, BarChart2
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────
const QUESTION_BANK = {
  Technical: [
    'Explain the difference between var, let, and const in JavaScript. When would you use each?',
    'What is the virtual DOM in React, and how does it improve performance?',
    'How does asynchronous programming work in JavaScript? Explain promises and async/await.',
    'What is the difference between SQL and NoSQL databases? Give examples of when to use each.',
    'Explain the concept of RESTful APIs and how you would design one for a social media app.',
  ],
  Behavioral: [
    'Tell me about a time when you had to work under a tight deadline. How did you manage it?',
    'Describe a situation where you had a conflict with a teammate. How did you resolve it?',
    'Tell me about a project you are most proud of. What was your role and the outcome?',
    'Describe a time when you had to learn a new technology very quickly. How did you approach it?',
    'Tell me about a failure you experienced and what you learned from it.',
  ],
  HR: [
    'Tell me about yourself — your background, skills, and what brings you here today.',
    'Why are you interested in this role and what makes you a good fit?',
    'Where do you see yourself professionally in the next 3 to 5 years?',
    'What are your greatest strengths and what areas do you feel you need to improve?',
    'What motivates you in your work and what kind of team environment do you thrive in?',
  ],
};

const TECH_KEYWORDS = [
  'react','javascript','python','java','css','html','api','database','algorithm',
  'function','array','object','class','async','promise','state','component',
  'variable','loop','recursion','git','agile','scrum','testing','debugging',
  'performance','sql','rest','graphql','node','server','framework','library',
  'typescript','docker','cloud','microservice','design','pattern','structure',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject();
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

const getGrade = (score) => {
  if (score >= 85) return { label: 'Excellent', color: '#10b981' };
  if (score >= 70) return { label: 'Good',      color: '#3b82f6' };
  if (score >= 55) return { label: 'Average',   color: '#f59e0b' };
  return                   { label: 'Needs Improvement', color: '#ef4444' };
};

const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ─── Setup Modal ───────────────────────────────────────────────────────────────
function SetupModal({ onStart, onClose }) {
  const [type, setType] = useState('Behavioral');
  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(5px)'
    }}>
      <style>{`@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background:'#fff',borderRadius:'24px',padding:'40px',width:'480px',maxWidth:'95vw',
        boxShadow:'0 25px 60px rgba(0,0,0,0.3)',animation:'su 0.3s ease'
      }}>
        <h2 style={{color:'#2b5876',fontSize:'22px',marginBottom:'6px',fontWeight:'bold'}}>Configure Your Interview</h2>
        <p style={{color:'#64748b',marginBottom:'24px',fontSize:'14px'}}>Select the type of interview you want to practice.</p>

        <div style={{marginBottom:'24px'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Interview Type</div>
          <div style={{display:'flex',gap:'10px'}}>
            {Object.keys(QUESTION_BANK).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex:1,padding:'12px 8px',borderRadius:'12px',
                border:`2px solid ${type===t?'#2b5876':'#e2e8f0'}`,
                background:type===t?'#f0f7ff':'#fff',
                color:type===t?'#2b5876':'#64748b',fontWeight:type===t?'bold':'normal',
                cursor:'pointer',transition:'all 0.2s',fontSize:'14px'
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{background:'#f0fdf4',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1px solid #bbf7d0'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#166534',marginBottom:'10px'}}>✅ Tips for best results</div>
          {[
            'Sit upright and look directly at your webcam',
            'Speak clearly at a steady pace (110–150 wpm)',
            'Use a well-lit room with minimal background noise',
          ].map((tip,i) => (
            <div key={i} style={{fontSize:'13px',color:'#166534',display:'flex',gap:'8px',marginBottom:i<2?'6px':0}}>
              <span>•</span>{tip}
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:'12px'}}>
          <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:'12px',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>
            Cancel
          </button>
          <button onClick={() => onStart(type)} style={{
            flex:2,padding:'13px',borderRadius:'12px',border:'none',
            background:'linear-gradient(135deg,#2b5876,#4e4376)',color:'#fff',
            cursor:'pointer',fontWeight:'bold',fontSize:'15px',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
            boxShadow:'0 4px 15px rgba(43,88,118,0.4)'
          }}>
            <Play size={16}/> Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ value, size = 80, strokeWidth = 7, color }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.5s ease'}}/>
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MockInterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [interviewState, setInterviewState] = useState('idle'); // idle|setup|initializing|interviewing|completed
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [report, setReport] = useState(null);
  const [initStatus, setInitStatus] = useState('');

  // ── Media ───────────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // ── MediaPipe refs ──────────────────────────────────────────────────────────
  const faceMeshRef = useRef(null);
  const poseRef = useRef(null);
  const animFrameRef = useRef(null);
  const frameCountRef = useRef(0);

  // ── Tracking refs (stable values for callbacks) ─────────────────────────────
  const eyeContactFramesRef = useRef(0);
  const goodPostureFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const startTimeRef = useRef(null);
  const wordCountRef = useRef(0);
  const currentQIdxRef = useRef(0);
  const detectedKwRef = useRef([]);
  const questionsRef = useRef([]);

  // ── Analytics state (for display) ───────────────────────────────────────────
  const [eyeContactScore, setEyeContactScore] = useState(100);
  const [postureScore, setPostureScore]       = useState(100);
  const [eyeStatus, setEyeStatus]             = useState('Waiting...');
  const [postureStatus, setPostureStatus]     = useState('Waiting...');
  const [captions, setCaptions]               = useState('');
  const [wpm, setWpm]                         = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(120);

  // ── Timers ───────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const qTimerRef = useRef(null);
  const recognitionRef = useRef(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // ── Attach stream to video element after it mounts ──────────────────────────
  useEffect(() => {
    if (interviewState === 'interviewing' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [interviewState]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
    };
  }, []);

  // ── Frame processing ─────────────────────────────────────────────────────────
  const processFrameRef = useRef(null);
  processFrameRef.current = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrameRef.current);
      return;
    }

    frameCountRef.current++;

    // Alternate: FaceMesh on even frames, Pose on odd frames (performance balance)
    if (frameCountRef.current % 4 === 0 && faceMeshRef.current) {
      try { await faceMeshRef.current.send({ image: video }); } catch (_) {}
    } else if (frameCountRef.current % 4 === 2 && poseRef.current) {
      try { await poseRef.current.send({ image: video }); } catch (_) {}
    }

    animFrameRef.current = requestAnimationFrame(processFrameRef.current);
  };

  // ── startInterview ───────────────────────────────────────────────────────────
  const startInterview = async (type) => {
    const qs = QUESTION_BANK[type];
    setQuestions(qs);
    questionsRef.current = qs;
    setCurrentQIdx(0);
    currentQIdxRef.current = 0;
    setInterviewState('initializing');

    try {
      // 1. Get camera + mic
      setInitStatus('Requesting camera and microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      // 2. Load MediaPipe scripts from CDN
      setInitStatus('Loading Face Detection model...');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');

      setInitStatus('Loading Pose Detection model...');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js');

      setInitStatus('Initializing AI models (this takes ~10s on first run)...');

      // 3. Init FaceMesh
      const faceMesh = new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,   // enables iris landmarks 468–477
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results) => {
        totalFramesRef.current++;
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setEyeStatus('No face detected');
          const s = totalFramesRef.current > 0
            ? Math.round((eyeContactFramesRef.current / totalFramesRef.current) * 100)
            : 100;
          setEyeContactScore(s);
          return;
        }
        const lm = results.multiFaceLandmarks[0];
        if (lm.length < 478) {
          // Iris refinement not ready yet – assume looking
          eyeContactFramesRef.current++;
          return;
        }
        // Iris center landmarks: 468 (left), 473 (right)
        // Eye corner landmarks: 33 outer-left, 133 inner-left, 362 inner-right, 263 outer-right
        const li = lm[468]; const ri = lm[473];
        const lc = { x: (lm[33].x + lm[133].x) / 2 };
        const rc = { x: (lm[263].x + lm[362].x) / 2 };
        const lw = Math.abs(lm[33].x - lm[133].x);
        const rw = Math.abs(lm[263].x - lm[362].x);
        const devL = lw > 0 ? Math.abs(li.x - lc.x) / lw : 0;
        const devR = rw > 0 ? Math.abs(ri.x - rc.x) / rw : 0;
        const avgDev = (devL + devR) / 2;
        const isLooking = avgDev < 0.22;
        if (isLooking) eyeContactFramesRef.current++;
        const s = Math.round((eyeContactFramesRef.current / totalFramesRef.current) * 100);
        setEyeContactScore(s);
        setEyeStatus(isLooking ? '✅ Looking at camera' : '⚠️ Look at the camera');
      });
      await faceMesh.initialize();
      faceMeshRef.current = faceMesh;

      // 4. Init Pose
      const pose = new window.Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results) => {
        if (!results.poseLandmarks) return;
        const lm = results.poseLandmarks;
        const ls = lm[11]; const rs = lm[12]; const nose = lm[0];
        if (!ls || !rs || !nose) return;
        const tilt = Math.abs(ls.y - rs.y);
        const avgShY = (ls.y + rs.y) / 2;
        const headUp = nose.y < avgShY;
        const vis = (ls.visibility ?? 1) > 0.5 && (rs.visibility ?? 1) > 0.5;
        const good = tilt < 0.07 && headUp && vis;
        if (good) goodPostureFramesRef.current++;
        const s2 = totalFramesRef.current > 0
          ? Math.round((goodPostureFramesRef.current / totalFramesRef.current) * 100)
          : 100;
        setPostureScore(s2);
        setPostureStatus(
          !vis ? 'Move closer to camera' :
          !headUp ? '⚠️ Sit up straight' :
          tilt >= 0.07 ? '⚠️ Level your shoulders' :
          '✅ Great posture'
        );
      });
      await pose.initialize();
      poseRef.current = pose;

      // 5. Speech Recognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        let sessionText = '';
        rec.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionText += t + ' ';
              wordCountRef.current = sessionText.trim().split(/\s+/).filter(Boolean).length;
              // Detect keywords
              const words = sessionText.toLowerCase().split(/\s+/);
              const found = TECH_KEYWORDS.filter(kw => words.some(w => w.includes(kw)));
              const unique = [...new Set(found)];
              detectedKwRef.current = unique;
              setDetectedKeywords(unique);
            } else {
              interim = t;
            }
          }
          setCaptions(interim || sessionText.slice(-150));
        };
        rec.onerror = (e) => { if (e.error !== 'no-speech') console.warn('SR:', e.error); };
        rec.onend = () => { try { rec.start(); } catch (_) {} };
        recognitionRef.current = rec;
        try { rec.start(); } catch (_) {}
      }

      // 6. Reset tracking
      eyeContactFramesRef.current  = 0;
      goodPostureFramesRef.current = 0;
      totalFramesRef.current       = 0;
      wordCountRef.current         = 0;
      frameCountRef.current        = 0;
      detectedKwRef.current        = [];
      startTimeRef.current         = Date.now();

      // 7. Start UI timers
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
        const mins = (Date.now() - startTimeRef.current) / 60000;
        if (mins > 0) setWpm(Math.round(wordCountRef.current / mins));
      }, 1000);

      qTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(t => {
          if (t <= 1) {
            setCurrentQIdx(i => {
              const next = Math.min(i + 1, questionsRef.current.length - 1);
              currentQIdxRef.current = next;
              return next;
            });
            return 120;
          }
          return t - 1;
        });
      }, 1000);

      // 8. Start frame loop
      animFrameRef.current = requestAnimationFrame(processFrameRef.current);

      setInitStatus('');
      setInterviewState('interviewing');

    } catch (err) {
      console.error('Interview start error:', err);
      alert('Could not access camera/microphone. Please allow permissions and try again.');
      setInterviewState('idle');
    }
  };

  // ── endInterview ─────────────────────────────────────────────────────────────
  const endInterview = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    // Build report
    const mins = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 1;
    const avgWpm  = mins > 0 ? Math.round(wordCountRef.current / mins) : 0;
    const paceScore = avgWpm === 0 ? 50 :
      (avgWpm >= 100 && avgWpm <= 155) ? 100 :
      avgWpm < 100 ? Math.round((avgWpm / 100) * 100) :
      Math.max(0, Math.round(100 - (avgWpm - 155)));

    const eye  = totalFramesRef.current > 10
      ? Math.round((eyeContactFramesRef.current  / totalFramesRef.current) * 100)
      : 72;
    const post = totalFramesRef.current > 10
      ? Math.round((goodPostureFramesRef.current / totalFramesRef.current) * 100)
      : 72;
    const kwScore = Math.min(100, detectedKwRef.current.length * 12);
    const overall = Math.round(eye * 0.30 + post * 0.25 + paceScore * 0.25 + kwScore * 0.20);

    setReport({
      eyeContact: eye, posture: post, avgWpm, paceScore,
      keywordsScore: kwScore, overallScore: overall,
      keywords: detectedKwRef.current,
      questionsAnswered: currentQIdxRef.current + 1,
      totalQuestions: questionsRef.current.length,
    });
    setInterviewState('completed');
  };

  // ── Controls ─────────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    if (!streamRef.current) return;
    const t = streamRef.current.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsAudioMuted(!t.enabled); }
  };
  const toggleVideo = () => {
    if (!streamRef.current) return;
    const t = streamRef.current.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoMuted(!t.enabled); }
  };
  const goNextQuestion = () => {
    if (currentQIdx < questions.length - 1) {
      const next = currentQIdx + 1;
      setCurrentQIdx(next);
      currentQIdxRef.current = next;
      setQuestionTimeLeft(120);
      setCaptions('');
    }
  };
  const resetAll = () => {
    setReport(null); setInterviewState('idle');
    setDetectedKeywords([]); setCaptions('');
    setElapsedSeconds(0); setCurrentQIdx(0); setWpm(0);
    setEyeContactScore(100); setPostureScore(100);
    setEyeStatus('Waiting...'); setPostureStatus('Waiting...');
  };

  if (loading || !user) return null;

  // ── Shared page shell ─────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{
        background:'linear-gradient(135deg,#eef2ff 0%,#f5f0ff 50%,#eff6ff 100%)',
        minHeight:'100vh',display:'flex',flexDirection:'column'
      }}>
        <DashboardHeader />

        {/* Setup Modal */}
        {interviewState === 'setup' && (
          <SetupModal onStart={startInterview} onClose={() => setInterviewState('idle')} />
        )}

        <div style={{padding:'0 20px 20px',flex:1,display:'flex',flexDirection:'column'}}>

          {/* ── Header Banner ── */}
          <div style={{
            background:'linear-gradient(135deg,#2b5876 0%,#4e4376 100%)',
            borderRadius:'20px',padding:'22px 28px',color:'#fff',marginBottom:'20px',
            display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px',flexWrap:'wrap'
          }}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:'bold',margin:'0 0 4px 0',display:'flex',alignItems:'center',gap:'10px'}}>
                <Video size={26}/> AI Mock Interview
              </h1>
              <p style={{margin:0,opacity:0.85,fontSize:'13px'}}>
                Real-time eye contact & posture analysis powered by Google MediaPipe AI
              </p>
            </div>
            {interviewState === 'interviewing' && (
              <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'11px',opacity:0.75,textTransform:'uppercase',letterSpacing:'0.4px'}}>Question</div>
                  <div style={{fontSize:'20px',fontWeight:'bold'}}>{currentQIdx+1}/{questions.length}</div>
                </div>
                <div style={{width:'1px',height:'36px',background:'rgba(255,255,255,0.25)'}}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'11px',opacity:0.75,textTransform:'uppercase',letterSpacing:'0.4px'}}>Duration</div>
                  <div style={{fontSize:'20px',fontWeight:'bold',fontVariantNumeric:'tabular-nums'}}>{fmtTime(elapsedSeconds)}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(239,68,68,0.25)',padding:'8px 14px',borderRadius:'30px',border:'1px solid rgba(239,68,68,0.5)'}}>
                  <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
                  <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#ff5555',animation:'blink 1.2s infinite'}}/>
                  <span style={{fontSize:'12px',fontWeight:'bold',letterSpacing:'0.5px'}}>LIVE</span>
                </div>
              </div>
            )}
          </div>

          {/* ───────────── IDLE ───────────── */}
          {interviewState === 'idle' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:'28px',padding:'60px 40px',textAlign:'center',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'560px',width:'100%'}}>
                <div style={{background:'linear-gradient(135deg,#dbeafe,#ede9fe)',padding:'28px',borderRadius:'50%',display:'inline-flex',marginBottom:'24px'}}>
                  <BrainCircuit size={52} color="#2b5876"/>
                </div>
                <h2 style={{color:'#1e293b',fontSize:'30px',marginBottom:'14px',fontWeight:'bold'}}>Ready for your interview?</h2>
                <p style={{color:'#64748b',fontSize:'15px',lineHeight:'1.65',marginBottom:'32px',maxWidth:'420px',margin:'0 auto 32px'}}>
                  Our on-device AI tracks your <strong>eye contact</strong> and <strong>body posture</strong> in real-time, transcribes your answers live, and generates a detailed performance report — all without sending any data to a server.
                </p>
                <div style={{display:'flex',gap:'12px',justifyContent:'center',marginBottom:'36px',flexWrap:'wrap'}}>
                  {[{Icon:Eye,label:'Eye Contact AI'},{Icon:User,label:'Posture Analysis'},{Icon:MessageSquare,label:'Live Captions'},{Icon:BarChart2,label:'Score Report'}].map(({Icon,label})=>(
                    <div key={label} style={{background:'#f8fafc',padding:'10px 14px',borderRadius:'12px',display:'flex',alignItems:'center',gap:'8px',color:'#2b5876',fontSize:'13px',fontWeight:'600'}}>
                      <Icon size={14}/>{label}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setInterviewState('setup')}
                  onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}
                  style={{background:'linear-gradient(135deg,#2b5876,#4e4376)',color:'#fff',border:'none',padding:'18px 44px',borderRadius:'30px',fontSize:'18px',fontWeight:'bold',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'12px',boxShadow:'0 6px 20px rgba(43,88,118,0.4)',transition:'transform 0.2s'}}
                >
                  <Play size={22}/> Start Interview
                </button>
              </div>
            </div>
          )}

          {/* ────────── INITIALIZING ────────── */}
          {interviewState === 'initializing' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:'24px',padding:'60px 40px',textAlign:'center',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'420px',width:'100%'}}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{width:'64px',height:'64px',borderRadius:'50%',border:'5px solid #e2e8f0',borderTopColor:'#2b5876',animation:'spin 1s linear infinite',margin:'0 auto 24px'}}/>
                <h3 style={{color:'#2b5876',fontSize:'22px',marginBottom:'12px'}}>Loading AI Models</h3>
                <p style={{color:'#64748b',fontSize:'14px',lineHeight:'1.6'}}>{initStatus||'Please wait...'}</p>
                <p style={{color:'#94a3b8',fontSize:'12px',marginTop:'16px'}}>⚡ Models run entirely in your browser — no data sent to any server.</p>
              </div>
            </div>
          )}

          {/* ────────── INTERVIEWING ────────── */}
          {interviewState === 'interviewing' && (
            <div style={{flex:1,display:'flex',gap:'18px',minHeight:0}}>

              {/* Left column: video + question + captions */}
              <div style={{flex:2,display:'flex',flexDirection:'column',gap:'14px'}}>

                {/* Question card */}
                <div style={{background:'#fff',borderRadius:'16px',padding:'16px 18px',boxShadow:'0 4px 15px rgba(79,70,229,0.10)',border:'1px solid rgba(99,102,241,0.12)',display:'flex',gap:'14px',alignItems:'flex-start'}}>
                  <div style={{background:'linear-gradient(135deg,#2b5876,#4e4376)',color:'#fff',padding:'8px 14px',borderRadius:'10px',fontSize:'13px',fontWeight:'bold',flexShrink:0,lineHeight:1.2}}>
                    Q{currentQIdx+1}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:'15px',fontWeight:'600',color:'#1e293b',lineHeight:'1.55'}}>{questions[currentQIdx]}</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexShrink:0,alignItems:'center'}}>
                    <div style={{fontSize:'13px',color:questionTimeLeft<30?'#ef4444':'#94a3b8',fontVariantNumeric:'tabular-nums',display:'flex',alignItems:'center',gap:'4px'}}>
                      <Timer size={13}/>{fmtTime(questionTimeLeft)}
                    </div>
                    {currentQIdx < questions.length - 1 && (
                      <button onClick={goNextQuestion} style={{background:'#f1f5f9',border:'none',padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',display:'flex',alignItems:'center',gap:'4px',color:'#475569',fontWeight:'600'}}>
                        Next <ChevronRight size={13}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div style={{background:'#0f172a',borderRadius:'20px',overflow:'hidden',position:'relative',flex:1,minHeight:'360px',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}}>
                  <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',display:'block'}}
                  />

                  {/* Live status badges */}
                  <div style={{position:'absolute',top:'14px',left:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                    {[
                      {text: eyeStatus, ok: eyeStatus.startsWith('✅')},
                      {text: postureStatus, ok: postureStatus.startsWith('✅')},
                    ].map(({text,ok},i) => (
                      <div key={i} style={{background:ok?'rgba(16,185,129,0.85)':'rgba(245,158,11,0.85)',color:'#fff',padding:'5px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'bold',backdropFilter:'blur(4px)'}}>
                        {text}
                      </div>
                    ))}
                  </div>

                  {/* Controls */}
                  <div style={{position:'absolute',bottom:'18px',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',padding:'10px 22px',borderRadius:'40px',display:'flex',gap:'14px',alignItems:'center'}}>
                    <button onClick={toggleAudio} title={isAudioMuted?'Unmute':'Mute'} style={{background:isAudioMuted?'#ef4444':'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:'42px',height:'42px',borderRadius:'50%',cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',transition:'background 0.2s'}}>
                      {isAudioMuted?<MicOff size={18}/>:<Mic size={18}/>}
                    </button>
                    <button onClick={toggleVideo} title={isVideoMuted?'Show video':'Hide video'} style={{background:isVideoMuted?'#ef4444':'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:'42px',height:'42px',borderRadius:'50%',cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',transition:'background 0.2s'}}>
                      {isVideoMuted?<VideoOff size={18}/>:<Video size={18}/>}
                    </button>
                    <button onClick={endInterview} style={{background:'#ef4444',border:'none',color:'#fff',padding:'0 22px',height:'42px',borderRadius:'30px',cursor:'pointer',fontWeight:'bold',display:'flex',alignItems:'center',gap:'8px',fontSize:'14px'}}>
                      <Square size={13} fill="#fff"/> End Interview
                    </button>
                  </div>
                </div>

                {/* Captions */}
                <div style={{background:'#1e293b',borderRadius:'16px',padding:'16px 18px',minHeight:'72px'}}>
                  <div style={{fontSize:'10px',fontWeight:'bold',color:'#94a3b8',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.6px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10b981'}}/>
                    Live Transcription
                  </div>
                  <p style={{margin:0,fontSize:'15px',lineHeight:'1.6',color:captions?'#f1f5f9':'#475569',fontStyle:captions?'normal':'italic'}}>
                    {captions || 'Listening for your response...'}
                  </p>
                </div>
              </div>

              {/* Right column: analytics */}
              <div style={{width:'270px',flexShrink:0,background:'#fff',borderRadius:'20px',padding:'20px',boxShadow:'0 10px 40px rgba(79,70,229,0.12)',display:'flex',flexDirection:'column',gap:'16px',overflow:'auto'}}>
                <h3 style={{fontSize:'15px',fontWeight:'bold',color:'#2b5876',margin:0,display:'flex',alignItems:'center',gap:'8px'}}>
                  <Activity size={17}/> Live Analytics
                </h3>

                {/* Eye ring */}
                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><Eye size={13}/>Eye Contact</div>
                  <div style={{position:'relative',display:'inline-block'}}>
                    <ScoreRing value={eyeContactScore} color={eyeContactScore>65?'#10b981':'#ef4444'}/>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                      <span style={{fontSize:'18px',fontWeight:'bold',color:eyeContactScore>65?'#10b981':'#ef4444'}}>{eyeContactScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Posture ring */}
                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><User size={13}/>Posture</div>
                  <div style={{position:'relative',display:'inline-block'}}>
                    <ScoreRing value={postureScore} color={postureScore>65?'#10b981':'#f59e0b'}/>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'18px',fontWeight:'bold',color:postureScore>65?'#10b981':'#f59e0b'}}>{postureScore}%</span>
                    </div>
                  </div>
                </div>

                {/* WPM */}
                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'14px'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'6px'}}>Speaking Pace</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
                    <span style={{fontSize:'26px',fontWeight:'bold',color:'#3b82f6'}}>{wpm}</span>
                    <span style={{fontSize:'12px',color:'#94a3b8'}}>wpm</span>
                  </div>
                  <div style={{fontSize:'11px',marginTop:'4px',fontWeight:'700',color:(wpm>=100&&wpm<=155)?'#10b981':wpm===0?'#94a3b8':'#f59e0b'}}>
                    {wpm===0?'Start speaking…':wpm<100?'↑ Speak a little faster':wpm>155?'↓ Slow down slightly':'✓ Great pace!'}
                  </div>
                </div>

                {/* Keywords */}
                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'14px',flex:1}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'10px'}}>
                    Keywords Detected <span style={{color:'#2b5876'}}>({detectedKeywords.length})</span>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',minHeight:'28px'}}>
                    {detectedKeywords.length===0
                      ? <span style={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>Listening…</span>
                      : detectedKeywords.map((kw,i)=>(
                        <span key={i} style={{padding:'3px 10px',background:'#e0e7ff',color:'#3730a3',borderRadius:'12px',fontSize:'12px',fontWeight:'bold'}}>{kw}</span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────── COMPLETED ────────── */}
          {interviewState === 'completed' && report && (
            <div style={{flex:1,overflow:'auto'}}>
              <div style={{background:'#fff',borderRadius:'24px',padding:'40px',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'800px',margin:'0 auto'}}>

                {/* Report header */}
                <div style={{textAlign:'center',marginBottom:'32px'}}>
                  <div style={{background:'#dcfce7',padding:'20px',borderRadius:'50%',display:'inline-flex',marginBottom:'16px'}}>
                    <Award size={40} color="#16a34a"/>
                  </div>
                  <h2 style={{color:'#1e293b',fontSize:'28px',marginBottom:'8px',fontWeight:'bold'}}>Interview Complete!</h2>
                  <p style={{color:'#64748b',fontSize:'15px'}}>You answered <strong>{report.questionsAnswered}</strong> of <strong>{report.totalQuestions}</strong> questions.</p>
                </div>

                {/* Overall score */}
                <div style={{background:'linear-gradient(135deg,#2b5876,#4e4376)',borderRadius:'20px',padding:'32px',color:'#fff',textAlign:'center',marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'center',gap:'32px'}}>
                  <div style={{position:'relative'}}>
                    <ScoreRing value={report.overallScore} size={120} strokeWidth={10} color="#fbbf24"/>
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'28px',fontWeight:'bold',color:'#fff'}}>{report.overallScore}</span>
                      <span style={{fontSize:'11px',opacity:0.8}}>/ 100</span>
                    </div>
                  </div>
                  <div style={{textAlign:'left'}}>
                    <div style={{fontSize:'14px',opacity:0.8,marginBottom:'4px'}}>Overall Performance</div>
                    <div style={{fontSize:'32px',fontWeight:'bold'}}>{getGrade(report.overallScore).label}</div>
                    <div style={{fontSize:'13px',opacity:0.75,marginTop:'4px'}}>
                      {report.overallScore>=85?'Outstanding interview! You are well-prepared.':report.overallScore>=70?'Solid performance with room to grow.':report.overallScore>=55?'Keep practicing — you\'re getting there!':'More practice will help you shine.'}
                    </div>
                  </div>
                </div>

                {/* Score grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'14px',marginBottom:'24px'}}>
                  {[
                    {label:'Eye Contact',value:report.eyeContact,Icon:Eye,sub:'% of time looking at camera'},
                    {label:'Posture',value:report.posture,Icon:User,sub:'% time in correct posture'},
                    {label:'Speaking Pace',value:report.paceScore,Icon:MessageSquare,sub:`Avg: ${report.avgWpm} words/min`},
                    {label:'Vocabulary',value:report.keywordsScore,Icon:BarChart2,sub:`${report.keywords.length} keywords detected`},
                  ].map(({label,value,Icon,sub})=>{
                    const {color}=getGrade(value);
                    return (
                      <div key={label} style={{background:'#f8fafc',borderRadius:'16px',padding:'18px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                          <span style={{fontSize:'13px',fontWeight:'700',color:'#64748b',display:'flex',alignItems:'center',gap:'6px'}}>
                            <Icon size={14} color="#2b5876"/>{label}
                          </span>
                          <span style={{fontSize:'22px',fontWeight:'bold',color}}>{value}%</span>
                        </div>
                        <div style={{height:'6px',background:'#e2e8f0',borderRadius:'3px',overflow:'hidden',marginBottom:'6px'}}>
                          <div style={{width:`${value}%`,height:'100%',background:color,borderRadius:'3px',transition:'width 1s ease'}}/>
                        </div>
                        <div style={{fontSize:'11px',color:'#94a3b8'}}>{sub}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Keywords */}
                {report.keywords.length>0 && (
                  <div style={{background:'#f0f7ff',borderRadius:'14px',padding:'18px',marginBottom:'20px'}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#2b5876',marginBottom:'10px'}}>✅ Technical Keywords Used</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                      {report.keywords.map((kw,i)=>(
                        <span key={i} style={{padding:'4px 14px',background:'#e0e7ff',color:'#3730a3',borderRadius:'16px',fontSize:'13px',fontWeight:'bold'}}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalized tips */}
                <div style={{background:'#fffbeb',borderRadius:'14px',padding:'18px',marginBottom:'28px',border:'1px solid #fde68a'}}>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#92400e',marginBottom:'12px'}}>💡 Personalized Feedback</div>
                  {report.eyeContact < 65 && (
                    <div style={{fontSize:'14px',color:'#78350f',marginBottom:'8px'}}>• <strong>Eye Contact:</strong> Look directly at your webcam lens (not at the screen) to simulate real eye contact in interviews.</div>
                  )}
                  {report.posture < 65 && (
                    <div style={{fontSize:'14px',color:'#78350f',marginBottom:'8px'}}>• <strong>Posture:</strong> Keep your back straight and both shoulders level. Good posture projects confidence.</div>
                  )}
                  {report.avgWpm < 100 && report.avgWpm > 0 && (
                    <div style={{fontSize:'14px',color:'#78350f',marginBottom:'8px'}}>• <strong>Pace:</strong> You spoke a bit slowly ({report.avgWpm} wpm). Aim for 110–150 wpm to keep interviewers engaged.</div>
                  )}
                  {report.avgWpm > 155 && (
                    <div style={{fontSize:'14px',color:'#78350f',marginBottom:'8px'}}>• <strong>Pace:</strong> You spoke too fast ({report.avgWpm} wpm). Slow down and pause between key points for clarity.</div>
                  )}
                  {report.keywords.length < 3 && (
                    <div style={{fontSize:'14px',color:'#78350f',marginBottom:'8px'}}>• <strong>Vocabulary:</strong> Try to use more domain-specific keywords in your answers — they show technical fluency.</div>
                  )}
                  {report.eyeContact>=65 && report.posture>=65 && report.paceScore>=65 && report.keywords.length>=3 && (
                    <div style={{fontSize:'14px',color:'#78350f'}}>✅ Excellent across all areas! Keep refining your answers with more practice interviews.</div>
                  )}
                </div>

                {/* Actions */}
                <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
                  <button onClick={resetAll} style={{padding:'14px 28px',borderRadius:'30px',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#475569',cursor:'pointer',fontWeight:'600',fontSize:'15px'}}>
                    Back to Start
                  </button>
                  <button onClick={() => { resetAll(); setTimeout(() => setInterviewState('setup'), 50); }} style={{background:'linear-gradient(135deg,#2b5876,#4e4376)',color:'#fff',border:'none',padding:'14px 28px',borderRadius:'30px',fontSize:'15px',fontWeight:'bold',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 15px rgba(43,88,118,0.4)'}}>
                    New Interview <ChevronRight size={17}/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
