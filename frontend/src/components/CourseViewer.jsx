import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCircle, Clock, Upload, Video, FileText, Award, ChevronLeft, ChevronRight, Menu, X, PlayCircle, Home } from 'lucide-react';
import AskDoubtChat from './AskDoubtChat';
import Certificates from './Certificates';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CourseViewer = ({ token, student: initialStudent, logout }) => {
  const [student, setStudent] = useState(initialStudent);
  const [notifications, setNotifications] = useState([]);
  const [contents, setContents] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const navigate = useNavigate();
  
  const [profileForm, setProfileForm] = useState({ name: initialStudent?.name || '', contact: initialStudent?.contact || '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [weekendLink, setWeekendLink] = useState('');
  const [finalLink, setFinalLink] = useState('');
  const [answers, setAnswers] = useState([]); 

  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768); // For mobile

  useEffect(() => {
    if (initialStudent) {
      setStudent(initialStudent);
      setProfileForm({ name: initialStudent.name || '', contact: initialStudent.contact || '' });
      setWeekendLink(initialStudent.weekendProjectLink || '');
      setFinalLink(initialStudent.finalProjectLink || '');
      setActiveContentIndex(initialStudent.learningProgress || 0);
    }
  }, [initialStudent]);

  const fetchNotifications = useCallback(async () => {
    if(!student) return;
    const res = await axios.get(`${API_URL}/notifications?domain=${student.domain}`);
    setNotifications(res.data);
  }, [student]);

  const fetchContents = useCallback(async () => {
    if (!student) return;
    const res = await axios.get(`${API_URL}/contents?domain=${student.domain}`);
    setContents(res.data);
  }, [student]);

  const fetchAssessment = useCallback(async () => {
    if (!student) return;
    try {
      const res = await axios.get(`${API_URL}/assessments/${student.domain}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssessment(res.data);
      if(res.data) setAnswers(new Array(res.data.questions.length).fill(null));
    } catch (err) {
      console.error(err);
    }
  }, [student, token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, profileForm, { headers: { Authorization: `Bearer ${token}` } });
      setStudent(res.data);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if(student) {
      fetchNotifications();
      fetchContents();
      fetchAssessment();
    }
  }, [student, fetchNotifications, fetchContents, fetchAssessment]);

  const submitProject = async (type) => {
    if (!student) return;
    try {
      const updateData = type === 'weekend' 
        ? { weekendProjectLink: weekendLink, weekendProjectStatus: 'Submitted' }
        : { finalProjectLink: finalLink, finalProjectStatus: 'Submitted' };
        
      const res = await axios.put(`${API_URL}/students/${student._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudent(res.data);
      alert('Project submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit project');
    }
  };

  const completeCurrentContent = async () => {
    if (activeContentIndex === student.learningProgress) {
      try {
        const newProgress = student.learningProgress + 1;
        const newAttendance = contents.length > 0 
          ? Math.min(100, Math.round((newProgress / contents.length) * 100))
          : student.attendance;

        const res = await axios.put(`${API_URL}/students/${student._id}`, {
          learningProgress: newProgress,
          attendance: newAttendance
        }, { headers: { Authorization: `Bearer ${token}` } });
        setStudent(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    setActiveContentIndex(prev => prev + 1);
  };

  const submitAssessment = async () => {
    if (answers.includes(null)) {
      return alert("Please answer all questions before submitting.");
    }
    try {
      const res = await axios.post(`${API_URL}/assessments/${student.domain}/submit`, {
        answers
      }, { headers: { Authorization: `Bearer ${token}` } });
      setStudent(res.data.student);
      alert(`Assessment submitted! Your score is ${res.data.score}%`);
    } catch (err) {
      console.error(err);
      alert("Error submitting assessment.");
    }
  };

  const handleAnswerSelect = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  if (!student) return <div className="p-10 text-center">Loading...</div>;

  const currentContent = contents[activeContentIndex];
  const isAssessmentStage = activeContentIndex >= contents.length && contents.length > 0;
  
  // Calculate attendance circle dash offset
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (student.attendance / 100) * circumference;

  const groupedContents = contents.reduce((acc, c, idx) => {
    const cat = c.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...c, originalIndex: idx });
    return acc;
  }, {});

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
        <div className="flex flex-col items-center animate-slide-up">
          <div className="w-32 h-32 bg-primary/5 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10 mb-6 p-4">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-full h-full object-contain animate-pulse" loading="lazy" />
          </div>
          <h1 className="font-headline-lg text-4xl font-bold text-primary tracking-tight mb-2">Enlight Techz</h1>
          <p className="font-label-md text-text-dim uppercase tracking-widest text-sm">Loading Dashboard...</p>
          
          <div className="mt-12 flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md flex flex-col md:flex-row h-screen relative">
      
      {/* Mobile Top Navigation */}
      <header className="w-full z-30 bg-surface border-b border-outline-variant/30 shadow-sm md:hidden flex-none sticky top-0">
        <div className="flex items-center justify-between px-4 h-16 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer min-w-0 overflow-hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="text-primary shrink-0" size={24} />
            <span className="font-headline-md text-lg font-bold text-primary truncate">{student?.domain || 'Course Menu'}</span>
          </div>
          <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 object-contain shrink-0 ml-4 drop-shadow-md" loading="lazy" />
        </div>
      </header>

      {/* Left Navigation Drawer */}
      <nav className={`fixed md:sticky inset-y-0 left-0 md:top-0 h-full w-[250px] bg-surface-alt/95 md:bg-surface-alt/60 backdrop-blur-xl border-r border-outline-variant/20 shadow-md flex flex-col gap-4 p-4 md:p-6 z-50 md:z-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex-shrink-0 overflow-y-auto`}>
        {/* Drawer Header (Logo & Close Button) */}
        <div className="flex items-center justify-between px-2 mt-2">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" loading="lazy" />
            <span className="font-headline-md text-lg md:text-headline-md text-primary font-bold">Enlight Techz</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 -mr-2 text-text-dim hover:text-primary">
            <X size={24} />
          </button>
        </div>

        <div className="mb-2">
          <div 
            onClick={() => { navigate('/dashboard'); if (window.innerWidth < 768) setSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors bg-surface-container-lowest/50 border-outline-variant/10 hover:bg-surface-container-low"
          >
            <Home size={20} className="text-primary" />
            <span className="font-label-md text-sm font-bold text-primary">Back to Dashboard</span>
          </div>
        </div>

        {/* Profile Header */}
        <div 
          onClick={() => { setActiveContentIndex('profile'); if (window.innerWidth < 768) setSidebarOpen(false); }}
          className={`flex items-center justify-between gap-2 mb-6 p-4 rounded-xl border cursor-pointer transition-colors ${activeContentIndex === 'profile' ? 'bg-primary/10 border-primary' : 'bg-surface-container-lowest/50 border-outline-variant/10 hover:bg-surface-container-low'}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-full border-2 border-primary bg-primary text-white flex items-center justify-center text-lg font-bold">
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0">
              <h3 className="font-label-md text-sm font-bold text-on-surface truncate">{student.name}</h3>
              <p className="font-body-md text-[10px] text-text-dim truncate">{student.domain}</p>
              <p className="font-body-md text-[10px] text-primary font-bold mt-0.5">{student.internId}</p>
            </div>
          </div>
        </div>

        {/* Certificates Link */}
        <div className="mb-6">
          <div 
            onClick={() => { setActiveContentIndex('certificates'); if (window.innerWidth < 768) setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${activeContentIndex === 'certificates' ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent hover:bg-surface-container-low'}`}
          >
            <Award size={20} className={activeContentIndex === 'certificates' ? 'text-primary' : 'text-text-dim'} />
            <span className={`font-label-md text-sm ${activeContentIndex === 'certificates' ? 'font-bold text-primary' : 'font-medium text-text-primary'}`}>My Certificates</span>
          </div>
        </div>

        {/* Dynamic Module Links */}
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
          <h4 className="text-xs uppercase text-text-dim font-bold mb-2 tracking-wider pl-2">Course Modules</h4>
          
          {Object.entries(groupedContents).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h5 className="text-xs uppercase text-text-primary font-bold mb-2 tracking-wider pl-2 bg-surface-container py-2 rounded-md">{category}</h5>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const isActive = activeContentIndex === item.originalIndex;
                  const isCompleted = item.originalIndex < student.learningProgress;
                  return (
                    <button 
                      key={item._id} 
                      onClick={() => {
                        if (item.originalIndex <= student.learningProgress) {
                          setActiveContentIndex(item.originalIndex);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }
                        else alert("Please complete the previous modules first!");
                      }}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg font-label-md text-sm transition-all text-left ${isActive ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-secondary-fixed/30'}`}
                    >
                      {isCompleted ? <CheckCircle size={16} className="text-success min-w-[16px]" /> : <PlayCircle size={16} className="opacity-50 min-w-[16px]" />}
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {contents.length > 0 && (
            <button 
              onClick={() => {
                if (student.learningProgress >= contents.length) {
                  setActiveContentIndex(contents.length);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 mt-4 rounded-lg font-label-md text-sm transition-all text-left border-t border-outline-variant/20 ${isAssessmentStage ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-secondary-fixed/30'}`}
            >
              <Award size={16} className={student.assessmentScore !== null ? "text-success min-w-[16px]" : "min-w-[16px]"} />
              <span className="truncate">Final Assessment</span>
            </button>
          )}

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 mt-auto rounded-lg font-label-md text-sm transition-all text-left text-error hover:bg-error/10 border border-error/20"
          >
            <span className="truncate font-bold">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-8 py-8 min-w-0 bg-background">
        
        {/* Hero Welcome Section */}
        <section className="mb-10">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-outline-variant/20">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-secondary/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <h1 className="font-headline-xl text-headline-xl text-text-primary mb-2">Hello, {student.name.split(' ')[0]}!</h1>
              <p className="font-body-lg text-body-lg text-text-dim max-w-2xl">Welcome back to your {student.domain} journey. You're making great progress. Let's keep the momentum going.</p>
            </div>
          </div>
        </section>

        {/* Content Viewer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-10">
          
          <div className="glass-card rounded-2xl p-6 md:p-10 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 w-full relative overflow-hidden">
            
            {activeContentIndex === 'profile' ? (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wider mb-4">
                    MY PROFILE
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Edit Profile Settings</h2>
                  <p className="font-body-md text-text-dim mb-6">Update your personal information. Your email address cannot be changed.</p>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Intern ID</label>
                    <input 
                      type="text" 
                      value={student.internId || 'Pending'} 
                      className="w-full px-4 py-2 mb-4 rounded-lg border border-outline-variant/50 bg-surface-container/50 text-text-dim cursor-not-allowed font-code font-bold tracking-wider"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={student.email} 
                      className="w-full px-4 py-2 rounded-lg border border-outline-variant/50 bg-surface-container/50 text-text-dim cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Contact Details (Phone / Address)</label>
                    <input 
                      type="text" 
                      value={profileForm.contact} 
                      onChange={e => setProfileForm({...profileForm, contact: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={isUpdatingProfile} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-container transition-colors disabled:opacity-50">
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : activeContentIndex === 'certificates' ? (
              <div className="py-2">
                <Certificates />
              </div>
            ) : contents.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">No content yet!</h2>
                <p className="text-text-dim">Check back later once admins add modules to your domain.</p>
              </div>
            ) : !isAssessmentStage && currentContent ? (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-xs uppercase tracking-wider">Module {activeContentIndex + 1} of {contents.length}</div>
                </div>
                
                <h2 className="font-headline-lg text-headline-lg text-text-primary mb-6">{currentContent.title}</h2>
                
                {currentContent.type === 'video' ? (
                  <div className="mb-8 p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Video size={24} className="text-primary" />
                      <h3 className="font-bold text-lg">Video Lesson</h3>
                    </div>
                    <a href={currentContent.videoUrl} target="_blank" rel="noreferrer" className="bg-primary text-white font-label-md px-6 py-3 rounded-full hover:scale-105 transition-transform duration-200 shadow-md inline-flex items-center gap-2">
                      <PlayCircle size={18} /> Watch on Platform
                    </a>
                  </div>
                ) : (
                  <div className="prose max-w-none text-text-primary font-body-md text-lg leading-relaxed mb-8">
                    {currentContent.body.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                )}
                
                <div className="mt-10 pt-6 border-t border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
                  <button 
                    disabled={activeContentIndex === 0} 
                    onClick={() => setActiveContentIndex(prev => prev - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  
                  <button 
                    onClick={completeCurrentContent}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary-container shadow-md transition-all font-bold hover:scale-105"
                  >
                    {activeContentIndex === student.learningProgress ? 'Mark Complete & Next' : 'Next'} <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : isAssessmentStage ? (
              <div className="py-10">
                <div className="text-center mb-10">
                  <Award size={80} className="text-accent mx-auto mb-6 text-secondary" />
                  <h1 className="font-headline-xl text-4xl font-bold mb-4">Final Assessment</h1>
                  <p className="text-text-dim text-lg">Test your knowledge on everything you've learned in {student.domain}.</p>
                </div>
                
                {student.assessmentScore === null ? (
                  <div className="max-w-3xl mx-auto">
                    {!assessment || assessment.questions.length === 0 ? (
                      <p className="text-center text-text-dim p-8 bg-surface-container rounded-xl">No assessment questions available yet.</p>
                    ) : (
                      <>
                        {assessment.questions.map((q, qIndex) => (
                          <div key={qIndex} className="mb-8 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm">
                            <p className="font-bold text-lg mb-4">{qIndex + 1}. {q.questionText}</p>
                            <div className="flex flex-col gap-3">
                              {q.options.map((opt, optIndex) => (
                                <label 
                                  key={optIndex} 
                                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer border transition-all ${answers[qIndex] === optIndex ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm' : 'bg-surface border-transparent hover:border-outline-variant/50'}`}
                                >
                                  <input 
                                    type="radio" 
                                    name={`question-${qIndex}`} 
                                    checked={answers[qIndex] === optIndex} 
                                    onChange={() => handleAnswerSelect(qIndex, optIndex)} 
                                    className="w-4 h-4 text-primary bg-background border-outline-variant focus:ring-primary focus:ring-2"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={submitAssessment} 
                          className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-primary-container transition-all hover:scale-[1.02]"
                        >
                          Submit Assessment
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-2xl p-10 text-center shadow-lg">
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Assessment Score</h3>
                    <div className="text-7xl font-extrabold text-green-600 my-6">{student.assessmentScore}%</div>
                    <p className="text-green-700 font-medium">You have successfully completed this course evaluation!</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Right Utility Sidebar */}
      <aside className="hidden lg:flex w-[320px] flex-shrink-0 bg-surface-alt/40 backdrop-blur-lg border-l border-outline-variant/20 shadow-sm flex-col gap-4 p-6 md:sticky md:top-0 h-screen overflow-y-auto">
        <h2 className="font-headline-md text-headline-md text-secondary mb-2">My Progress</h2>
        
        {/* Attendance Progress Ring */}
        <div className="glass-card rounded-xl p-5 mb-4 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <h3 className="font-label-md text-label-md font-bold text-text-primary mb-4 flex items-center gap-2 relative z-10">
            <Clock size={18} className="text-secondary" />
            Attendance
          </h3>
          <div className="flex justify-center items-center relative z-10">
            <svg className="w-32 h-32" viewBox="0 0 120 120">
              <circle cx="60" cy="60" fill="none" r={radius} stroke="#e0e2ec" strokeWidth="8"></circle>
              <circle 
                className="progress-ring__circle" 
                cx="60" cy="60" fill="none" r={radius} 
                stroke="#005baf" 
                strokeDasharray={circumference} 
                strokeDashoffset={dashoffset} 
                strokeLinecap="round" strokeWidth="8">
              </circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline-lg text-3xl font-bold text-primary">{student.attendance}%</span>
              <span className="font-label-md text-xs text-text-dim font-bold">Present</span>
            </div>
          </div>
          <p className="text-center font-body-md text-xs text-text-dim mt-4 relative z-10">Keep up your attendance to unlock projects.</p>
        </div>

        {/* Projects Section - Hidden until admin adds project assignment functionality */}
        {false && (
          <div className="glass-card rounded-xl p-5 mb-4 border border-outline-variant/20">
            <h3 className="font-label-md text-label-md font-bold text-text-primary mb-4 flex items-center gap-2">
              <Upload size={18} className="text-primary" />
              Projects
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">Mini Project</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${student.weekendProjectStatus === 'Evaluated' ? 'bg-green-100 text-green-700' : student.weekendProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {student.weekendProjectStatus}
                </span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="GitHub/Drive Link..." 
                  value={weekendLink} 
                  onChange={(e) => setWeekendLink(e.target.value)}
                  disabled={student.weekendProjectStatus === 'Evaluated'}
                  className="w-full text-sm p-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                />
                <button 
                  onClick={() => submitProject('weekend')}
                  disabled={student.weekendProjectStatus === 'Evaluated'}
                  className="bg-primary text-white p-2 rounded-lg hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>

            <div className={`pt-4 border-t border-outline-variant/30 ${student.attendance < 80 ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold flex items-center gap-1"><Award size={14} className="text-secondary"/> Final Project</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${student.finalProjectStatus === 'Evaluated' ? 'bg-green-100 text-green-700' : student.finalProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {student.finalProjectStatus}
                </span>
              </div>
              {student.attendance < 80 ? (
                <p className="text-xs text-text-dim">80% attendance required to unlock.</p>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Deployment Link..." 
                    value={finalLink} 
                    onChange={(e) => setFinalLink(e.target.value)}
                    disabled={student.finalProjectStatus === 'Evaluated'}
                    className="w-full text-sm p-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                  />
                  <button 
                    onClick={() => submitProject('final')}
                    disabled={student.finalProjectStatus === 'Evaluated'}
                    className="bg-secondary text-white p-2 rounded-lg hover:bg-secondary-container disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Upload size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Feed */}
        <div className="flex-grow flex flex-col min-h-0">
          <h3 className="font-label-md text-label-md font-bold text-text-primary mb-4 flex items-center gap-2">
            <Bell size={18} className="text-secondary" />
            Announcements
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 pb-10">
            {notifications.length === 0 ? (
              <p className="text-sm text-text-dim text-center py-4">No new announcements.</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif._id} className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant/30 hover:border-secondary/50 transition-colors shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-label-md text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase tracking-wider">{notif.type}</span>
                    <span className="font-label-md text-[10px] text-text-dim">{new Date(notif.date).toLocaleDateString()}</span>
                  </div>
                  <p className="font-body-md text-sm text-text-dim">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
      
      {/* Gemini Ask Doubt Chatbot */}
      {typeof activeContentIndex === 'number' && (
        <AskDoubtChat token={token} currentContent={currentContent} />
      )}
    </div>
  );
};

export default CourseViewer;
