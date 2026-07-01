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

const ImageCarousel = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return <img src={images[0]} alt={title} loading="lazy" className="w-full rounded-2xl shadow-lg border border-outline-variant/20 mb-8 max-w-full h-auto" />;
  }

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20 mb-8 bg-black flex items-center justify-center min-h-[300px]">
      <img src={images[currentIndex]} alt={`${title} ${currentIndex + 1}`} loading="lazy" className="max-w-full max-h-[70vh] object-contain" />
      
      <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
        <ChevronLeft size={24} />
      </button>
      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
        <ChevronRight size={24} />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
};

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
      audioRef.current.volume = 0.5;
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
  const [highestVisitedItemIndex, setHighestVisitedItemIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const contentAreaRef = useRef(null);
  const trackerRef = useRef(null);

  useEffect(() => {
    setStudentAnswer('');
    setAiEvaluation(null);
    setIsEvaluating(false);
    setHighestVisitedItemIndex(prev => Math.max(prev, activeItemIndex));
    setTimeout(() => {
      if (contentAreaRef.current && trackerRef.current) {
        contentAreaRef.current.scrollTo({
          top: trackerRef.current.offsetTop,
          behavior: 'smooth'
        });
      } else if (contentAreaRef.current) {
        contentAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }, [activeItemIndex]);

  useEffect(() => {
    setHighestVisitedItemIndex(0);
  }, [activeDayIndex]);
  
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
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
    <div className="bg-[#f5f5f5] text-gray-900 flex flex-col h-screen overflow-hidden font-sans">
      
      {/* MS Learn Style Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 text-gray-900 flex items-center justify-between px-4 md:px-6 py-3 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src={ETLogo} alt="Logo" className="w-7 h-7" />
            <span className="font-semibold text-base hidden sm:inline text-gray-900">Enlight Techz</span>
          </div>
          <span className="hidden md:inline text-gray-300 mx-2">|</span>
          <span className="hidden md:inline text-sm text-gray-600 font-medium truncate max-w-[300px]">Learn</span>
        </div>
        <div className="flex items-center gap-3">

          <button onClick={() => setRecommendationInboxOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors relative">
            <Inbox size={18} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
          {gamificationData && student && (
            <div className="hidden md:block">
              <GameficationUI studentId={student._id} allStudents={[student]} />
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Dashboard">
            <Home size={18} />
          </button>
          <button onClick={logout} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 font-medium">
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#0052a3] text-white">
              <div className="flex items-center gap-2">
                <img src={ETLogo} alt="Logo" className="w-7 h-7" />
                <span className="font-bold">Course Menu</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {(courseDetails?.weeks?.length > 0 ? courseDetails.weeks : ['Week 1']).map((week, wIdx) => {
                const daysInWeek = courseDays.filter(d => (d.week || 'Week 1') === week);
                if (daysInWeek.length === 0) return null;
                
                let isPrevWeekIncomplete = false;
                for (let i = 0; i < wIdx; i++) {
                  const prevWeek = (courseDetails?.weeks?.length > 0 ? courseDetails.weeks : ['Week 1'])[i];
                  const prevWeekDays = courseDays.filter(d => (d.week || 'Week 1') === prevWeek);
                  if (prevWeekDays.some(d => d.dayNumber >= (courseData?.learningProgress || 1))) {
                    isPrevWeekIncomplete = true;
                    break;
                  }
                }

                return (
                  <div key={`mob-week-${wIdx}`} className="mb-3">
                    <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#0052a3]/80 mb-2 px-2">{week}</h5>
                    {daysInWeek.map(day => {
                      const idx = courseDays.findIndex(d => d._id === day._id);
                      const isFutureDay = day.dayNumber > (courseData?.learningProgress || 1);
                      const isNextDayLockedByTime = isLockedByTime && day.dayNumber === (courseData?.learningProgress || 1);
                      const isLocked = isPrevWeekIncomplete || isFutureDay || isNextDayLockedByTime;
                      const isCompleted = day.dayNumber < (courseData?.learningProgress || 1);
                      const isActive = activeDayIndex === idx;
                      return (
                        <button key={day._id} onClick={() => { if (!isLocked) { setActiveDayIndex(idx); setActiveItemIndex(0); setSidebarOpen(false); }}} disabled={isLocked}
                          className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${isActive ? 'bg-[#0052a3] text-white shadow-sm' : isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'}`}>
                          {isLocked ? <Lock size={16} className={`shrink-0 ${isActive ? 'text-white/80' : 'text-gray-400'}`} /> : isCompleted ? <CheckCircle size={16} className="shrink-0 text-green-500" /> : <PlayCircle size={16} className={`shrink-0 ${isActive ? 'text-white' : 'text-[#0052a3]'}`} />}
                          <div className="min-w-0"><span className="font-semibold block">Day {day.dayNumber}</span><span className={`text-xs truncate block ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{day.title}</span></div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main ref={contentAreaRef} className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden bg-white custom-scrollbar">
        <audio ref={audioRef} src={studyMusic} loop autoPlay={bgmPlaying} />

        {/* Banners */}
        {/* Banners */}
        {!isCourseShuttered && currentDay && courseData?.learningProgress > currentDay.dayNumber && (
          <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Review mode.
            <button onClick={() => { setActiveDayIndex(Math.max(0, (courseData?.learningProgress || 1) - 1)); setActiveItemIndex(0); }} className="ml-3 underline hover:text-white/80">Return to Current Day</button>
          </div>
        )}

        {isCourseShuttered ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-lg bg-white p-10 rounded-2xl shadow-xl border border-gray-200">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={40} /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Course Temporarily Locked</h2>
              <p className="text-gray-500 mb-6">{shutterNote || 'Please visit after 1 hour.'}</p>
              <button onClick={() => navigate('/dashboard')} className="bg-[#1a1a2e] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2a2a4e] transition-colors">Return to Dashboard</button>
            </div>
          </div>
        ) : currentDay ? (
          <>
            {/* Video Section - Full Width at Top (GUVI style) */}
            {currentItem?.itemType === 'content' && currentItem?.contentType === 'video' && (
              <div className="w-full bg-black shrink-0">
                <div className="max-w-5xl mx-auto">
                  <div className="relative w-full aspect-video">
                    <iframe src={currentItem.videoUrl} className="w-full h-full" allowFullScreen loading="lazy"></iframe>
                  </div>
                </div>
              </div>
            )}

            {/* MS Learn Style Content Area: Left Sidebar + Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
              
              {/* Left Sidebar - Table of Contents */}
              <aside className="hidden lg:block w-[320px] shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto h-[calc(100vh-52px)] sticky top-0 custom-scrollbar">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{activeDomain}</h3>
                </div>
                <div className="p-4">
                  {(courseDetails?.weeks?.length > 0 ? courseDetails.weeks : ['Week 1']).map((week, wIdx) => {
                    const daysInWeek = courseDays.filter(d => (d.week || 'Week 1') === week);
                    if (daysInWeek.length === 0) return null;
                    const completedInWeek = daysInWeek.filter(d => d.dayNumber < (courseData?.learningProgress || 1)).length;
                    
                    let isPrevWeekIncomplete = false;
                    for (let i = 0; i < wIdx; i++) {
                      const prevWeek = (courseDetails?.weeks?.length > 0 ? courseDetails.weeks : ['Week 1'])[i];
                      const prevWeekDays = courseDays.filter(d => (d.week || 'Week 1') === prevWeek);
                      if (prevWeekDays.some(d => d.dayNumber >= (courseData?.learningProgress || 1))) {
                        isPrevWeekIncomplete = true;
                        break;
                      }
                    }

                    const totalInWeek = daysInWeek.length;
                    const weekProgress = totalInWeek > 0 ? Math.round((completedInWeek / totalInWeek) * 100) : 0;
                    return (
                      <div key={`toc-week-${wIdx}`} className="mb-6">
                        <h4 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                          <span>{week}</span>
                          {weekProgress === 100 && <CheckCircle size={14} className="text-green-600" />}
                        </h4>
                        <div className="space-y-0.5">
                          {daysInWeek.map(day => {
                            const idx = courseDays.findIndex(d => d._id === day._id);
                            const isCompleted = day.dayNumber < (courseData?.learningProgress || 1);
                            const isActive = activeDayIndex === idx;
                            const isFutureDay = day.dayNumber > (courseData?.learningProgress || 1);
                            const isNextDayLockedByTime = isLockedByTime && day.dayNumber === (courseData?.learningProgress || 1);
                            const isLocked = isPrevWeekIncomplete || isFutureDay || isNextDayLockedByTime;
                            return (
                              <button key={day._id}
                                onClick={() => { if (!isLocked) { setActiveDayIndex(idx); setActiveItemIndex(0); }}}
                                disabled={isLocked}
                                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors rounded-lg ${isActive ? 'bg-white shadow-sm border border-gray-200 font-semibold text-blue-700' : isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200/50 text-gray-700'}`}>
                                <div className="mt-0.5 shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle size={16} className="text-green-600" />
                                  ) : isLocked ? (
                                    <Lock size={16} className="text-gray-400" />
                                  ) : isActive ? (
                                    <div className="w-4 h-4 rounded-full border-[4px] border-blue-600 bg-white" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                                  )}
                                </div>
                                <span className={`leading-tight ${isActive ? 'text-gray-900' : ''}`}>{day.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0 flex flex-col items-center">
                <div className="w-full max-w-4xl px-4 md:px-12 py-8 flex flex-col min-h-[calc(100vh-52px)]">
                  
                {/* Content */}
                <div ref={trackerRef} className="flex-1 w-full">
                  <div className="w-full">
                      {dayLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                          <div className="w-10 h-10 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="font-semibold animate-pulse">Loading content...</p>
                        </div>
                      ) : isLockedByTime ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-[#1a1a2e]"><Lock size={40} /></div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-3">Day Locked</h2>
                          <p className="max-w-md text-gray-500">Next day unlocks in <strong className="text-[#1a1a2e]">{timeRemaining}</strong>.</p>
                        </div>
                      ) : currentItem ? (
                        <>
                          {/* Day Tracker & Title */}
                          <div className="w-full mb-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="bg-[#0052a3] text-white px-5 py-2 rounded-full font-bold text-lg whitespace-nowrap shadow-sm">
                                  Day {currentDay?.dayNumber}
                                </div>
                                {timeRemaining && !isCourseShuttered && (
                                  <div className="bg-blue-50 text-[#0052a3] px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 border border-blue-200 shadow-sm">
                                    <Clock size={16} /> Next day unlocks in {timeRemaining}
                                  </div>
                                )}
                                <h2 className="text-2xl md:text-4xl font-extrabold text-[#111827] w-full mt-2">
                                  {currentDay?.title}
                                </h2>
                              </div>
                              
                              {/* TTS Player & Music */}
                              <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                                {currentItem.itemType === 'content' && currentItem.contentType !== 'video' && ttsManager.isSupported && (
                                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 shrink-0">
                                    <button id="btn-tts" onClick={handleTtsPlay}
                                      className={`p-2 rounded-lg transition-colors shrink-0 flex items-center gap-2 font-bold text-sm ${isListening ? 'bg-[#1a1a2e] text-white' : 'bg-white hover:bg-gray-100 text-[#1a1a2e] border border-gray-200'} ${showTutorial && tutorialStep === 2 ? 'relative z-[70] ring-4 ring-[#1a1a2e] shadow-2xl scale-125' : ''}`}
                                      title={isListening ? 'Stop' : 'Listen'}>
                                      {isListening ? <VolumeX size={18} /> : <><Bot size={18} /> <span className="hidden sm:inline">AI</span></>}
                                    </button>
                                    <div className={`flex items-center overflow-hidden transition-all duration-500 ${isListening ? 'max-w-[400px] opacity-100 ml-3 gap-2' : 'max-w-0 opacity-0 ml-0 gap-0'}`}>
                                      <button onClick={handleTtsPause} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isPaused ? 'bg-[#1a1a2e] text-white' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'}`}>{isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}</button>
                                      <button onClick={handleTtsStop} className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-gray-500 border border-gray-200 shrink-0"><Square size={12} fill="currentColor" /></button>
                                      <input type="range" min="0.5" max="2" step="0.1" value={ttsRate} onChange={(e) => setTtsRate(parseFloat(e.target.value))} className="w-16 shrink-0 accent-[#1a1a2e]" />
                                      <span className="text-xs text-gray-500 font-semibold shrink-0">{ttsRate.toFixed(1)}x</span>
                                    </div>
                                  </div>
                                )}
                                
                                <button 
                                  id="btn-bgm"
                                  onClick={() => setBgmPlaying(!bgmPlaying)}
                                  className={`p-2.5 rounded-lg border transition-colors shrink-0 ${bgmPlaying ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-100'} ${showTutorial && tutorialStep === 1 ? 'relative z-[70] ring-4 ring-blue-500 bg-white shadow-2xl scale-125' : ''}`}
                                  title="Study Music"
                                >
                                  <Music size={20} />
                                </button>
                              </div>
                            </div>

                            {/* Horizontal Progress Tracker */}
                            <div className="relative w-full overflow-x-auto pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                              <div className="min-w-[400px] relative w-full flex justify-between">
                                {/* Background Line */}
                                <div className="absolute left-0 right-0 h-1 bg-[#0052a3] top-1/2 -translate-y-1/2 z-0"></div>
                                
                                {/* Nodes Container */}
                                <div className="relative z-10 w-full flex items-center justify-between">
                                  {currentDay?.items?.map((item, idx) => {
                                    const isActive = idx === activeItemIndex;
                                    const isCurrentDayCompleted = currentDay.dayNumber < (courseData?.learningProgress || 1);
                                    const isAccessible = isCurrentDayCompleted || idx <= highestVisitedItemIndex;
                                    return (
                                      <button 
                                        key={idx}
                                        onClick={() => {
                                          if (isAccessible) {
                                            setActiveItemIndex(idx);
                                          }
                                        }}
                                        disabled={!isAccessible}
                                        className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-[4px] border-white shadow-sm transition-transform duration-300 ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'}
                                          ${isActive ? 'bg-[#0052a3] scale-[1.15]' : isAccessible ? 'bg-[#0052a3] hover:scale-110' : 'bg-gray-400'}`}
                                        title={isAccessible ? item.title : "Complete previous sections to unlock"}
                                      >
                                        {item.itemType === 'content' && item.contentType === 'video' ? (
                                          <Video size={isActive ? 20 : 18} className="text-white" />
                                        ) : item.itemType === 'content' ? (
                                          <FileText size={isActive ? 20 : 18} className="text-white" />
                                        ) : item.itemType === 'assessment' ? (
                                          <Award size={isActive ? 20 : 18} className="text-white" />
                                        ) : (
                                          <Bot size={isActive ? 20 : 18} className="text-white" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Content Body */}
                          {currentItem.itemType === 'content' ? (
                            <div id="course-content-area" className={`prose prose-sm md:prose-base lg:prose-lg max-w-full w-full break-words overflow-hidden prose-headings:text-gray-900 prose-a:text-blue-600 ${showTutorial && tutorialStep === 3 ? 'relative z-[70] bg-white p-6 rounded-xl ring-4 ring-[#1a1a2e] shadow-2xl' : ''}`}>
                              {currentItem.contentType === 'video' ? null : currentItem.contentType === 'image' ? (
                                <ImageCarousel images={currentItem.imageUrl?.split(',').map(url => url.trim()).filter(Boolean)} title={currentItem.title} />
                              ) : (
                                <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-gray-200 shadow-sm w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: currentItem.body?.replace(/<img /g, '<img loading="lazy" style="max-width: 100%; height: auto;" ') }} />
                              )}
                            </div>
                          ) : currentItem.itemType === 'assessment' ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                              <div className="bg-orange-50 border-b border-orange-200 p-5 flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Award size={20} /></div>
                                <div>
                                  <h4 className="font-bold text-gray-900">Interactive Assessment</h4>
                                  <p className="text-sm text-gray-500">Test your understanding before moving forward.</p>
                                </div>
                              </div>
                              <div className="p-5 md:p-8">
                                {currentItem.questions && currentItem.questions.length > 0 ? (
                                  submittedAssessments[currentItem._id] ? (
                                    <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center">
                                      <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                                      <h3 className="text-lg font-bold text-green-700 mb-1">Assessment Completed!</h3>
                                      <p className="text-gray-500 text-sm">You have successfully submitted your answers.</p>
                                    </div>
                                  ) : (
                                    <Assessment assessment={currentItem} onSubmit={() => handleSubmitAssessment()} />
                                  )
                                ) : currentItem.formUrl ? (
                                  <>
                                    <div className="w-full rounded-xl overflow-hidden border border-gray-200 mb-6 h-[600px] bg-white relative">
                                      <iframe 
                                        src={currentItem.formUrl.includes('docs.google.com/forms') ? `${currentItem.formUrl.split('?')[0]}?embedded=true` : currentItem.formUrl} 
                                        width="100%" 
                                        height="100%" 
                                        frameBorder="0"
                                        marginHeight="0"
                                        marginWidth="0"
                                        title="Assessment Form"
                                        className="absolute inset-0"
                                      >
                                        Loading...
                                      </iframe>
                                    </div>
                                    <div className="text-center">
                                      <button disabled={submittedAssessments[currentItem._id]} onClick={handleSubmitAssessment}
                                        className={`px-8 py-2.5 font-semibold rounded-lg transition-colors ${submittedAssessments[currentItem._id] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                                        {submittedAssessments[currentItem._id] ? 'Submitted' : 'Mark as Completed'}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl"><p className="text-gray-400 italic">Assessment not configured.</p></div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* AI Q&A */
                            <div className="max-w-2xl">
                              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mb-6 flex items-center gap-3">
                                <Bot className="text-emerald-600" />
                                <div><h4 className="font-bold text-gray-900">AI Q&A Challenge</h4><p className="text-sm text-gray-500">Test your knowledge!</p></div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-5">{currentItem.question}</h3>
                                {!aiEvaluation ? (
                                  <div className="space-y-4">
                                    <textarea value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} placeholder="Type your answer..." className="w-full p-4 rounded-lg border border-gray-300 focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] outline-none min-h-[120px] resize-y mb-0" disabled={isEvaluating} />
                                    <button disabled={!studentAnswer.trim() || isEvaluating} onClick={handleEvaluateAnswer} className="w-full py-3 bg-[#1a1a2e] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#2a2a4e] transition-colors flex justify-center items-center gap-2">
                                      {isEvaluating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bot size={18} />}
                                      {isEvaluating ? 'Evaluating...' : 'Submit for AI Grading'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className={`p-5 rounded-xl border ${aiEvaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <h4 className={`font-bold flex items-center gap-2 mb-3 ${aiEvaluation.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                      {aiEvaluation.isCorrect ? <><CheckCircle size={20}/> Correct!</> : <><X size={20}/> Incorrect</>}
                                    </h4>
                                    <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4 text-sm text-gray-700"><strong className="text-[#1a1a2e]">AI Feedback:</strong> {aiEvaluation.aiReason}</div>
                                    <div className="flex gap-3">
                                      {!aiEvaluation.isCorrect && <button onClick={() => setAiEvaluation(null)} className="flex-1 py-2.5 border border-[#1a1a2e] text-[#1a1a2e] font-semibold rounded-lg hover:bg-gray-50">Try Again</button>}
                                      <button onClick={() => handleNext()} className={`${!aiEvaluation.isCorrect ? 'flex-1' : 'w-full'} py-2.5 bg-[#1a1a2e] text-white font-semibold rounded-lg hover:bg-[#2a2a4e]`}>Continue</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Navigation - MS Learn Style */}
                          <div className="flex justify-between items-center mt-12 mb-8 pt-8 border-t border-gray-200 w-full">
                            <button onClick={handlePrev} disabled={activeDayIndex === 0 && activeItemIndex === 0}
                              className="flex items-center gap-2 px-6 py-3 rounded text-blue-600 font-semibold hover:bg-blue-50 hover:underline transition-all disabled:opacity-40 disabled:hover:no-underline disabled:hover:bg-transparent">
                              <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
                            </button>
                            <button id="btn-next" onClick={handleNext} disabled={isLockedByTime || (currentItem.itemType === 'assessment' && !submittedAssessments[currentItem._id])}
                              className={`flex items-center gap-2 px-8 py-3 rounded text-white font-semibold transition-all shadow-sm ${isLockedByTime || (currentItem.itemType === 'assessment' && !submittedAssessments[currentItem._id]) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'} ${showTutorial && tutorialStep === 4 ? 'relative z-[70] ring-4 ring-blue-500 shadow-2xl scale-110' : ''}`}>
                              {activeItemIndex === currentDay.items.length - 1 ? 'Finish Day' : 'Next'} <ChevronRight size={20} />
                            </button>
                          </div>
                        </>
                      ) : (<p className="text-gray-400">No content available.</p>)}
                    </div>
                </div>
              </div>
            </div>
            </div>
            {/* Persistent Chat - only show outside Discussion tab */}
            {activeTab !== 'discussion' && currentItem && currentItem.itemType === 'content' && (
              <AskDoubtChat token={token} currentContent={currentItem} />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><Lock size={32} /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Course Content</h3>
              <p className="text-gray-500">There is no content available for this domain yet.</p>
            </div>
          </div>
        )}
      </main>

      {recommendationInboxOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-[#1a1a2e] text-white flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Inbox size={18} /> Mentor Chat</h3>
              <button onClick={() => setRecommendationInboxOpen(false)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {recommendations.length === 0 ? (
                <p className="text-center text-gray-400 text-sm mt-10">No messages from your mentor yet.</p>
              ) : (
                recommendations.map((msg, idx) => {
                  const isStudent = msg.senderRole === 'Student';
                  return (
                    <div key={idx} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isStudent ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm' : 'bg-[#1a1a2e] text-white rounded-tl-sm'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[9px] block mt-1 ${isStudent ? 'text-gray-400' : 'text-white/60'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Reply to mentor..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:border-[#1a1a2e] outline-none"
                />
                <button type="submit" disabled={!replyText.trim()} className="bg-[#1a1a2e] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#2a2a4e]">
                  <Send size={16} className="ml-0.5" />
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
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in text-center relative z-[70] transition-all duration-500"
            style={Object.keys(tooltipStyle).length > 0 ? tooltipStyle : {}}
          >
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
            <div className="w-16 h-16 bg-[#1a1a2e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#1a1a2e] font-bold text-2xl">{tutorialStep}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tutorialContent[tutorialStep].title}</h3>
            <p className="text-gray-500 mb-8 text-lg">{tutorialContent[tutorialStep].text}</p>
            <div className="flex gap-4">
              <button onClick={skipTutorial} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                Skip
              </button>
              <button onClick={handleNextTutorial} className="flex-[2] py-3 bg-[#1a1a2e] text-white font-bold rounded-xl hover:bg-[#2a2a4e] transition-colors">
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

