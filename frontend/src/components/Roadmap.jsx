import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, PlayCircle, Lock, Clock, ArrowRight } from 'lucide-react';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const Roadmap = ({ token, student, logout }) => {
  const [courseDays, setCourseDays] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (student) {
      axios.get(`${API_URL}/course-days/${student.domain}`)
        .then(res => setCourseDays(res.data.filter(d => !d.hidden).sort((a,b) => a.dayNumber - b.dayNumber)))
        .catch(err => console.error(err));
    }
  }, [student]);

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
        <div className="w-32 h-32 bg-primary/5 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10 mb-6 p-4">
          <img src={ETLogo} alt="Enlight Techz Logo" className="w-full h-full object-contain animate-pulse" />
        </div>
        <p className="font-label-md text-text-dim uppercase tracking-widest text-sm">Loading Roadmap...</p>
      </div>
    );
  }

  const learningProgress = student.learningProgress || 1;
  const currentDay = courseDays.find(d => d.dayNumber === learningProgress);
  const isAssessmentStage = courseDays.length > 0 && learningProgress > Math.max(...courseDays.map(d => d.dayNumber));

  const currentWeekNum = Math.floor((learningProgress - 1) / 6) + 1;
  const currentDayNum = ((learningProgress - 1) % 6) + 1;
  const cleanCurrentTitle = currentDay ? currentDay.title.replace(/^Day\s*\d+[\s:]*/i, '') : '';

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
      <header className="w-full bg-surface border-b border-outline-variant/30 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 object-contain" />
            <span className="font-headline-md text-lg font-bold text-primary truncate">Enlight Techz</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-label-md font-bold hidden md:block text-text-primary">Hi, {student.name.split(' ')[0]}</span>
            <button onClick={() => navigate('/dashboard')} className="text-primary font-bold text-sm hover:underline">Dashboard</button>
            <button onClick={logout} className="text-error font-bold text-sm hover:underline bg-error/10 px-3 py-1.5 rounded-lg">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 w-full flex-grow">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-headline-xl font-bold text-primary mb-3">Your Learning Roadmap</h1>
          <p className="text-text-dim text-lg md:text-xl font-medium">{student.domain} Internship</p>
        </div>

        <div className="glass-card bg-gradient-to-br from-primary/10 via-background to-secondary/5 rounded-3xl p-8 md:p-10 mb-16 border border-outline-variant/30 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-secondary/10 rounded-full blur-2xl"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold tracking-widest mb-5 uppercase shadow-sm">
                Today's Course Target
              </div>
              <h2 className="text-3xl md:text-4xl font-headline-lg font-bold text-on-surface mb-4 leading-tight">
                {isAssessmentStage ? "Final Assessment Ready" : currentDay ? `${currentWeekNum}.${currentDayNum} ${cleanCurrentTitle}` : "Awaiting Course Modules"}
              </h2>
              <p className="text-text-dim mb-8 max-w-xl mx-auto md:mx-0 text-lg">
                {isAssessmentStage ? "You've completed all modules! It's time to take your final assessment to earn your certificate." : currentDay ? "Dive into today's module to keep your progress on track. Your attendance is recorded automatically as you complete modules." : "The curriculum for your domain is currently being updated. Please check back later."}
              </p>
              <button
                onClick={() => navigate('/course', { state: { activeDomain: student.domain } })}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-bold hover:bg-primary-container hover:scale-105 transition-all shadow-lg text-lg"
              >
                {isAssessmentStage ? "Take Assessment" : (!student.learningProgress || student.learningProgress === 0 ? "Start Learning" : "Continue Learning")} <ArrowRight size={20} />
              </button>
            </div>

            <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-outline-variant/20 flex flex-col items-center min-w-[220px]">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-text-primary"><Clock size={20} className="text-secondary" /> Attendance</h3>
              <div className="relative flex justify-center items-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-surface-container-highest" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={56 * 2 * Math.PI} strokeDashoffset={56 * 2 * Math.PI - (student.attendance / 100) * 56 * 2 * Math.PI} className="text-primary transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute text-3xl font-extrabold text-primary">{student.attendance}%</div>
              </div>
              <p className="text-xs text-text-dim text-center mt-4 max-w-[150px]">Updates automatically as you progress</p>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-headline-md font-bold mb-8 text-center md:text-left">Course Timeline</h3>
        <div className="relative border-l-2 border-outline-variant ml-6 md:ml-10 pl-10 space-y-10 max-w-4xl mx-auto md:mx-0">
          {courseDays.map((day) => {
            const isCompleted = day.dayNumber < learningProgress;
            const isCurrent = day.dayNumber === learningProgress;
            
            const weekNum = Math.floor((day.dayNumber - 1) / 6) + 1;
            const dayNum = ((day.dayNumber - 1) % 6) + 1;
            const cleanTitle = day.title.replace(/^Day\s*\d+[\s:]*/i, '');

            return (
              <div key={day._id} className="relative group">
                <div className={`absolute -left-[57px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-colors ${isCompleted ? 'bg-success' : isCurrent ? 'bg-primary scale-110 shadow-md' : 'bg-surface-container-highest'}`}>
                  {isCompleted ? <CheckCircle size={20} className="text-white" /> : isCurrent ? <PlayCircle size={20} className="text-white" /> : <Lock size={16} className="text-text-dim" />}
                </div>

                <div className={`p-6 rounded-2xl border transition-all duration-300 ${isCurrent ? 'bg-primary/5 border-primary shadow-lg -translate-y-1' : isCompleted ? 'bg-surface border-success/30 hover:shadow-md' : 'bg-surface-container-lowest border-outline-variant/30 opacity-60 hover:opacity-100'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-text-dim'}`}>
                        WEEK {weekNum} : DAY {dayNum}
                      </div>
                      <h4 className={`text-xl font-bold ${isCurrent ? 'text-on-surface' : 'text-text-primary'}`}>{weekNum}.{dayNum} {cleanTitle}</h4>
                    </div>
                    {isCurrent && (
                      <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md whitespace-nowrap hover:bg-primary-container transition-colors shrink-0">
                        Continue
                      </button>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg uppercase tracking-wider shrink-0 w-fit">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {courseDays.length > 0 && (
            <div className="relative">
              <div className={`absolute -left-[57px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-background ${student.assessmentScore !== null ? 'bg-success' : isAssessmentStage ? 'bg-accent scale-110 shadow-md' : 'bg-surface-container-highest'}`}>
                {student.assessmentScore !== null ? <CheckCircle size={20} className="text-white" /> : isAssessmentStage ? <PlayCircle size={20} className="text-white" /> : <Lock size={16} className="text-text-dim" />}
              </div>
              <div className={`p-6 rounded-2xl border transition-all duration-300 ${isAssessmentStage ? 'bg-accent/10 border-accent shadow-lg -translate-y-1' : student.assessmentScore !== null ? 'bg-surface border-success/30' : 'bg-surface-container-lowest border-outline-variant/30 opacity-60'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isAssessmentStage ? 'text-accent' : 'text-text-dim'}`}>Final Milestone</div>
                    <h4 className={`text-xl font-bold ${isAssessmentStage ? 'text-accent' : 'text-text-primary'}`}>Course Assessment</h4>
                  </div>
                  {isAssessmentStage && (
                    <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-md whitespace-nowrap hover:bg-accent/80 transition-colors shrink-0">
                      Take Exam
                    </button>
                  )}
                  {student.assessmentScore !== null && (
                    <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg uppercase tracking-wider shrink-0 w-fit">Score: {student.assessmentScore}%</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Roadmap;
