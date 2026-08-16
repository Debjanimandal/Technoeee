'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Video, Mic, MicOff, VideoOff, Square, Play,
  CheckCircle2, ChevronRight, Activity, BrainCircuit,
  Eye, User, Timer, Award, MessageSquare, BarChart2,
  Loader2, SendHorizonal, Volume2, VolumeX, Sparkles
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────
const INTERVIEW_TYPES = {
  Technical: {
    description: 'Data structures, algorithms, databases, OS, networking',
    color: '#3b82f6',
  },
  Behavioral: {
    description: 'Teamwork, leadership, conflict, project experience',
    color: '#10b981',
  },
  HR: {
    description: 'Career goals, strengths, motivations, culture fit',
    color: '#8b5cf6',
  },
};

const TOPICS = [
  'General (AI decides)',
  'Data Structures & Algorithms',
  'Database Management System',
  'Computer Networks',
  'Operating Systems',
  'Machine Learning',
  'Computer Architecture',
  'Artificial Intelligence',
  'Design and Analysis of Algorithms',
];

const TECH_KEYWORDS = [
  'react','javascript','python','java','css','html','api','database','algorithm',
  'function','array','object','class','async','promise','state','component',
  'variable','loop','recursion','git','agile','scrum','testing','debugging',
  'performance','sql','rest','graphql','node','server','framework','library',
  'typescript','docker','cloud','microservice','design','pattern','structure',
  'normalization','cache','memory','thread','process','queue','stack','tree',
  'graph','sort','search','complexity','architecture','network','protocol',
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
  const [type, setType] = useState('Technical');
  const [topic, setTopic] = useState('General (AI decides)');
  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(5px)'
    }}>
      <style>{`@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background:'#fff',borderRadius:'24px',padding:'40px',width:'520px',maxWidth:'95vw',
        boxShadow:'0 25px 60px rgba(0,0,0,0.3)',animation:'su 0.3s ease',
        maxHeight:'90vh',overflow:'auto'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
          <Sparkles size={20} color="#4e4376"/>
          <h2 style={{color:'#2b5876',fontSize:'22px',margin:0,fontWeight:'bold'}}>Configure Your Interview</h2>
        </div>
        <p style={{color:'#64748b',marginBottom:'24px',fontSize:'14px'}}>
          The AI interviewer will dynamically adapt questions to your responses.
        </p>

        {/* Interview Type */}
        <div style={{marginBottom:'20px'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.4px'}}>
            Interview Type
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            {Object.entries(INTERVIEW_TYPES).map(([t, meta]) => (
              <button key={t} onClick={() => setType(t)} style={{
                flex:1,padding:'12px 8px',borderRadius:'12px',
                border:`2px solid ${type===t ? meta.color : '#e2e8f0'}`,
                background:type===t ? `${meta.color}15` : '#fff',
                color:type===t ? meta.color : '#64748b',fontWeight:type===t?'bold':'normal',
                cursor:'pointer',transition:'all 0.2s',fontSize:'13px',
              }}>
                {t}
              </button>
            ))}
          </div>
          <p style={{fontSize:'12px',color:'#94a3b8',marginTop:'8px'}}>
            {INTERVIEW_TYPES[type].description}
          </p>
        </div>

        {/* Topic */}
        <div style={{marginBottom:'20px'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.4px'}}>
            Topic Focus (for RAG)
          </div>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{
              width:'100%',padding:'11px 14px',borderRadius:'12px',border:'2px solid #e2e8f0',
              background:'#f8fafc',color:'#374151',fontSize:'14px',cursor:'pointer',
              outline:'none',fontFamily:'inherit',
            }}
          >
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Tips */}
        <div style={{background:'#f0fdf4',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1px solid #bbf7d0'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#166534',marginBottom:'10px'}}>How this works</div>
          {[
            'AI asks questions vocally — listen, then speak your answer',
            'Click "Done Answering" when you finish speaking',
            'AI analyzes your answer and adapts the next question dynamically',
            'Sit upright and look at your webcam for best analytics',
          ].map((tip,i) => (
            <div key={i} style={{fontSize:'12px',color:'#166534',display:'flex',gap:'8px',marginBottom:i<3?'5px':0}}>
              <span>•</span>{tip}
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:'12px'}}>
          <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:'12px',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>
            Cancel
          </button>
          <button onClick={() => onStart(type, topic)} style={{
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

  // ── Core interview state ─────────────────────────────────────────────────────
  const [interviewState, setInterviewState] = useState('idle'); // idle|setup|initializing|interviewing|completed
  const [interviewType, setInterviewType] = useState('Technical');
  const [interviewTopic, setInterviewTopic] = useState('General (AI decides)');
  const [report, setReport] = useState(null);
  const [initStatus, setInitStatus] = useState('');

  // ── AI conversation state ────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [interviewPhase, setInterviewPhase] = useState('opening');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const [silencePrompt, setSilencePrompt] = useState('');
  const [aiAssessment, setAiAssessment] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // ── Media ────────────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // ── MediaPipe refs ───────────────────────────────────────────────────────────
  const faceMeshRef = useRef(null);
  const poseRef = useRef(null);
  const animFrameRef = useRef(null);
  const frameCountRef = useRef(0);

  // ── Tracking refs ────────────────────────────────────────────────────────────
  const eyeContactFramesRef = useRef(0);
  const goodPostureFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const startTimeRef = useRef(null);
  const wordCountRef = useRef(0);
  const detectedKwRef = useRef([]);
  const questionNumberRef = useRef(0);
  const interviewPhaseRef = useRef('opening');
  const conversationHistoryRef = useRef([]);
  const currentTranscriptRef = useRef(''); // current answer being spoken

  // ── Silence detection refs ───────────────────────────────────────────────────
  const lastWordCountRef = useRef(0);
  const silenceSecondsRef = useRef(0);
  // Readable refs for interval callbacks (React state can't be read in setInterval)
  const isAISpeakingRef = useRef(false);
  const isAIThinkingRef = useRef(false);

  // ── Analytics state ──────────────────────────────────────────────────────────
  const [eyeContactScore, setEyeContactScore] = useState(100);
  const [postureScore, setPostureScore]       = useState(100);
  const [eyeStatus, setEyeStatus]             = useState('Waiting...');
  const [postureStatus, setPostureStatus]     = useState('Waiting...');
  const [captions, setCaptions]               = useState('');
  const [wpm, setWpm]                         = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);

  // ── Timers ───────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // ── Attach stream to video ───────────────────────────────────────────────────
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
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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
    if (frameCountRef.current % 4 === 0 && faceMeshRef.current) {
      try { await faceMeshRef.current.send({ image: video }); } catch (_) {}
    } else if (frameCountRef.current % 4 === 2 && poseRef.current) {
      try { await poseRef.current.send({ image: video }); } catch (_) {}
    }
    animFrameRef.current = requestAnimationFrame(processFrameRef.current);
  };

  // ── TTS: speak a question aloud ──────────────────────────────────────────────
  const speakQuestion = useCallback((text) => {
    if (!window.speechSynthesis || isTTSMuted) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;
    // Prefer a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => { setIsAISpeaking(true); isAISpeakingRef.current = true; };
    utter.onend   = () => {
      setIsAISpeaking(false);
      isAISpeakingRef.current = false;
      // Give the student a FRESH silence window the moment AI stops speaking
      silenceSecondsRef.current = 0;
      lastWordCountRef.current = wordCountRef.current;
      setSilencePrompt('');
    };
    utter.onerror = () => { setIsAISpeaking(false); isAISpeakingRef.current = false; };
    ttsRef.current = utter;
    setIsAISpeaking(true);
    isAISpeakingRef.current = true;
    window.speechSynthesis.speak(utter);
  }, [isTTSMuted]);

  // ── Get next AI question ─────────────────────────────────────────────────────
  const fetchNextQuestion = useCallback(async (answer = '', forcePhase = null) => {
    setIsAIThinking(true);
    isAIThinkingRef.current = true;
    setSilencePrompt('');
    silenceSecondsRef.current = 0;

    const phase = forcePhase || interviewPhaseRef.current;
    const qNum  = questionNumberRef.current;

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          topic: interviewTopic === 'General (AI decides)' ? null : interviewTopic,
          conversationHistory: conversationHistoryRef.current,
          currentAnswer: answer,
          questionNumber: qNum,
          interviewPhase: phase,
        }),
      });

      const data = await res.json();
      const { nextQuestion, nextPhase, isEnding } = data;

      if (isEnding) {
        // Close the interview naturally
        setCurrentQuestion(nextQuestion);
        speakQuestion(nextQuestion);
        setTimeout(() => endInterview(), 8000);
        return;
      }

      // Update conversation history
      if (answer.trim()) {
        const newHistory = [
          ...conversationHistoryRef.current,
          { role: 'student', content: answer.trim() },
          { role: 'interviewer', content: nextQuestion },
        ];
        conversationHistoryRef.current = newHistory;
        setConversationHistory(newHistory);
      } else if (qNum === 0) {
        const newHistory = [{ role: 'interviewer', content: nextQuestion }];
        conversationHistoryRef.current = newHistory;
        setConversationHistory(newHistory);
      }

      // Update phase
      interviewPhaseRef.current = nextPhase;
      setInterviewPhase(nextPhase);

      // Increment question counter
      questionNumberRef.current = qNum + 1;
      setQuestionNumber(qNum + 1);

      // Display and speak
      setCurrentQuestion(nextQuestion);
      currentTranscriptRef.current = '';
      setCaptions('');
      speakQuestion(nextQuestion);

    } catch (err) {
      console.error('[fetchNextQuestion]', err);
      const fallback = 'Could you elaborate on your previous answer?';
      setCurrentQuestion(fallback);
      speakQuestion(fallback);
    } finally {
      setIsAIThinking(false);
      isAIThinkingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewType, interviewTopic, speakQuestion]);

  // ── Student submits answer ───────────────────────────────────────────────────
  const submitAnswer = useCallback(() => {
    const answer = currentTranscriptRef.current.trim();
    currentTranscriptRef.current = '';
    lastWordCountRef.current = wordCountRef.current;
    silenceSecondsRef.current = 0;
    setSilencePrompt('');
    fetchNextQuestion(answer);
  }, [fetchNextQuestion]);

  // ── Start interview ──────────────────────────────────────────────────────────
  const startInterview = async (type, topic) => {
    setInterviewType(type);
    setInterviewTopic(topic);
    setInterviewState('initializing');
    conversationHistoryRef.current = [];
    setConversationHistory([]);
    questionNumberRef.current = 0;
    interviewPhaseRef.current = 'opening';
    setQuestionNumber(0);
    setInterviewPhase('opening');

    try {
      // 1. Camera + mic (hard requirement — fail here is a real error)
      setInitStatus('Requesting camera and microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      // 2. MediaPipe (optional — if WebGL fails we skip it gracefully)
      let mediapipeEnabled = false;
      const _origAlert = window.alert;
      window.alert = (msg) => { throw new Error(String(msg)); }; // intercept MediaPipe internal alerts
      try {
        // Check WebGL availability first
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) throw new Error('WebGL not available');

        setInitStatus('Loading vision models...');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js');

        setInitStatus('Initializing AI models (this takes ~10s on first run)...');

        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });
        faceMesh.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
        faceMesh.onResults((results) => {
          totalFramesRef.current++;
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setEyeStatus('No face detected');
            const s = totalFramesRef.current > 0 ? Math.round((eyeContactFramesRef.current / totalFramesRef.current) * 100) : 100;
            setEyeContactScore(s);
            return;
          }
          const lm = results.multiFaceLandmarks[0];
          if (lm.length < 478) { eyeContactFramesRef.current++; return; }
          const li = lm[468]; const ri = lm[473];
          const lc = { x: (lm[33].x + lm[133].x) / 2 };
          const rc = { x: (lm[263].x + lm[362].x) / 2 };
          const lw = Math.abs(lm[33].x - lm[133].x);
          const rw = Math.abs(lm[263].x - lm[362].x);
          const devL = lw > 0 ? Math.abs(li.x - lc.x) / lw : 0;
          const devR = rw > 0 ? Math.abs(ri.x - rc.x) / rw : 0;
          const isLooking = (devL + devR) / 2 < 0.22;
          if (isLooking) eyeContactFramesRef.current++;
          const s = Math.round((eyeContactFramesRef.current / totalFramesRef.current) * 100);
          setEyeContactScore(s);
          setEyeStatus(isLooking ? 'Looking at camera' : 'Look at the camera');
        });
        await faceMesh.initialize();
        faceMeshRef.current = faceMesh;

        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
        });
        pose.setOptions({ modelComplexity:1, smoothLandmarks:true, enableSegmentation:false, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
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
          const s2 = totalFramesRef.current > 0 ? Math.round((goodPostureFramesRef.current / totalFramesRef.current) * 100) : 100;
          setPostureScore(s2);
          setPostureStatus(!vis ? 'Move closer to camera' : !headUp ? 'Sit up straight' : tilt >= 0.07 ? 'Level your shoulders' : 'Great posture');
        });
        await pose.initialize();
        poseRef.current = pose;
        mediapipeEnabled = true;
      } catch (mpErr) {
        // MediaPipe / WebGL failed — log it and continue without analytics
        console.warn('[MediaPipe unavailable]', mpErr.message);
        setEyeStatus('Analytics unavailable');
        setPostureStatus('Analytics unavailable');
        faceMeshRef.current = null;
        poseRef.current = null;
      } finally {
        window.alert = _origAlert; // always restore
      }

      // 3. Speech Recognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
        let sessionText = '';
        rec.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionText += t + ' ';
              currentTranscriptRef.current = sessionText.trim();
              wordCountRef.current = sessionText.trim().split(/\s+/).filter(Boolean).length;
              const words = sessionText.toLowerCase().split(/\s+/);
              const found = TECH_KEYWORDS.filter(kw => words.some(w => w.includes(kw)));
              detectedKwRef.current = [...new Set(found)];
              setDetectedKeywords([...new Set(found)]);
            } else { interim = t; }
          }
          setCaptions(interim || sessionText.slice(-200));
        };
        rec.onerror = (e) => { if (e.error !== 'no-speech') console.warn('SR:', e.error); };
        rec.onend = () => { try { rec.start(); } catch (_) {} };
        recognitionRef.current = rec;
        try { rec.start(); } catch (_) {}
      }

      // 4. Reset tracking
      eyeContactFramesRef.current = 0;
      goodPostureFramesRef.current = 0;
      totalFramesRef.current = 0;
      wordCountRef.current = 0;
      frameCountRef.current = 0;
      detectedKwRef.current = [];
      currentTranscriptRef.current = '';
      lastWordCountRef.current = 0;
      silenceSecondsRef.current = 0;
      startTimeRef.current = Date.now();

      // 5. Start main timer + silence detector
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
        const mins = (Date.now() - startTimeRef.current) / 60000;
        if (mins > 0) setWpm(Math.round(wordCountRef.current / mins));

        // Silence detection — only runs when AI is NOT speaking or thinking
        if (isAISpeakingRef.current || isAIThinkingRef.current) {
          lastWordCountRef.current = wordCountRef.current;
          silenceSecondsRef.current = 0;
        } else if (wordCountRef.current === lastWordCountRef.current) {
          silenceSecondsRef.current++;
          if (silenceSecondsRef.current === 12) setSilencePrompt('Take your time...');
          if (silenceSecondsRef.current === 20) setSilencePrompt('Are you unsure about this one?');
          if (silenceSecondsRef.current === 30) {
            lastWordCountRef.current = wordCountRef.current;
            silenceSecondsRef.current = 0;
            setSilencePrompt('');
            fetchNextQuestion('', null);
          }
        } else {
          lastWordCountRef.current = wordCountRef.current;
          silenceSecondsRef.current = 0;
          setSilencePrompt('');
        }
      }, 1000);

      // 6. Start frame loop (only if MediaPipe loaded)
      if (mediapipeEnabled) {
        animFrameRef.current = requestAnimationFrame(processFrameRef.current);
      }

      setInitStatus('');
      setInterviewState('interviewing');

      // 7. Get first AI question
      setTimeout(() => fetchNextQuestion('', 'opening'), 600);

    } catch (err) {
      // Only camera/mic failures reach here now
      console.error('Interview start error:', err);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      let msg = 'Could not access camera or microphone. Please allow permissions and try again.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Camera or microphone access was denied. Please click the camera icon in the address bar and allow access.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera or microphone found. Please connect a device and try again.';
      }
      alert(msg);
      setInterviewState('idle');
    }
  };

  // ── End interview ────────────────────────────────────────────────────────────
  const endInterview = useCallback(async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const mins = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 1;
    const avgWpm  = mins > 0 ? Math.round(wordCountRef.current / mins) : 0;
    const paceScore = avgWpm === 0 ? 50 :
      (avgWpm >= 100 && avgWpm <= 155) ? 100 :
      avgWpm < 100 ? Math.round((avgWpm / 100) * 100) :
      Math.max(0, Math.round(100 - (avgWpm - 155)));

    const eye  = totalFramesRef.current > 10 ? Math.round((eyeContactFramesRef.current  / totalFramesRef.current) * 100) : 72;
    const post = totalFramesRef.current > 10 ? Math.round((goodPostureFramesRef.current / totalFramesRef.current) * 100) : 72;
    const kwScore = Math.min(100, detectedKwRef.current.length * 12);
    const overall = Math.round(eye * 0.30 + post * 0.25 + paceScore * 0.25 + kwScore * 0.20);

    const behavioralScores = { eyeContact: eye, posture: post, avgWpm, paceScore, keywordsScore: kwScore, overallScore: overall, keywords: detectedKwRef.current, questionsAnswered: questionNumberRef.current };
    setReport(behavioralScores);
    setInterviewState('completed');

    // Get AI narrative assessment
    if (conversationHistoryRef.current.length >= 2) {
      setIsGeneratingReport(true);
      try {
        const res = await fetch('/api/interview/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory: conversationHistoryRef.current,
            interviewType,
            behavioralScores,
          }),
        });
        const data = await res.json();
        if (data.assessment) setAiAssessment(data.assessment);
      } catch (err) {
        console.error('[Report]', err);
      } finally {
        setIsGeneratingReport(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewType]);

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
  const toggleTTS = () => {
    if (!isTTSMuted) window.speechSynthesis?.cancel();
    setIsTTSMuted(m => !m);
  };
  const resetAll = () => {
    setReport(null); setAiAssessment(null); setInterviewState('idle');
    setDetectedKeywords([]); setCaptions(''); setElapsedSeconds(0);
    setWpm(0); setEyeContactScore(100); setPostureScore(100);
    setEyeStatus('Waiting...'); setPostureStatus('Waiting...');
    setCurrentQuestion(''); setConversationHistory([]);
    setQuestionNumber(0); setInterviewPhase('opening');
    setIsAIThinking(false); setIsAISpeaking(false);
    setSilencePrompt(''); setIsGeneratingReport(false);
    conversationHistoryRef.current = [];
    questionNumberRef.current = 0;
    interviewPhaseRef.current = 'opening';
    currentTranscriptRef.current = '';
  };

  if (loading || !user) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{
        background:'linear-gradient(135deg,#eef2ff 0%,#f5f0ff 50%,#eff6ff 100%)',
        minHeight:'100vh',display:'flex',flexDirection:'column'
      }}>
        <DashboardHeader />

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
                {interviewState === 'interviewing'
                  ? `${interviewType} Interview${interviewTopic !== 'General (AI decides)' ? ' • ' + interviewTopic : ''} • AI-driven adaptive questions`
                  : 'Dynamic AI interviewer powered by NVIDIA NIM + RAG'}
              </p>
            </div>
            {interviewState === 'interviewing' && (
              <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'11px',opacity:0.75,textTransform:'uppercase',letterSpacing:'0.4px'}}>Question</div>
                  <div style={{fontSize:'20px',fontWeight:'bold'}}>{questionNumber}</div>
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

          {/* ── IDLE ── */}
          {interviewState === 'idle' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:'28px',padding:'60px 40px',textAlign:'center',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'580px',width:'100%'}}>
                <div style={{background:'linear-gradient(135deg,#dbeafe,#ede9fe)',padding:'28px',borderRadius:'50%',display:'inline-flex',marginBottom:'24px'}}>
                  <BrainCircuit size={52} color="#2b5876"/>
                </div>
                <h2 style={{color:'#1e293b',fontSize:'30px',marginBottom:'14px',fontWeight:'bold'}}>AI-Powered Mock Interview</h2>
                <p style={{color:'#64748b',fontSize:'15px',lineHeight:'1.65',marginBottom:'32px',maxWidth:'440px',margin:'0 auto 32px'}}>
                  Experience a <strong>real interview simulation</strong>. The AI interviewer adapts every question based on your answer — no fixed scripts.
                </p>
                <div style={{display:'flex',gap:'12px',justifyContent:'center',marginBottom:'36px',flexWrap:'wrap'}}>
                  {[{Icon:Eye,label:'Eye Contact AI'},{Icon:User,label:'Posture Analysis'},{Icon:Sparkles,label:'Adaptive AI Questions'},{Icon:BarChart2,label:'AI Report'}].map(({Icon,label}) => (
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

          {/* ── INITIALIZING ── */}
          {interviewState === 'initializing' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:'24px',padding:'60px 40px',textAlign:'center',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'420px',width:'100%'}}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{width:'64px',height:'64px',borderRadius:'50%',border:'5px solid #e2e8f0',borderTopColor:'#2b5876',animation:'spin 1s linear infinite',margin:'0 auto 24px'}}/>
                <h3 style={{color:'#2b5876',fontSize:'22px',marginBottom:'12px'}}>Preparing Interview</h3>
                <p style={{color:'#64748b',fontSize:'14px',lineHeight:'1.6'}}>{initStatus||'Please wait...'}</p>
              </div>
            </div>
          )}

          {/* ── INTERVIEWING ── */}
          {interviewState === 'interviewing' && (
            <div style={{flex:1,display:'flex',gap:'18px',minHeight:0}}>

              {/* Left: video + question + captions */}
              <div style={{flex:2,display:'flex',flexDirection:'column',gap:'14px'}}>

                {/* AI Question Card */}
                <div style={{
                  background:'#fff',borderRadius:'16px',padding:'16px 18px',
                  boxShadow:'0 4px 15px rgba(79,70,229,0.10)',
                  border:`1px solid ${isAIThinking ? 'rgba(139,92,246,0.4)' : 'rgba(99,102,241,0.12)'}`,
                  transition:'border-color 0.3s',
                }}>
                  <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                    <div style={{
                      background: isAIThinking ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'linear-gradient(135deg,#2b5876,#4e4376)',
                      color:'#fff',padding:'8px 14px',borderRadius:'10px',fontSize:'13px',
                      fontWeight:'bold',flexShrink:0,lineHeight:1.2,display:'flex',alignItems:'center',gap:'6px',
                    }}>
                      {isAIThinking ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> AI</> : `Q${questionNumber}`}
                    </div>
                    <div style={{flex:1}}>
                      {isAIThinking ? (
                        <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#8b5cf6',fontSize:'14px'}}>
                          <span>Analyzing your answer and generating next question...</span>
                        </div>
                      ) : (
                        <p style={{margin:0,fontSize:'15px',fontWeight:'600',color:'#1e293b',lineHeight:'1.55'}}>
                          {currentQuestion || 'Preparing your first question...'}
                        </p>
                      )}
                    </div>
                    <div style={{display:'flex',gap:'6px',flexShrink:0,alignItems:'center'}}>
                      {/* TTS toggle */}
                      <button onClick={toggleTTS} title={isTTSMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                        style={{background:isTTSMuted?'#fee2e2':'#f1f5f9',border:'none',padding:'6px 8px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',color:isTTSMuted?'#ef4444':'#475569'}}>
                        {isTTSMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                      </button>
                      {/* Speaking indicator */}
                      {isAISpeaking && (
                        <div style={{display:'flex',gap:'2px',alignItems:'center',padding:'5px 8px',background:'rgba(16,185,129,0.1)',borderRadius:'8px',border:'1px solid rgba(16,185,129,0.3)'}}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{width:'3px',height:`${8+i*3}px`,background:'#10b981',borderRadius:'2px',animation:`bounce 0.8s ${i*0.15}s ease-in-out infinite`}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Silence prompt */}
                  {silencePrompt && !isAIThinking && (
                    <div style={{marginTop:'10px',padding:'8px 12px',background:'rgba(245,158,11,0.08)',borderRadius:'8px',border:'1px solid rgba(245,158,11,0.25)',fontSize:'13px',color:'#92400e',fontStyle:'italic'}}>
                      {silencePrompt}
                    </div>
                  )}
                </div>

                {/* Video */}
                <div style={{background:'#0f172a',borderRadius:'20px',overflow:'hidden',position:'relative',flex:1,minHeight:'320px',boxShadow:'0 12px 32px rgba(0,0,0,0.25)'}}>
                  <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',display:'block'}}
                  />
                  {/* Status badges */}
                  <div style={{position:'absolute',top:'14px',left:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                    {[
                      {text: eyeStatus,    ok: eyeStatus.includes('Looking')},
                      {text: postureStatus, ok: postureStatus.includes('Great')},
                    ].map(({text,ok},i) => (
                      <div key={i} style={{background:ok?'rgba(16,185,129,0.85)':'rgba(245,158,11,0.85)',color:'#fff',padding:'5px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'bold',backdropFilter:'blur(4px)'}}>
                        {ok ? '✓' : '!'} {text}
                      </div>
                    ))}
                  </div>
                  {/* Controls */}
                  <div style={{position:'absolute',bottom:'18px',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',padding:'10px 22px',borderRadius:'40px',display:'flex',gap:'14px',alignItems:'center'}}>
                    <button onClick={toggleAudio} title={isAudioMuted?'Unmute':'Mute'} style={{background:isAudioMuted?'#ef4444':'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:'42px',height:'42px',borderRadius:'50%',cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',transition:'background 0.2s'}}>
                      {isAudioMuted?<MicOff size={18}/>:<Mic size={18}/>}
                    </button>
                    <button onClick={toggleVideo} title={isVideoMuted?'Show':'Hide'} style={{background:isVideoMuted?'#ef4444':'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:'42px',height:'42px',borderRadius:'50%',cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',transition:'background 0.2s'}}>
                      {isVideoMuted?<VideoOff size={18}/>:<Video size={18}/>}
                    </button>
                    <button onClick={() => endInterview()} style={{background:'#ef4444',border:'none',color:'#fff',padding:'0 22px',height:'42px',borderRadius:'30px',cursor:'pointer',fontWeight:'bold',display:'flex',alignItems:'center',gap:'8px',fontSize:'14px'}}>
                      <Square size={13} fill="#fff"/> End Interview
                    </button>
                  </div>
                </div>

                {/* Captions + Done Answering */}
                <div style={{background:'#1e293b',borderRadius:'16px',padding:'16px 18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <div style={{fontSize:'10px',fontWeight:'bold',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.6px',display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10b981'}}/>
                      Live Transcription
                    </div>
                    {/* Done Answering Button */}
                    <button
                      onClick={submitAnswer}
                      disabled={isAIThinking || isAISpeaking}
                      style={{
                        background: (isAIThinking || isAISpeaking)
                          ? 'rgba(99,102,241,0.3)'
                          : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        border:'none',color:'#fff',
                        padding:'8px 18px',borderRadius:'20px',
                        cursor:(isAIThinking || isAISpeaking)?'not-allowed':'pointer',
                        fontWeight:'700',fontSize:'13px',
                        display:'flex',alignItems:'center',gap:'7px',
                        transition:'all 0.2s',
                        opacity:(isAIThinking || isAISpeaking) ? 0.6 : 1,
                        boxShadow: (isAIThinking || isAISpeaking) ? 'none' : '0 4px 12px rgba(99,102,241,0.4)',
                      }}
                    >
                      {isAIThinking
                        ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Thinking...</>
                        : <><SendHorizonal size={13}/> Done Answering</>
                      }
                    </button>
                  </div>
                  <p style={{margin:0,fontSize:'15px',lineHeight:'1.6',color:captions?'#f1f5f9':'#475569',fontStyle:captions?'normal':'italic'}}>
                    {captions || 'Listening for your response...'}
                  </p>
                </div>
              </div>

              {/* Right: analytics */}
              <div style={{width:'270px',flexShrink:0,background:'#fff',borderRadius:'20px',padding:'20px',boxShadow:'0 10px 40px rgba(79,70,229,0.12)',display:'flex',flexDirection:'column',gap:'16px',overflow:'auto'}}>
                <h3 style={{fontSize:'15px',fontWeight:'bold',color:'#2b5876',margin:0,display:'flex',alignItems:'center',gap:'8px'}}>
                  <Activity size={17}/> Live Analytics
                </h3>

                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><Eye size={13}/>Eye Contact</div>
                  <div style={{position:'relative',display:'inline-block'}}>
                    <ScoreRing value={eyeContactScore} color={eyeContactScore>65?'#10b981':'#ef4444'}/>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                      <span style={{fontSize:'18px',fontWeight:'bold',color:eyeContactScore>65?'#10b981':'#ef4444'}}>{eyeContactScore}%</span>
                    </div>
                  </div>
                </div>

                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><User size={13}/>Posture</div>
                  <div style={{position:'relative',display:'inline-block'}}>
                    <ScoreRing value={postureScore} color={postureScore>65?'#10b981':'#f59e0b'}/>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'18px',fontWeight:'bold',color:postureScore>65?'#10b981':'#f59e0b'}}>{postureScore}%</span>
                    </div>
                  </div>
                </div>

                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'14px'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'6px'}}>Speaking Pace</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
                    <span style={{fontSize:'26px',fontWeight:'bold',color:'#3b82f6'}}>{wpm}</span>
                    <span style={{fontSize:'12px',color:'#94a3b8'}}>wpm</span>
                  </div>
                  <div style={{fontSize:'11px',marginTop:'4px',fontWeight:'700',color:(wpm>=100&&wpm<=155)?'#10b981':wpm===0?'#94a3b8':'#f59e0b'}}>
                    {wpm===0?'Start speaking...':wpm<100?'Speak a little faster':wpm>155?'Slow down slightly':'Great pace!'}
                  </div>
                </div>

                {/* Interview phase */}
                <div style={{background:'linear-gradient(135deg,#ede9fe,#dbeafe)',borderRadius:'14px',padding:'14px'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'6px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <Sparkles size={12} color="#8b5cf6"/> Interview Phase
                  </div>
                  <div style={{fontSize:'14px',fontWeight:'bold',color:'#4e4376',textTransform:'capitalize'}}>{interviewPhase.replace('_',' ')}</div>
                </div>

                <div style={{background:'#f8fafc',borderRadius:'14px',padding:'14px',flex:1}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#64748b',marginBottom:'10px'}}>
                    Keywords Detected <span style={{color:'#2b5876'}}>({detectedKeywords.length})</span>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',minHeight:'28px'}}>
                    {detectedKeywords.length === 0
                      ? <span style={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>Listening...</span>
                      : detectedKeywords.map((kw,i) => (
                        <span key={i} style={{padding:'3px 10px',background:'#e0e7ff',color:'#3730a3',borderRadius:'12px',fontSize:'12px',fontWeight:'bold'}}>{kw}</span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLETED ── */}
          {interviewState === 'completed' && report && (
            <div style={{flex:1,overflow:'auto'}}>
              <div style={{background:'#fff',borderRadius:'24px',padding:'40px',boxShadow:'0 10px 40px rgba(79,70,229,0.15)',maxWidth:'860px',margin:'0 auto'}}>

                <div style={{textAlign:'center',marginBottom:'32px'}}>
                  <div style={{background:'#dcfce7',padding:'20px',borderRadius:'50%',display:'inline-flex',marginBottom:'16px'}}>
                    <Award size={40} color="#16a34a"/>
                  </div>
                  <h2 style={{color:'#1e293b',fontSize:'28px',marginBottom:'8px',fontWeight:'bold'}}>Interview Complete!</h2>
                  <p style={{color:'#64748b',fontSize:'15px'}}>You completed <strong>{report.questionsAnswered}</strong> questions in this session.</p>
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
                      {report.overallScore>=85?'Outstanding interview performance!':report.overallScore>=70?'Solid performance with room to grow.':report.overallScore>=55?'Keep practicing — you\'re getting there!':'More practice will help you shine.'}
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
                  ].map(({label,value,Icon,sub}) => {
                    const {color} = getGrade(value);
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

                {/* ── AI Assessment Section ── */}
                <div style={{marginBottom:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
                    <Sparkles size={18} color="#8b5cf6"/>
                    <h3 style={{margin:0,fontSize:'18px',fontWeight:'bold',color:'#1e293b'}}>AI Interview Assessment</h3>
                    {isGeneratingReport && (
                      <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#8b5cf6',fontStyle:'italic'}}>
                        <Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Generating...
                      </div>
                    )}
                  </div>

                  {!aiAssessment && !isGeneratingReport && (
                    <div style={{background:'#f8fafc',borderRadius:'14px',padding:'20px',color:'#94a3b8',fontSize:'14px',textAlign:'center',fontStyle:'italic'}}>
                      {conversationHistory.length < 2 ? 'Complete more questions to get an AI assessment.' : 'Assessment will appear here shortly.'}
                    </div>
                  )}

                  {aiAssessment && (
                    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                      {/* Verdict */}
                      <div style={{background:'linear-gradient(135deg,#ede9fe,#dbeafe)',borderRadius:'14px',padding:'18px',border:'1px solid rgba(139,92,246,0.2)'}}>
                        <div style={{fontSize:'13px',fontWeight:'700',color:'#4e4376',marginBottom:'8px'}}>Overall Verdict</div>
                        <p style={{margin:0,fontSize:'14px',color:'#374151',lineHeight:1.65}}>{aiAssessment.overallVerdict}</p>
                      </div>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                        {/* Strengths */}
                        <div style={{background:'#f0fdf4',borderRadius:'14px',padding:'16px',border:'1px solid #bbf7d0'}}>
                          <div style={{fontSize:'13px',fontWeight:'700',color:'#166534',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                            <CheckCircle2 size={14}/> Strengths
                          </div>
                          {(aiAssessment.strengths || []).map((s,i) => (
                            <div key={i} style={{fontSize:'13px',color:'#166534',display:'flex',gap:'7px',marginBottom:'6px'}}>
                              <span style={{flexShrink:0}}>•</span>{s}
                            </div>
                          ))}
                        </div>

                        {/* Weaknesses */}
                        <div style={{background:'#fff7ed',borderRadius:'14px',padding:'16px',border:'1px solid #fed7aa'}}>
                          <div style={{fontSize:'13px',fontWeight:'700',color:'#92400e',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                            <Activity size={14}/> Areas to Improve
                          </div>
                          {(aiAssessment.weaknesses || []).map((w,i) => (
                            <div key={i} style={{fontSize:'13px',color:'#92400e',display:'flex',gap:'7px',marginBottom:'6px'}}>
                              <span style={{flexShrink:0}}>•</span>{w}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Topics to revise */}
                      {aiAssessment.topicsToRevise?.length > 0 && (
                        <div style={{background:'#fff1f2',borderRadius:'14px',padding:'16px',border:'1px solid #fecdd3'}}>
                          <div style={{fontSize:'13px',fontWeight:'700',color:'#be123c',marginBottom:'10px'}}>Topics to Revise</div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                            {aiAssessment.topicsToRevise.map((t,i) => (
                              <span key={i} style={{padding:'4px 14px',background:'#ffe4e6',color:'#be123c',borderRadius:'16px',fontSize:'13px',fontWeight:'600'}}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next steps */}
                      {aiAssessment.suggestedNextSteps?.length > 0 && (
                        <div style={{background:'#f0f7ff',borderRadius:'14px',padding:'16px',border:'1px solid #bfdbfe'}}>
                          <div style={{fontSize:'13px',fontWeight:'700',color:'#1d4ed8',marginBottom:'10px'}}>Suggested Next Steps</div>
                          {aiAssessment.suggestedNextSteps.map((s,i) => (
                            <div key={i} style={{fontSize:'13px',color:'#1d4ed8',display:'flex',gap:'7px',marginBottom:'6px'}}>
                              <span style={{flexShrink:0,fontWeight:'bold'}}>{i+1}.</span>{s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Keywords used */}
                {report.keywords.length > 0 && (
                  <div style={{background:'#f0f7ff',borderRadius:'14px',padding:'18px',marginBottom:'20px'}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#2b5876',marginBottom:'10px'}}>Technical Keywords Used</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                      {report.keywords.map((kw,i) => (
                        <span key={i} style={{padding:'4px 14px',background:'#e0e7ff',color:'#3730a3',borderRadius:'16px',fontSize:'13px',fontWeight:'bold'}}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

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
