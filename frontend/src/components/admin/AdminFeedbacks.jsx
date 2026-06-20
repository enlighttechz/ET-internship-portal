import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Trash2 } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filterDomain, setFilterDomain] = useState('all');

  useEffect(() => {
    fetchFeedbacks();
    fetchCourses();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${API_URL}/feedbacks`);
      setFeedbacks(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch(err) { console.error(err); }
  };

  const deleteFeedback = async (id) => {
    if (window.confirm('Delete this feedback?')) {
      try {
        await axios.delete(`${API_URL}/feedbacks/${id}`);
        fetchFeedbacks();
      } catch(err) { console.error(err); }
    }
  };

  const filteredFeedbacks = filterDomain === 'all' ? feedbacks : feedbacks.filter(f => f.domain === filterDomain);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">Student Feedback</h1>
          <p className="text-text-dim text-md font-medium">Review and analyze feedback from enrolled students.</p>
        </div>
        <div className="shrink-0">
          <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface font-bold text-sm shadow-sm outline-none focus:border-primary">
            <option value="all">All Domains</option>
            {courses.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-2xl border border-outline-variant/20 shadow-md p-6">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Star size={20} className="text-yellow-600" />
          </div>
          Feedback Inbox
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-4">
          {filteredFeedbacks.map(fb => (
            <div key={fb._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={16} className={star <= fb.rating ? 'fill-yellow-500 text-yellow-500' : 'text-outline-variant'} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{fb.domain}</span>
                </div>
                <p className="text-base text-text-primary mb-4 italic">"{fb.message}"</p>
              </div>
              <div className="border-t border-outline-variant/30 pt-3 mt-auto flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface">{fb.studentName}</p>
                  <p className="text-xs text-text-dim">{new Date(fb.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteFeedback(fb._id)} className="text-error bg-error/10 hover:bg-error hover:text-white transition-colors p-2 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredFeedbacks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-text-dim">
              <Star size={48} className="opacity-20 mb-4" />
              <p className="font-medium text-lg">No feedback found for this selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbacks;
