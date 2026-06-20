import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCircle, Clock, Video, FileText, Award, ChevronLeft, ChevronRight, Menu, X, PlayCircle, Home, Inbox, MessageSquare, Send, Lock } from 'lucide-react';
import AskDoubtChat from './AskDoubtChat';
import Assessment from './Assessment';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CourseViewer = ({ token, student: initialStudent, logout }) => {
  const [student, setStudent] = useState(initialStudent);
  const [courseDays, setCourseDays] = useState([]);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
  const hasInternshipStarted = parsedStartDate ? parsedStartDate <= new Date() : true;

  // Navigation state
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [recommendationInboxOpen, setRecommendationInboxOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (initialStudent) {
      setStudent(initialStudent);
      const progress = courseData?.learningProgress || 1; // 1-indexed days
      setActiveDayIndex(Math.max(0, progress - 1));
      setActiveItemIndex(0); // Start at first item of the day
    }
  }, [initialStudent, courseData?.learningProgress]);

  const fetchData = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [daysRes, recRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/course-days/${activeDomain}`),
        axios.get(`${API_URL}/recommendations/${student._id}`),
        axios.get(`${API_URL}/courses`)
      ]);
      setCourseDays(daysRes.data.filter(d => !d.hidden).sort((a,b) => a.dayNumber - b.dayNumber));
      setRecommendations(recRes.data.messages || []);
      setCourseDetails(coursesRes.data.find(c => c.title === activeDomain));
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

  // Handle time tracking
  useEffect(() => {
    if (courseDays.length === 0 || !student) return;
    
    const currentDay = courseDays[activeDayIndex];
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

  const handleNext = async () => {
    const currentDay = courseDays[activeDayIndex];
    if (activeItemIndex < currentDay.items.length - 1) {
      setActiveItemIndex(prev => prev + 1);
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
          alert("Congratulations! You have completed all days for this course.");
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const currentDay = courseDays[activeDayIndex];
  const currentItem = currentDay?.items[activeItemIndex];
  
  // Calculate unread recommendations
  const unreadCount = recommendations.filter(m => m.senderRole === 'Admin' && !m.isRead).length;

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
              const isLocked = day.dayNumber > (courseData?.learningProgress || 1);
              const isCompleted = day.dayNumber < (courseData?.learningProgress || 1);
              const isActive = activeDayIndex === idx;
              return (
                <button 
                  key={day._id}
                  onClick={() => {
                    if (!isLocked && !isCompleted) {
                      setActiveDayIndex(idx);
                      setActiveItemIndex(0);
                      if(window.innerWidth < 768) setSidebarOpen(false);
                    }
                  }}
                  disabled={isLocked || isCompleted}
                  className={`w-full flex flex-col text-left p-3 rounded-xl mb-2 transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : isLocked || isCompleted ? 'opacity-50 cursor-not-allowed text-text-dim bg-surface-container-highest/20 pointer-events-none' : 'bg-surface-container hover:bg-surface-container-high text-text-primary'}`}
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
        
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between p-5 bg-surface border-b border-outline-variant/30 z-40 shrink-0">
          <h1 className="font-headline-md text-2xl font-bold text-primary">{activeDomain}</h1>
          {courseDetails?.startDate && (
             <div className="flex items-center gap-2 text-sm font-bold text-text-dim bg-surface-container px-4 py-2 rounded-xl">
               <Clock size={16} /> Internship Starts: {courseDetails.startDate}
             </div>
          )}
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-outline-variant/30 z-40 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="shrink-0"><Menu size={24} className="text-primary" /></button>
            <h1 className="font-bold text-primary truncate flex-1">{activeDomain}</h1>
          </div>
          {courseDetails?.startDate && (
             <div className="text-[10px] font-bold text-text-dim bg-surface-container px-2 py-1 rounded whitespace-nowrap shrink-0 ml-2">
               Starts: {courseDetails.startDate}
             </div>
          )}
        </header>

        {!hasInternshipStarted ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 custom-scrollbar">
             <div className="max-w-3xl mx-auto w-full my-auto glass-card bg-white p-10 md:p-16 rounded-3xl shadow-xl border border-outline-variant/30 text-center relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                  <Clock size={48} />
                </div>
                <h3 className="text-3xl md:text-4xl font-headline-md font-bold text-text-primary mb-6">Internship Commencing Soon</h3>
                <p className="text-text-dim text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                  This internship will be starting from 
                  <span className="font-extrabold text-primary text-2xl block mt-4 bg-primary/5 py-3 px-6 rounded-2xl border border-primary/20 inline-block">{courseDetails?.startDate}</span>
                </p>
                <button onClick={() => navigate('/dashboard')} className="mt-10 px-8 py-3 bg-surface-container hover:bg-outline-variant/50 text-text-primary font-bold rounded-xl transition-colors shadow-sm">
                  Return to Dashboard
                </button>
             </div>
          </div>
        ) : currentDay ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Horizontal Day Tracker */}
            <div className="bg-surface shadow-sm border-b border-outline-variant/30 px-4 md:px-8 py-4 z-10 flex-none">
              <h2 className="font-bold text-xl md:text-2xl mb-4 text-on-surface flex items-center gap-3">
                <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">Day {currentDay.dayNumber}</span>
                {currentDay.title}
              </h2>
              
              {/* Progress Nodes */}
              <div className="flex items-center w-full relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-outline-variant/50 -translate-y-1/2 z-0"></div>
                <div className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(activeItemIndex / (Math.max(1, currentDay.items.length - 1))) * 100}%` }}></div>
                
                <div className="flex justify-between w-full relative z-10">
                  {currentDay.items.map((item, idx) => {
                    const isPassed = activeItemIndex > idx;
                    const isCurrent = activeItemIndex === idx;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setActiveItemIndex(idx)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shadow-sm
                          ${isPassed ? 'bg-primary border-primary text-white' : isCurrent ? 'bg-white border-primary text-primary ring-4 ring-primary/20 scale-110' : 'bg-surface-container border-outline-variant text-text-dim'}
                        `}
                        title={item.title}
                      >
                        {item.itemType === 'assessment' ? <Award size={14} /> : item.contentType === 'video' ? <Video size={14} /> : <FileText size={14} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
              <div className="max-w-4xl mx-auto pb-20">
                {currentItem ? (
                  <div className="glass-card bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-outline-variant/30 animate-fade-in relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    
                    <h3 className="text-3xl font-bold text-text-primary mb-8">{currentItem.title}</h3>
                    
                    {currentItem.itemType === 'content' ? (
                      <div className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-secondary">
                        {currentItem.contentType === 'video' ? (
                           <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20 mb-8 bg-black">
                             <iframe src={currentItem.videoUrl} className="w-full h-full" allowFullScreen></iframe>
                           </div>
                        ) : currentItem.contentType === 'image' ? (
                           <img src={currentItem.imageUrl} alt={currentItem.title} className="w-full rounded-2xl shadow-lg border border-outline-variant/20 mb-8" />
                        ) : (
                           <div dangerouslySetInnerHTML={{ __html: currentItem.body }} />
                        )}
                      </div>
                    ) : (
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
                          <button onClick={() => handleNext()} className="px-8 py-3 bg-success text-white font-bold rounded-xl shadow-md hover:bg-success/90 transition-colors">
                            Mark Assessment as Completed
                          </button>
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
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-container hover:scale-105 transition-all"
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
            <div className="p-4 border-b border-outline-variant/30 bg-accent/10 flex items-center justify-between">
              <h3 className="font-bold text-accent flex items-center gap-2"><Inbox /> Admin Recommendations</h3>
              <button onClick={() => setRecommendationInboxOpen(false)} className="text-accent/70 hover:text-accent"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-center text-text-dim text-sm mt-10">No messages from the admin yet.</p>
              ) : (
                recommendations.map((msg, idx) => {
                  const isStudent = msg.senderRole === 'Student';
                  return (
                    <div key={idx} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${isStudent ? 'bg-surface-container-highest rounded-tr-sm' : 'bg-accent text-white rounded-tl-sm'}`}>
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
                  placeholder="Reply to admin..."
                  className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                <button type="submit" disabled={!replyText.trim()} className="bg-accent text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-accent/90 transition-colors">
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseViewer;
