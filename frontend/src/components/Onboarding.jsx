import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, CheckCircle, BookOpen } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const Onboarding = ({ student, setStudent }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (student?.hasCompletedOnboarding) {
      navigate('/dashboard');
      return;
    }
    
    const fetchCourseData = async () => {
      try {
        const res = await axios.get(`${API_URL}/courses`);
        const domainCourse = res.data.find(c => c.title === student.domain);
        setCourse(domainCourse);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    if (student) {
      fetchCourseData();
    }
  }, [student, navigate]);

  const handleJoin = async () => {
    try {
      const res = await axios.put(`${API_URL}/students/${student._id}/onboarding`);
      setStudent(res.data);
      navigate('/dashboard');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="max-w-2xl w-full glass-card p-8 md:p-12 rounded-3xl border border-outline-variant/30 shadow-xl relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline-xl font-bold text-on-surface mb-4 leading-tight">Welcome to <span className="text-primary">{student.domain}</span></h1>
          <p className="text-base sm:text-lg text-text-dim">You're almost ready to start learning.</p>
        </div>

        {course?.onboardingNote && (
          <div className="bg-error/10 p-6 rounded-2xl mb-8 border border-error/20">
            <h3 className="font-bold text-error mb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center shrink-0">
                <CheckCircle size={16} />
              </span>
              Important Note from Instructors
            </h3>
            <p className="text-text-primary font-medium text-sm leading-relaxed whitespace-pre-wrap">{course.onboardingNote}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <div className="bg-error/10 rounded-2xl p-6 border border-error/20 w-full">
            <h3 className="font-bold text-lg text-error mb-3 flex items-center gap-2">
              <BookOpen size={20} /> Research-Based Learning
            </h3>
            <p className="text-text-primary leading-relaxed text-sm">
              This program follows a <strong>Flipped Class Methodology</strong>. Instead of passive lectures, you will proactively research and engage with interactive topics daily, utilizing AI tools and external resources to build your skills.
            </p>
          </div>

          {course?.whatsappLink ? (
            <a 
              href={course.whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={24} />
              Join WhatsApp Community
            </a>
          ) : (
            <div className="w-full bg-surface-container-highest p-4 rounded-2xl text-center border border-outline-variant/30">
              <p className="text-text-dim text-sm">No community link available for this course yet.</p>
            </div>
          )}

          <label className="w-full flex items-start gap-3 bg-surface-container p-4 rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors border border-outline-variant/30">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-5 h-5 mt-0.5 accent-error rounded shrink-0 cursor-pointer" />
            <span className="text-sm font-bold text-text-primary">I have read and understood the instructions, guidelines, and joined the respective communities.</span>
          </label>

          <button 
            onClick={handleJoin}
            disabled={!agreed}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${agreed ? 'bg-primary hover:bg-primary-container text-white hover:scale-[1.02]' : 'bg-outline-variant text-text-dim cursor-not-allowed opacity-70'}`}
          >
            I've Joined, Let's Begin!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
