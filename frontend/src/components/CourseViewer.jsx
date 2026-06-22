import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCircle, Clock, Video, FileText, Award, ChevronLeft, ChevronRight, Menu, X, PlayCircle, Home, Inbox, MessageSquare, Send, Lock, Bot, Volume2, VolumeX, SkipBack, Pause, Play, Music, Square } from 'lucide-react';
import confetti from 'canvas-confetti';
import AskDoubtChat from './AskDoubtChat';
import Assessment from './Assessment';
import ETLogo from '../assets/ET.png';
import GameficationUI from './GameficationUI';
import * as soundLibrary from '../utils/soundLibrary';
import ttsManager from '../utils/ttsManager';
import gamificationEngine from '../utils/gamificationEngine';
import studyMusic from '../assets/alex-morgan-study-lofi-music-548638.mp3';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CourseViewer = ({ token, student: initialStudent, logout }) => {
  const [student, setStudent] = useState(initialStudent);
  const [courseDays, setCourseDays] = useState([]);
  const [fullCourseDays, setFullCourseDays] = useState({});
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // TTS and Gamification State
  const [isListening, setIsListening] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);
  const [gamificationData, setGamificationData] = useState(null);
  const ttsRef = useRef(null);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenCourseTutorial');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  const tutorialContent = {
    1: { title: "Step 1: Focus Music", text: "Click here to toggle soothing Lo-Fi study music while you read.", targetId: "btn-bgm" },
    2: { title: "Step 2: AI Voice Reader", text: "Listen to the course content using our AI Voice assistant.", targetId: "btn-tts" },
    3: { title: "Step 3: Course Content", text: "Read the materials, watch videos, and review images here.", targetId: "course-content-area" },
    4: { title: "Step 4: Next / Finish", text: "Click here to advance to the next item or finish the day.", targetId: "btn-next" }
  };

  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    if (showTutorial) {
      const updatePosition = () => {
        // Fallback for mobile where btn-bgm is hidden
        let targetId = tutorialContent[tutorialStep].targetId;
        if (targetId === 'btn-bgm' && window.innerWidth <= 768) {
          targetId = 'btn-bgm-mobile';
        }
        
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const rect = target.getBoundingClientRect();
            let top = rect.bottom + 20;
            let left = rect.left + (rect.width / 2) - 200; // Center relative to 400px width tooltip
            
            if (top + 320 > window.innerHeight) {
              top = rect.top - 320; // Place above if too low
            }
            if (left < 16) left = 16;
            if (left + 400 > window.innerWidth) left = window.innerWidth - 416;
            
            setTooltipStyle({
              position: 'absolute',
              top: `${top}px`,
              left: `${left}px`,
              margin: 0,
              transform: 'none'
            });
          }, 300); // allow scroll to settle
        } else {
          // Fallback to center
          setTooltipStyle({});
        }
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [tutorialStep, showTutorial]);

  const handleNextTutorial = () => {
    if (tutorialStep < 4) {
      setTutorialStep(prev => prev + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('hasSeenCourseTutorial', 'true');
    }
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenCourseTutorial', 'true');
  };

  // BGM State
  const [bgmPlaying, setBgmPlaying] = useState(true);
  const audioRef = useRef(null);
  
  const [submittedAssessments, setSubmittedAssessments] = useState({});

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15;
      if (bgmPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Audio auto-play blocked by browser. Waiting for user interaction.", e);
            const startAudioOnInteract = () => {
              if (bgmPlaying && audioRef.current) {
                audioRef.current.play().catch(err => console.error(err));
              }
              document.removeEventListener('click', startAudioOnInteract);
            };
            document.addEventListener('click', startAudioOnInteract);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [bgmPlaying]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const activeDomain = location.state?.activeDomain || student?.domain;
  const courseData = activeDomain === student?.domain ? student : student?.additionalCourses?.find(c => c.domain === activeDomain);

  // Start Date check
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    // Check if format is DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  };
  const parsedStartDate = parseDateString(courseDetails?.startDate);

  // Navigation state
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const contentAreaRef = useRef(null);

  useEffect(() => {
    setStudentAnswer('');
    setAiEvaluation(null);
    setIsEvaluating(false);
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeItemIndex, activeDayIndex]);
  
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [recommendationInboxOpen, setRecommendationInboxOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isCourseShuttered, setIsCourseShuttered] = useState(false);
  const [shutterNote, setShutterNote] = useState('');

  useEffect(() => {
    if (initialStudent) {
      setStudent(initialStudent);
      const progress = courseData?.learningProgress || 1; // 1-indexed days
      setActiveDayIndex(Math.max(0, progress - 1));
      setActiveItemIndex(0); // Start at first item of the day

      // Initialize gamification data
      const stats = gamificationEngine.getData(initialStudent._id);
      setGamificationData(stats);
    }
  }, [initialStudent, courseData?.learningProgress]);

  useEffect(() => {
    if (courseData?.lastDayCompletedAt) {
      const checkTime = () => {
        const last = new Date(courseData.lastDayCompletedAt).getTime();
        const now = new Date().getTime();
        const diff = now - last;
        const sixHours = 6 * 60 * 60 * 1000;
        if (diff < sixHours) {
          const rem = sixHours - diff;
          const h = Math.floor(rem / (1000 * 60 * 60));
          const m = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${h}h ${m}m`);
        } else {
          setTimeRemaining(null);
        }
      };
      checkTime();
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [courseData?.lastDayCompletedAt]);

  const fetchData = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [daysRes, recRes, coursesRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/course-days/${encodeURIComponent(activeDomain)}/summary`),
        axios.get(`${API_URL}/recommendations/${student._id}`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/system-config`)
      ]);
      setCourseDays(daysRes.data.filter(d => !d.hidden).sort((a,b) => a.dayNumber - b.dayNumber));
      setRecommendations(recRes.data.messages || []);
      setCourseDetails(coursesRes.data.find(c => c.title === activeDomain));
      if (configRes.data) {
        setIsCourseShuttered(configRes.data.isCourseShuttered || false);
        setShutterNote(configRes.data.shutterNote || '');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [student, activeDomain]);

  // Time tracking state
  const timeTrackingInterval = useRef(null);
  const startTime = useRef(Date.now());
  const lastTrackedItem = useRef({ dayNumber: -1, itemIndex: -1 });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch full day content on demand
  useEffect(() => {
    const summaryDay = courseDays[activeDayIndex];
    if (!summaryDay) return;
    
    // If we already fetched this day, skip
    if (fullCourseDays[summaryDay.dayNumber]) return;

    const fetchFullDay = async () => {
      setDayLoading(true);
      try {
        const res = await axios.get(`${API_URL}/course-days/${encodeURIComponent(activeDomain)}/day/${summaryDay.dayNumber}`);
        setFullCourseDays(prev => ({ ...prev, [summaryDay.dayNumber]: res.data }));
      } catch (err) {
        console.error("Failed to fetch full day", err);
      }
      setDayLoading(false);
    };
    fetchFullDay();
  }, [activeDayIndex, courseDays, activeDomain, fullCourseDays]);

  // Handle time tracking
  useEffect(() => {
    if (courseDays.length === 0 || !student) return;
    const summaryDay = courseDays[activeDayIndex];
    const currentDay = summaryDay ? (fullCourseDays[summaryDay.dayNumber] || summaryDay) : null;
    if (!currentDay) return;

    // Save previous time if navigating away
    const saveTime = () => {
      const timeSpentSecs = Math.floor((Date.now() - startTime.current) / 1000);
      if (timeSpentSecs > 0 && lastTrackedItem.current.dayNumber !== -1) {
        axios.put(`${API_URL}/students/${student._id}/track-time`, {
          domain: activeDomain,
          dayNumber: lastTrackedItem.current.dayNumber,
          itemIndex: lastTrackedItem.current.itemIndex,
          timeSpentSeconds: timeSpentSecs
        }, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error);
      }
    };

    saveTime(); // Save previous item time

    // Reset for new item
    startTime.current = Date.now();
    lastTrackedItem.current = { dayNumber: currentDay.dayNumber, itemIndex: activeItemIndex };

    return () => {
      saveTime();
      lastTrackedItem.current = { dayNumber: -1, itemIndex: -1 };
    };
  }, [activeDayIndex, activeItemIndex, courseDays, student, activeDomain, token]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        ttsManager.stop();
        setIsListening(false);
        setIsPaused(false);
      }
    };
  }, [isListening]);

  // Reply to admin recommendation
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if(recommendationInboxOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // mark read
      axios.put(`${API_URL}/recommendations/${student._id}/read`, { roleToMarkRead: 'Admin' }).catch(console.error);
    }
  }, [recommendationInboxOpen, recommendations]);

  const sendReply = async (e) => {
    e.preventDefault();
    if(!replyText.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/recommendations/${student._id}`, {
        text: replyText,
        senderRole: 'Student'
      });
      setRecommendations(res.data.messages);
      setReplyText('');
    } catch(err) {
      alert(err.message);
    }
  };

  // TTS Functions
  const handleTtsPlay = () => {
    if (!currentItem) return;

    const textToSpeak = currentItem.body || currentItem.title;
    const stripHtml = textToSpeak.replace(/<[^>]*>/g, ''); // Remove HTML tags

    if (ttsManager.isSpeaking()) {
      ttsManager.stop();
      setIsListening(false);
      setIsPaused(false);
    } else {
      const success = ttsManager.speak(stripHtml, {
        rate: ttsRate,
        onEnd: () => { setIsListening(false); setIsPaused(false); },
        onError: (err) => {
          console.error('TTS Error:', err);
          setIsListening(false);
          setIsPaused(false);
        },
      });
      if (success) {
        setIsListening(true);
        setIsPaused(false);
      }
    }
  };

  const handleTtsPause = () => {
    if (ttsManager.isPaused()) {
      ttsManager.resume();
      setIsPaused(false);
    } else {
      ttsManager.pause();
      setIsPaused(true);
    }
  };

  const handleTtsStop = () => {
    ttsManager.stop();
    setIsListening(false);
    setIsPaused(false);
  };

  const handleEvaluateAnswer = async () => {
    if (!studentAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await axios.post(`${API_URL}/evaluate-answer`, {
        question: currentItem.question,
        expectedAnswer: currentItem.expectedAnswer,
        studentAnswer
      }, { headers: { Authorization: `Bearer ${token}` } });

      setAiEvaluation(res.data);

      if (res.data.isCorrect) {
        // Play success sound and award points
        soundLibrary.playClap();
        const updatedData = gamificationEngine.awardPoints(student._id, 'ai_qa', true);

        // Check for new achievements
        const newAchievements = gamificationEngine.checkAchievements(student._id);
        if (newAchievements.length > 0) {
          soundLibrary.playLevelUp();
        }

        // Update state
        setGamificationData(updatedData);

        // Show confetti
        confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 } });
      } else {
        // Play error sound and award attempt points
        soundLibrary.playErrorBuzz();
        const updatedData = gamificationEngine.awardPoints(student._id, 'ai_qa', false);
        setGamificationData(updatedData);
      }
    } catch (err) {
      alert("Failed to evaluate answer: " + (err.response?.data?.error || err.message));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = async () => {
    const currentDay = courseDays[activeDayIndex];
    const isDayCompleted = courseData?.learningProgress > currentDay.dayNumber;

    if (!isDayCompleted && currentItem?.itemType === 'assessment' && !submittedAssessments[currentItem._id]) {
      alert("Please mark the assessment as completed before moving forward.");
      return;
    }

    if (activeItemIndex < currentDay.items.length - 1) {
      setActiveItemIndex(prev => prev + 1);
    } else {
      // Reached the end of the day.
      if (isDayCompleted) {
        if (activeDayIndex < courseDays.length - 1) {
          setActiveDayIndex(prev => prev + 1);
          setActiveItemIndex(0);
        } else {
          alert("Course completely finished! Redirecting to dashboard.");
          navigate('/dashboard');
        }
      } else {
        // Finished day! Update backend learningProgress
        const nextDayNum = currentDay.dayNumber + 1;

        try {
          const res = await axios.put(`${API_URL}/students/${student._id}/course`, {
            domain: activeDomain,
            learningProgress: Math.max(courseData.learningProgress || 0, nextDayNum)
          }, { headers: { Authorization: `Bearer ${token}` } });
          setStudent(res.data);

          if (activeDayIndex < courseDays.length - 1) {
            setActiveDayIndex(prev => prev + 1);
            setActiveItemIndex(0);
          } else {
            alert("Course completely finished! Redirecting to dashboard.");
            navigate('/dashboard');
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handlePrev = () => {
    if (activeItemIndex > 0) {
      setActiveItemIndex(prev => prev - 1);
    } else if (activeDayIndex > 0) {
      setActiveDayIndex(prev => prev - 1);
      setActiveItemIndex(courseDays[activeDayIndex - 1].items.length - 1);
    }
  };

  const handleSubmitAssessment = () => {
    if (!currentItem || submittedAssessments[currentItem._id]) return;
    
    soundLibrary.playSuccessChime();
    const updatedData = gamificationEngine.awardPoints(student._id, 'assessment', true);
    const newAchievements = gamificationEngine.checkAchievements(student._id);
    if (newAchievements.length > 0) {
      soundLibrary.playLevelUp();
    }
    setGamificationData(updatedData);
    setSubmittedAssessments(prev => ({ ...prev, [currentItem._id]: true }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const summaryDay = courseDays[activeDayIndex];
  const currentDay = summaryDay ? (fullCourseDays[summaryDay.dayNumber] || summaryDay) : null;
  const currentItem = currentDay?.items ? currentDay.items[activeItemIndex] : null;
  
  // Calculate unread recommendations
  const unreadCount = recommendations.filter(m => m.senderRole === 'Admin' && !m.isRead).length;
  
  const isLockedByTime = timeRemaining !== null && activeDayIndex >= (courseData?.learningProgress - 1 || 0);

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      
      {/* Left Sidebar */}
      <nav className={`fixed md:sticky inset-y-0 left-0 w-64 bg-surface/90 backdrop-blur-xl border-r border-outline-variant/30 shadow-2xl flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={ETLogo} alt="Logo" className="w-8 h-8 drop-shadow-md" />
            <span className="font-bold text-lg text-primary">Enlight Techz</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors text-sm font-bold text-text-dim">
            <Home size={18} /> Dashboard
          </button>

          <div className="pt-4 border-t border-outline-variant/30">
            <h4 className="text-xs uppercase tracking-wider font-bold text-text-dim mb-3">Course Roadmap</h4>
            {courseDays.map((day, idx) => {
              const isFutureDay = day.dayNumber > (courseData?.learningProgress || 1);
              const isNextDayLockedByTime = isLockedByTime && day.dayNumber === (courseData?.learningProgress || 1);
              const isLocked = isFutureDay || isNextDayLockedByTime;
              const isCompleted = day.dayNumber < (courseData?.learningProgress || 1);
              const isActive = activeDayIndex === idx;
              return (
                <button 
                  key={day._id}
                  onClick={() => {
                    if (!isLocked) {
                      setActiveDayIndex(idx);
                      // Don't forcefully set activeItemIndex(0) if it's a completed day, maybe they left off at some point, or let's default to 0. 
                      // The prompt says "don't reopen it from scratch". We can default to 0 for simplicity or just let it stay at what it was if they navigate back. But to be safe, if we don't reset, it might be out of bounds if the day has fewer items. Let's just set to 0. The key is "remove locking".
                      setActiveItemIndex(0);
                      if(window.innerWidth < 768) setSidebarOpen(false);
                    }
                  }}
                  disabled={isLocked}
                  className={`w-full flex flex-col text-left p-3 rounded-xl mb-2 transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : isLocked ? 'opacity-50 cursor-not-allowed text-text-dim bg-surface-container-highest/20 pointer-events-none' : 'bg-surface-container hover:bg-surface-container-high text-text-primary'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isLocked ? <Lock size={14} /> : isCompleted && !isActive ? <CheckCircle size={14} className="text-success" /> : <PlayCircle size={14} />}
                    <span className="font-bold text-sm">Day {day.dayNumber}</span>
                  </div>
                  <span className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-text-dim'}`}>{day.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/30">
          <button onClick={() => setRecommendationInboxOpen(true)} className="w-full flex items-center justify-between p-3 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors text-accent font-bold text-sm mb-3 relative">
            <div className="flex items-center gap-2"><Inbox size={18} /> Inbox</div>
            {unreadCount > 0 && <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </button>
          <button onClick={logout} className="w-full text-center p-3 text-sm font-bold text-error border border-error/30 rounded-xl hover:bg-error/10">
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-surface-container-lowest">
        <audio ref={audioRef} src={studyMusic} loop autoPlay={bgmPlaying} />
        
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between p-5 bg-surface border-b border-outline-variant/30 z-40 shrink-0">
          <h1 className="font-headline-md text-2xl font-bold text-primary">{activeDomain}</h1>
          <div className="flex items-center gap-6">
            <button 
              id="btn-bgm"
              onClick={() => setBgmPlaying(!bgmPlaying)}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 ${bgmPlaying ? 'bg-primary text-white shadow-lg' : 'bg-surface-container text-text-dim hover:text-primary hover:bg-primary/10'} ${showTutorial && tutorialStep === 1 ? 'relative z-[70] ring-4 ring-primary bg-white shadow-2xl scale-125' : ''}`}
              title="Study Music"
            >
              <Music size={20} />
            </button>
            {gamificationData && student && (
              <GameficationUI studentId={student._id} allStudents={[student]} />
            )}
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex flex-col p-4 bg-surface border-b border-outline-variant/30 z-40 shrink-0 gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <button onClick={() => setSidebarOpen(true)} className="shrink-0 p-1 bg-primary/10 rounded-lg"><Menu size={24} className="text-primary" /></button>
              <h1 className="font-bold text-primary text-lg truncate flex-1">{activeDomain}</h1>
            </div>
            <button 
              id="btn-bgm-mobile"
              onClick={() => setBgmPlaying(!bgmPlaying)}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 ml-2 shrink-0 ${bgmPlaying ? 'bg-primary text-white shadow-md' : 'bg-surface-container text-text-dim'}`}
              title="Study Music"
            >
              <Music size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
            {gamificationData && student && (
              <div className="shrink-0">
                <GameficationUI studentId={student._id} allStudents={[student]} />
              </div>
            )}
          </div>
        </header>

        {timeRemaining && !isCourseShuttered && (
          <div className="bg-primary/10 text-primary px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2 shrink-0 z-40 border-b border-primary/20 animate-fade-in shadow-sm">
            <Clock size={18} />
            Great job today! Your next day will unlock in {timeRemaining}.
          </div>
        )}

        {isCourseShuttered ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-lowest relative z-50">
            <div className="text-center max-w-lg bg-surface p-10 rounded-3xl shadow-2xl border border-outline-variant/30">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 text-error">
                <Lock size={48} />
              </div>
              <h2 className="text-3xl font-bold text-on-surface mb-4">Course Temporarily Locked</h2>
              <p className="text-text-dim text-lg mb-8 leading-relaxed whitespace-pre-wrap">
                {shutterNote ? shutterNote : (
                  <>
                    The course content is currently closed for maintenance or scheduled downtime. <br/>
                    <strong>Please visit this course after 1 hour.</strong>
                  </>
                )}
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-md hover:bg-primary/90 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : currentDay ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {courseData?.learningProgress > currentDay.dayNumber && (
              <div className="bg-success text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 shrink-0 z-50">
                <CheckCircle size={16} />
                You have already completed this day. You are currently in review mode.
                <button 
                  onClick={() => {
                    const progress = courseData?.learningProgress || 1;
                    setActiveDayIndex(Math.max(0, progress - 1));
                    setActiveItemIndex(0);
                  }}
                  className="ml-4 underline hover:text-white/80"
                >
                  Return to Current Day
                </button>
              </div>
            )}
            {/* Horizontal Day Tracker */}
            <div className="bg-surface shadow-sm border-b border-outline-variant/30 px-4 md:px-8 py-4 z-10 flex-none">
              <h2 className="font-bold text-xl md:text-2xl mb-4 text-on-surface flex items-center gap-3">
                <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">Day {currentDay.dayNumber}</span>
                {currentDay.title}
              </h2>
              
              {/* Progress Nodes */}
              <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex items-center min-w-max relative px-2">
                  <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-outline-variant/50 -translate-y-1/2 z-0"></div>
                  <div className="absolute left-2 top-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `calc(${((courseData?.learningProgress > currentDay.dayNumber ? 1 : (activeItemIndex / (Math.max(1, currentDay.items.length - 1))))) * 100}% - 16px)` }}></div>
                  
                  <div className="flex gap-8 w-full relative z-10">
                    {currentDay.items.map((item, idx) => {
                      const isDayCompleted = courseData?.learningProgress > currentDay.dayNumber;
                      const isPassed = isDayCompleted || activeItemIndex > idx;
                      const isCurrent = activeItemIndex === idx;
                      const canClick = isDayCompleted || idx <= activeItemIndex + 1;
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => { 
                            if ((!isLockedByTime || isDayCompleted) && canClick) {
                              if (!isDayCompleted && idx > activeItemIndex && currentItem?.itemType === 'assessment' && !submittedAssessments[currentItem._id]) {
                                alert("Please mark the assessment as completed before moving forward.");
                                return;
                              }
                              setActiveItemIndex(idx);
                            }
                          }}
                          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 transition-all shadow-sm
                            ${((!isLockedByTime || isDayCompleted) && canClick) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                            ${isPassed ? 'bg-primary border-primary text-white' : isCurrent ? 'bg-white border-primary text-primary ring-4 ring-primary/20 scale-110' : 'bg-surface-container border-outline-variant text-text-dim'}
                          `}
                          title={item.title}
                        >
                          {item.itemType === 'assessment' ? <Award size={14} /> : item.itemType === 'ai_qa' ? <Bot size={14} /> : item.contentType === 'video' ? <Video size={14} /> : <FileText size={14} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div ref={contentAreaRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
              <div className="max-w-4xl mx-auto pb-20">
                {dayLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-dim">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold animate-pulse">Loading content...</p>
                  </div>
                ) : isLockedByTime ? (
                  <div className="flex flex-col items-center justify-center py-24 text-text-dim text-center animate-fade-in">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary shadow-inner">
                      <Lock size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary mb-4 font-headline-md">Day Locked</h2>
                    <p className="max-w-md text-lg leading-relaxed">
                      Great job completing your tasks! Your next day's content will automatically unlock in <strong className="text-primary">{timeRemaining}</strong>.
                    </p>
                  </div>
                ) : currentItem ? (
                  <div className="glass-card bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-outline-variant/30 animate-fade-in relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-text-primary break-words">{currentItem.title}</h3>

                      {/* TTS Controls - Only for text content */}
                      {currentItem.itemType === 'content' && currentItem.contentType !== 'video' && ttsManager.isSupported && (
                        <div className="flex items-center bg-primary/5 px-3 py-2 rounded-xl border border-primary/20 shrink-0">
                          <button
                            id="btn-tts"
                            onClick={handleTtsPlay}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                              isListening
                                ? 'bg-primary text-white'
                                : 'bg-surface hover:bg-primary/10 text-primary'
                            } ${showTutorial && tutorialStep === 2 ? 'relative z-[70] ring-4 ring-primary bg-white shadow-2xl scale-125' : ''}`}
                            title={isListening ? 'Stop listening' : 'Listen to content'}
                          >
                            {isListening ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>

                          <div className={`flex items-center overflow-hidden transition-all duration-500 ease-in-out ${isListening ? 'max-w-[400px] opacity-100 ml-3 gap-3' : 'max-w-0 opacity-0 ml-0 gap-0'}`}>
                            <button
                              onClick={handleTtsPause}
                              className={`p-2 rounded-lg transition-colors shrink-0 ${isPaused ? 'bg-primary text-white shadow-inner' : 'bg-surface hover:bg-primary/10 text-primary'}`}
                              title={isPaused ? "Resume" : "Pause"}
                            >
                              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
                            </button>
                            <button
                              onClick={handleTtsStop}
                              className="p-2 rounded-lg bg-surface hover:bg-error hover:text-white active:bg-error/80 text-text-dim transition-colors shrink-0"
                              title="Stop"
                            >
                              <Square size={14} fill="currentColor" />
                            </button>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={ttsRate}
                              onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                              className="w-20 md:w-24 shrink-0 accent-primary"
                              title="Speech rate"
                            />
                            <span className="text-xs text-text-dim font-bold shrink-0">{ttsRate.toFixed(1)}x</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {currentItem.itemType === 'content' ? (
                      <div id="course-content-area" className={`prose prose-lg max-w-none prose-headings:text-primary prose-a:text-secondary ${showTutorial && tutorialStep === 3 ? 'relative z-[70] bg-white p-6 rounded-2xl ring-4 ring-primary shadow-2xl' : ''}`}>
                        {currentItem.contentType === 'video' ? (
                           <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20 mb-8 bg-black">
                             <iframe src={currentItem.videoUrl} className="w-full h-full" allowFullScreen loading="lazy"></iframe>
                           </div>
                        ) : currentItem.contentType === 'image' ? (
                           <img src={currentItem.imageUrl} alt={currentItem.title} loading="lazy" className="w-full rounded-2xl shadow-lg border border-outline-variant/20 mb-8" />
                        ) : (
                           <div dangerouslySetInnerHTML={{ __html: currentItem.body?.replace(/<img /g, '<img loading="lazy" ') }} />
                        )}
                      </div>
                    ) : currentItem.itemType === 'assessment' ? (
                      <div className="assessment-container">
                        <div className="bg-accent/10 border border-accent/20 p-6 rounded-2xl mb-8 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-accent text-xl flex items-center gap-2 mb-2"><Award /> Interactive Assessment</h4>
                            <p className="text-text-dim">Test your understanding of today's topics before moving forward.</p>
                          </div>
                        </div>
                        {currentItem.formUrl ? (
                          <div className="w-full relative rounded-2xl overflow-hidden border border-outline-variant/30 mb-8 h-[600px] bg-white">
                            <iframe src={currentItem.formUrl} width="100%" height="100%" frameBorder="0" marginHeight="0" marginWidth="0">Loading…</iframe>
                          </div>
                        ) : (
                          <div className="p-8 text-center border-2 border-dashed border-outline-variant rounded-2xl mb-8">
                            <p className="text-text-dim italic">Assessment link is not configured for this module.</p>
                          </div>
                        )}
                        <div className="text-center">
                          <button 
                            disabled={submittedAssessments[currentItem._id]}
                            onClick={handleSubmitAssessment} 
                            className={`px-8 py-3 font-bold rounded-xl shadow-md transition-colors ${submittedAssessments[currentItem._id] ? 'bg-surface-container-highest text-text-dim cursor-not-allowed' : 'bg-success text-white hover:bg-success/90'}`}
                          >
                            {submittedAssessments[currentItem._id] ? 'Submitted' : 'Mark Assessment as Completed'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ai-qa-container max-w-2xl mx-auto">
                        <div className="bg-success/10 border border-success/20 p-6 rounded-2xl mb-8 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-success text-xl flex items-center gap-2 mb-2"><Bot /> Automated Q&A Challenge</h4>
                            <p className="text-text-dim">Test your knowledge. An AI explanation awaits!</p>
                          </div>
                        </div>
                        
                        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm mb-8">
                          <h3 className="text-xl font-bold text-text-primary mb-6">{currentItem.question}</h3>
                          
                          {!aiEvaluation ? (
                            <div className="space-y-4">
                              <textarea 
                                value={studentAnswer} 
                                onChange={(e) => setStudentAnswer(e.target.value)} 
                                placeholder="Type your answer here... Be descriptive!" 
                                className="w-full p-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[150px] resize-y"
                                disabled={isEvaluating}
                              ></textarea>
                              
                              <button 
                                disabled={!studentAnswer.trim() || isEvaluating}
                                onClick={handleEvaluateAnswer}
                                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-md flex justify-center items-center gap-2"
                              >
                                {isEvaluating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Bot size={20} />}
                                {isEvaluating ? 'Evaluating...' : 'Submit Answer for AI Grading'}
                              </button>
                            </div>
                          ) : (
                            <div className={`mt-4 p-6 rounded-2xl border ${aiEvaluation.isCorrect ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'} animate-fade-in`}>
                              <h4 className={`font-bold flex items-center gap-2 mb-3 text-lg ${aiEvaluation.isCorrect ? 'text-success' : 'text-error'}`}>
                                {aiEvaluation.isCorrect ? <><CheckCircle size={22}/> Correct! Amazing job.</> : <><X size={22}/> Incorrect. Let's try again:</>}
                              </h4>
                              
                              <div className="p-4 bg-white rounded-xl border border-outline-variant/50 relative shadow-sm mb-6">
                                <div className="absolute -top-3 -left-3 bg-primary text-white p-1.5 rounded-full shadow-md"><Bot size={16}/></div>
                                <p className="text-text-primary text-sm leading-relaxed ml-2">
                                  <span className="font-bold text-primary mr-1">AI Feedback:</span> 
                                  {aiEvaluation.aiReason}
                                </p>
                              </div>
                              
                              <div className="flex gap-4">
                                {!aiEvaluation.isCorrect && (
                                  <button onClick={() => setAiEvaluation(null)} className="flex-1 py-3 border border-primary text-primary font-bold rounded-xl shadow-sm hover:bg-primary/5 transition-colors">
                                    Try Again
                                  </button>
                                )}
                                <button onClick={() => handleNext()} className={`${!aiEvaluation.isCorrect ? 'flex-1' : 'w-full'} py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors`}>
                                  Continue to Next Module
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No content available.</p>
                )}
                
                {/* Navigation Buttons below content */}
                <div className="flex justify-between items-center mt-8">
                  <button 
                    onClick={handlePrev}
                    disabled={activeDayIndex === 0 && activeItemIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft size={20} /> Previous
                  </button>
                  <button 
                    id="btn-next"
                    onClick={handleNext}
                    disabled={isLockedByTime}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-all ${isLockedByTime ? 'bg-surface-container-highest text-text-dim cursor-not-allowed' : 'bg-primary text-white shadow-primary/30 hover:bg-primary-container hover:scale-105'} ${showTutorial && tutorialStep === 4 ? 'relative z-[70] ring-4 ring-primary shadow-2xl scale-110' : ''}`}
                  >
                    {activeItemIndex === currentDay.items.length - 1 ? 'Finish Day' : 'Next Item'} <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Persistent Chat */}
            {currentItem && currentItem.itemType === 'content' && (
              <AskDoubtChat token={token} currentContent={currentItem} />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4 text-text-dim">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">No Course Content</h3>
              <p className="text-text-dim">There is no content available for this domain yet.</p>
            </div>
          </div>
        )}
      </main>

      {/* Recommendation Inbox Slide-out */}
      {recommendationInboxOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col animate-slide-up border-l border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/30 bg-primary/10 flex items-center justify-between">
              <h3 className="font-bold text-primary flex items-center gap-2"><Inbox /> Mentor Chat</h3>
              <button onClick={() => setRecommendationInboxOpen(false)} className="text-primary/70 hover:text-primary"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-center text-text-dim text-sm mt-10">No messages from your mentor yet.</p>
              ) : (
                recommendations.map((msg, idx) => {
                  const isStudent = msg.senderRole === 'Student';
                  return (
                    <div key={idx} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${isStudent ? 'bg-surface-container-highest rounded-tr-sm' : 'bg-primary text-white rounded-tl-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[9px] block mt-1 ${isStudent ? 'text-text-dim' : 'text-white/70'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-outline-variant/30 bg-surface">
              <form onSubmit={sendReply} className="flex gap-2">
                <input 
                  type="text" value={replyText} onChange={e=>setReplyText(e.target.value)}
                  placeholder="Reply to mentor..."
                  className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <button type="submit" disabled={!replyText.trim()} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform scale-100 animate-fade-in text-center relative z-[70] transition-all duration-500"
            style={Object.keys(tooltipStyle).length > 0 ? tooltipStyle : {}}
          >
            {/* Optional Arrow */}
            {Object.keys(tooltipStyle).length > 0 && (
              <div 
                className="absolute w-6 h-6 bg-white rotate-45 transform"
                style={{ 
                  top: tooltipStyle.top && parseInt(tooltipStyle.top) > window.innerHeight / 2 ? 'auto' : '-10px',
                  bottom: tooltipStyle.top && parseInt(tooltipStyle.top) > window.innerHeight / 2 ? '-10px' : 'auto',
                  left: 'calc(50% - 12px)'
                }}
              />
            )}
            
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
              <span className="text-primary font-bold text-2xl">{tutorialStep}</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">{tutorialContent[tutorialStep].title}</h3>
            <p className="text-text-dim mb-8 text-lg">{tutorialContent[tutorialStep].text}</p>
            
            <div className="flex gap-4">
              <button onClick={skipTutorial} className="flex-1 py-3 text-text-dim font-bold hover:bg-surface-container rounded-xl transition-colors">
                Skip
              </button>
              <button onClick={handleNextTutorial} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors">
                {tutorialStep === 4 ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseViewer;
