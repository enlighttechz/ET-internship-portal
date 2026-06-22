import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Monitor, Smartphone, Cpu, Server, Bot, Code, Database, Shield, Award, FileText, CalendarCheck, ArrowLeft } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

export const getIconComponent = (iconName, className) => {
  switch(iconName) {
    case 'Monitor': return <Monitor size={32} className={className} />;
    case 'Smartphone': return <Smartphone size={32} className={className} />;
    case 'Cpu': return <Cpu size={32} className={className} />;
    case 'Server': return <Server size={32} className={className} />;
    case 'Bot': return <Bot size={32} className={className} />;
    case 'Code': return <Code size={32} className={className} />;
    case 'Database': return <Database size={32} className={className} />;
    case 'Shield': return <Shield size={32} className={className} />;
    default: return <Monitor size={32} className={className} />;
  }
};

const DomainSelection = ({ token, student, setStudent, logout }) => {
  const [domainData, setDomainData] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [courseRoadmap, setCourseRoadmap] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/courses`)
      .then(res => setDomainData(res.data.filter(c => !c.hidden)))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (detailCourse) {
      setLoadingRoadmap(true);
      axios.get(`${API_URL}/course-days/${encodeURIComponent(detailCourse.title)}`)
        .then(res => setCourseRoadmap(res.data.filter(d => !d.hidden)))
        .catch(err => console.error(err))
        .finally(() => setLoadingRoadmap(false));
    } else {
      setCourseRoadmap([]);
    }
  }, [detailCourse]);

  const handleSelect = async () => {
    if (!selectedDomain) return alert('Please select a domain to continue.');
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/auth/profile`,
        { domain: selectedDomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (setStudent) {
        setStudent(res.data);
      }
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update domain');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest py-12 px-4 sm:px-6 lg:px-8 relative">
      {logout && (
        <button 
          onClick={() => {
            logout();
            setTimeout(() => navigate(-1), 50);
          }} 
          className="absolute top-6 left-6 p-2 bg-white/60 backdrop-blur-md hover:bg-white rounded-full shadow-sm border border-outline-variant/30 text-text-dim hover:text-primary transition-all flex items-center justify-center z-10 group"
          title="Go Back"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      )}
      <div className="max-w-7xl mx-auto animate-slide-up">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline-lg font-bold text-primary mb-4 tracking-tight">Choose Your Internship Domain</h1>
          <p className="text-lg text-text-dim max-w-2xl mx-auto">
            Select the specialization you want to pursue. Each track is designed to give you hands-on experience and industry-relevant skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {domainData.map((domain) => (
            <div 
              key={domain._id} 
              className={`group rounded-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden border-2 bg-white ${
                selectedDomain === domain.title ? 'border-green-500 shadow-xl shadow-green-500/20 scale-[1.02]' : 'border-transparent shadow-md hover:shadow-xl hover:border-outline-variant/50'
              }`}
            >
              {selectedDomain === domain.title && (
                <div className="absolute top-3 right-3 z-10 text-green-500 bg-white rounded-full animate-pulse drop-shadow-lg">
                  <CheckCircle size={32} strokeWidth={2.5} />
                </div>
              )}

              {/* Course Image — clicking selects the domain */}
              <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => setSelectedDomain(domain.title)}>
                <img 
                  src={domain.imageUrl || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&q=80`} 
                  alt={domain.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 border border-red-600">
                  {domain.duration}
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-bold text-white drop-shadow-lg leading-tight">{domain.title}</h3>
                </div>
              </div>

              {/* View Details Button */}
              <div className="p-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDetailCourse(domain); }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-red-600 text-red-600 hover:text-white hover:bg-red-600"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleSelect}
            disabled={loading || !selectedDomain}
            className={`py-4 px-10 rounded-full font-bold text-lg text-white shadow-lg transition-all duration-200 ${
              loading || !selectedDomain 
                ? 'bg-outline-variant cursor-not-allowed opacity-70' 
                : 'bg-primary hover:bg-primary-container hover:scale-105'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm Selection & Enroll'}
          </button>
        </div>
      </div>

      {/* Course Detail Modal */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 animate-slide-up relative">
            <button 
              onClick={() => setDetailCourse(null)}
              className="absolute top-4 right-4 p-2 text-text-dim hover:text-text-primary hover:bg-surface-container rounded-full transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Modal Image Header */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={detailCourse.imageUrl || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&q=80`} 
                  alt={detailCourse.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-headline-lg font-bold text-white drop-shadow-lg">{detailCourse.title}</h2>
                  <span className="text-white/80 text-sm">{detailCourse.duration}</span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-text-dim text-base mb-6 leading-relaxed">{detailCourse.description}</p>

                {/* Roadmap Preview with Fade */}
                <h3 className="text-lg font-bold text-text-primary mb-4">Course Roadmap Preview</h3>
                {loadingRoadmap ? (
                  <p className="text-text-dim text-sm py-4 text-center">Loading roadmap...</p>
                ) : courseRoadmap.length > 0 ? (
                  <div className="relative mb-6">
                    <div className="space-y-3 max-h-40 overflow-hidden">
                      {courseRoadmap.map((day, idx) => (
                        <div key={day._id || day.dayNumber} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${(detailCourse.color || 'border-primary').replace('border-', 'bg-')}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text-primary">Day {day.dayNumber}: {day.title}</p>
                            <p className="text-xs text-text-dim">{day.items ? day.items.length : 0} module{(day.items ? day.items.length : 0) !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {courseRoadmap.length > 2 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none"></div>
                    )}
                  </div>
                ) : (
                  <p className="text-text-dim text-sm py-4 text-center mb-6">Roadmap coming soon.</p>
                )}

                {/* Benefits / Included */}
                <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">What's Included</h3>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CalendarCheck size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">Attendance Report</p>
                      <p className="text-[10px] text-text-dim">Track your daily learning consistency</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Award size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">Certificate of Completion</p>
                      <p className="text-[10px] text-text-dim">Industry-recognized certification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">Internship Report</p>
                      <p className="text-[10px] text-text-dim">Comprehensive performance evaluation</p>
                    </div>
                  </div>
                </div>

                {/* Fee */}
                <div className="bg-surface-container-lowest rounded-xl p-4 flex justify-between items-center mb-5 border border-outline-variant/20">
                  <span className="text-sm font-semibold text-text-dim">Course Fee</span>
                  <span className="text-2xl font-bold text-green-600">{detailCourse.fee}</span>
                </div>

                {/* Select & Enroll from Modal */}
                <button 
                  onClick={() => { setSelectedDomain(detailCourse.title); setDetailCourse(null); }}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 bg-green-600 hover:bg-green-700 shadow-md"
                >
                  Select This Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainSelection;
