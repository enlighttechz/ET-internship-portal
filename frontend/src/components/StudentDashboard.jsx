import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getIconComponent } from './DomainSelection';
import { CheckCircle, LogOut, X, Sparkles, MessageSquare, Send, Star, Award, FileText, Mail, Calendar, Lock, Unlock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const StudentDashboard = ({ token, student, setStudent, logout }) => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [courseRoadmap, setCourseRoadmap] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [domainData, setDomainData] = useState([]);
  const [registeredCourseDays, setRegisteredCourseDays] = useState({});
  const [improving, setImproving] = useState(false);
  const [improveReport, setImproveReport] = useState(null);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (showChat) {
      fetchChat();
      const interval = setInterval(fetchChat, 5000);
      return () => clearInterval(interval);
    }
  }, [showChat]);

  const fetchChat = async () => {
    try {
      if (!student) return;
      const res = await axios.get(`${API_URL}/recommendations/${student._id}`);
      setChatMessages(res.data);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    axios.get(`${API_URL}/courses`)
      .then(res => setDomainData(res.data.filter(c => c.hidden !== true && c.hidden !== 'true')))
      .catch(err => console.error(err));
  }, []);

  const submitFeedback = async () => {
    if (feedbackRating === 0 || !feedbackMsg.trim()) return alert("Please provide a rating and message.");
    try {
      await axios.post(`${API_URL}/feedbacks`, {
        domain: student?.domain,
        rating: feedbackRating,
        message: feedbackMsg
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedbackRating(0);
      setFeedbackMsg('');
    } catch(err) { console.error(err); }
  };

  const sendReply = async (msg) => {
    if (!msg.trim()) return;
    try {
      if (!student) return;
      const res = await axios.post(`${API_URL}/recommendations/${student._id}`, { message: msg, sender: 'student' }, { headers: { Authorization: `Bearer ${token}` } });
      setChatMessages(res.data);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedCourse) {
      setLoadingRoadmap(true);
      axios.get(`${API_URL}/course-days/${selectedCourse.title}`)
        .then(res => setCourseRoadmap(res.data.filter(d => !d.hidden)))
        .catch(err => console.error("Failed to load roadmap:", err))
        .finally(() => setLoadingRoadmap(false));
    } else {
      setCourseRoadmap([]);
    }
  }, [selectedCourse]);

  const registeredDomainIds = [student?.domain, ...(student?.additionalCourses?.map(c => c.domain) || [])].filter(Boolean);
  const registeredDomains = domainData.filter(d => registeredDomainIds.includes(d.title));
  const otherDomains = domainData.filter(d => !registeredDomainIds.includes(d.title));

  useEffect(() => {
    if (registeredDomains.length > 0) {
      registeredDomains.forEach(domain => {
        if (registeredCourseDays[domain.title] === undefined) {
          axios.get(`${API_URL}/course-days/${domain.title}`)
            .then(res => setRegisteredCourseDays(prev => ({...prev, [domain.title]: res.data.filter(d => !d.hidden).length})))
            .catch(err => console.error(err));
        }
      });
    }
  }, [domainData, registeredDomains]);

  const handleImproveYourself = async () => {
    setShowImproveModal(true);
    if (improveReport) return;
    setImproving(true);
    try {
      if (!student) return;
      const res = await axios.post(
        `${API_URL}/students/${student._id}/improve-yourself`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImproveReport(res.data.report);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to generate report');
      setShowImproveModal(false);
    } finally {
      setImproving(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    setEnrolling(true);
    try {
      const res = await axios.put(
        `${API_URL}/auth/profile`,
        { addDomain: selectedCourse.title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (setStudent) setStudent(res.data);
      setSelectedCourse(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest">
      <header className="bg-surface shadow-sm border-b border-outline-variant/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 drop-shadow-md" />
            <span className="font-headline-md text-xl font-bold text-primary">Enlight Techz</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{student.name}</p>
                <p className="text-[10px] text-text-dim">{student.internId}</p>
              </div>
            </div>
            <button onClick={() => setShowChat(true)} className="p-2 bg-surface-container hover:bg-outline-variant/30 text-primary border border-outline-variant/50 rounded-xl transition-colors shrink-0 flex items-center justify-center relative">
              <MessageSquare size={20} />
            </button>
            <button onClick={() => setShowFeedbackModal(true)} className="p-2 bg-surface-container hover:bg-outline-variant/30 text-yellow-500 border border-outline-variant/50 rounded-xl transition-colors shrink-0 flex items-center justify-center">
              <Star size={20} />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-error hover:bg-error/10 transition-colors border border-error/20"
            >
              <LogOut size={16} />
              <span className="text-sm font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-headline-xl font-bold text-text-primary mb-2">Welcome back, {student.name.split(' ')[0]}!</h1>
          <p className="text-lg text-text-dim">Your personalized learning dashboard. Resume your journey below.</p>
        </div>

        <section className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-headline-lg font-bold text-primary mb-6 flex items-center gap-2">
            <CheckCircle className="text-success" />
            My Registered Courses
          </h2>
          
          {registeredDomains.length > 0 ? (
            <div className="flex flex-col gap-4">
              {registeredDomains.map(domain => {
                const sData = student.domain === domain.title ? student : student.additionalCourses?.find(c => c.domain === domain.title);
                const totalDays = registeredCourseDays[domain.title] || 1;
                const progressVal = sData?.learningProgress || 0;
                const isCompleted = progressVal >= totalDays;
                const progressPercent = Math.min(100, Math.round((progressVal / totalDays) * 100));
                
                const radius = 24;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

                return (
                  <div key={domain._id} className="glass-card rounded-2xl p-4 md:p-5 border-2 border-outline-variant/30 bg-white shadow-md w-full flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 relative">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-container-highest" />
                          <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-primary transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-primary">
                          {progressPercent}%
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{domain.title}</h3>
                        <p className="text-xs text-text-dim">Day {progressVal} of {totalDays} completed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
                      <button 
                        onClick={() => navigate('/course', { state: { activeDomain: domain.title } })}
                        className={`flex-1 md:flex-none font-bold py-2.5 px-8 rounded-xl shadow-md transition-all whitespace-nowrap ${isCompleted ? 'bg-error hover:bg-error/90 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        {isCompleted ? 'Completed' : progressVal === 0 ? 'Start Learning' : 'Continue Learning'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 text-center">
              <p className="text-text-dim mb-4">You have not registered for any domain yet.</p>
              <button 
                onClick={() => navigate('/domain-selection')}
                className="bg-primary text-white font-bold py-2 px-6 rounded-full"
              >
                Choose Domain
              </button>
            </div>
          )}
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-headline-lg font-bold text-secondary mb-6">Explore Other Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherDomains.map(domain => (
              <div 
                key={domain._id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-outline-variant/20 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={domain.imageUrl || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&q=80`} 
                    alt={domain.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 border border-red-600">
                    {domain.duration}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg leading-tight">{domain.title}</h3>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <p className="text-text-dim text-sm leading-relaxed mb-5 flex-grow line-clamp-3">{domain.description}</p>
                  <button 
                    onClick={() => setSelectedCourse(domain)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-red-600 text-red-600 hover:text-white hover:bg-red-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 animate-slide-up relative">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 p-2 text-text-dim hover:text-text-primary hover:bg-surface-container rounded-full transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="max-h-[90vh] overflow-y-auto w-full flex flex-col">
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img 
                    src={selectedCourse.imageUrl || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&q=80`} 
                    alt={selectedCourse.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <h2 className="text-2xl font-headline-lg font-bold text-white drop-shadow-lg">{selectedCourse.title}</h2>
                    <span className="text-white/80 text-sm">{selectedCourse.duration}</span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-text-dim text-base mb-6 leading-relaxed text-left">{selectedCourse.description}</p>
                
                <div className="w-full bg-surface-container-lowest rounded-xl p-5 mb-6 border border-outline-variant/20">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-text-dim">Duration:</span>
                    <span className="font-bold text-lg text-text-primary">{selectedCourse.duration}</span>
                  </div>
                </div>

                <div className="w-full text-left mb-8 max-h-[35vh] overflow-y-auto pr-2 border-l-2 border-primary/20 pl-4 custom-scrollbar">
                  <h3 className="font-bold text-lg mb-3 sticky top-0 bg-surface z-10 py-1 text-primary">Course Modules</h3>
                  {loadingRoadmap ? (
                    <p className="text-text-dim text-sm italic">Loading syllabus...</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="bg-surface-container-lowest p-3 rounded-lg border border-primary/30 flex justify-between items-center shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-primary mr-2 uppercase">Day 1</span>
                          <span className="font-medium text-sm text-text-primary">Introduction to {selectedCourse.title}</span>
                        </div>
                        <Unlock size={16} className="text-primary" />
                      </div>
                      
                      {courseRoadmap.length > 0 ? (
                        courseRoadmap.map((item, idx) => (
                          <div key={item._id} className="bg-surface-container-highest p-3 rounded-lg border border-outline-variant/30 flex justify-between items-center opacity-70">
                            <div>
                              <span className="text-xs font-bold text-text-dim mr-2 uppercase">Day {idx + 2}</span>
                              <span className="font-medium text-sm text-text-dim">{item.title.replace(/^Day\s*\d+[\s:]*/i, '')}</span>
                            </div>
                            <Lock size={16} className="text-text-dim" />
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center border-2 border-dashed border-outline-variant/50 rounded-lg">
                          <p className="text-text-dim text-xs italic">Upcoming modules are being scheduled.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full">
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">Attendance Report</h4>
                      <p className="text-[10px] text-text-dim leading-tight">Daily tracking of your learning progress.</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
                    <div className="p-2 bg-success/10 text-success rounded-lg shrink-0">
                      <Award size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">Certificate of Completion</h4>
                      <p className="text-[10px] text-text-dim leading-tight">Earned upon passing final assessments.</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">Performance Report</h4>
                      <p className="text-[10px] text-text-dim leading-tight">Detailed analytics of your learning journey.</p>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-green-50 rounded-xl p-4 mb-6 border border-green-200 flex justify-between items-center">
                  <span className="text-lg font-bold text-text-primary">Total Course Fee:</span>
                  <span className="font-bold text-3xl text-green-600">{selectedCourse.fee}</span>
                </div>

                <div className="flex gap-4 w-full mt-auto">
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-text-primary border border-outline hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
                      enrolling ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5'
                    }`}
                  >
                    {enrolling ? 'Enrolling...' : 'Add Course'}
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showImproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-outline-variant/30 animate-slide-up relative flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="text-accent" /> AI Performance Analysis
                </h3>
                <button onClick={() => setShowImproveModal(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-text-dim">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-surface/50 prose prose-sm max-w-none text-text-primary">
                {improving ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                    <p className="text-text-dim font-bold animate-pulse">Gemini is analyzing your progress...</p>
                  </div>
                ) : improveReport ? (
                  <ReactMarkdown>{improveReport}</ReactMarkdown>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-surface w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col animate-slide-up overflow-hidden">
              <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
                <h3 className="font-bold flex items-center gap-2"><MessageSquare size={20}/> Personal Mentor Inbox</h3>
                <button onClick={() => setShowChat(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.sender === 'student' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 border border-gray-300 rounded-tl-sm font-medium'}`}>
                      {m.message}
                    </div>
                    <span className="text-[10px] text-text-dim mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && <p className="text-center text-text-dim mt-10">Send a message to your mentor.</p>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-outline-variant/30 bg-surface shrink-0">
                <div className="flex gap-2">
                  <input type="text" id="chatInput" placeholder="Reply to your mentor..." className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none text-sm" onKeyDown={(e) => {
                    if (e.key === 'Enter') { sendReply(e.target.value); e.target.value = ''; }
                  }} />
                  <button onClick={() => {
                    const input = document.getElementById('chatInput');
                    sendReply(input.value);
                    input.value = '';
                  }} className="bg-success text-white p-3 rounded-xl hover:bg-[#15803d] shadow-sm flex items-center justify-center">
                    <Send size={18}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-surface w-full max-w-md p-6 rounded-3xl shadow-2xl border border-outline-variant/30 animate-fade-in relative">
              <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-text-dim hover:text-error"><X size={24}/></button>
              <h3 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2"><Star size={24} className="text-yellow-500" /> Course Feedback</h3>
              <p className="text-text-dim text-sm mb-6">How was your learning experience in {student.domain}?</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setFeedbackRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                    <Star size={36} className={feedbackRating >= star ? 'fill-yellow-500 text-yellow-500' : 'text-outline-variant'} />
                  </button>
                ))}
              </div>

              <textarea 
                placeholder="What did you like? What can we improve?" 
                value={feedbackMsg} 
                onChange={e => setFeedbackMsg(e.target.value)} 
                className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none min-h-[100px] text-sm mb-4"
              />
              
              <button onClick={submitFeedback} className="w-full bg-success text-white py-3 rounded-xl font-bold hover:bg-[#15803d] shadow-md transition-colors">
                Submit Feedback
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
