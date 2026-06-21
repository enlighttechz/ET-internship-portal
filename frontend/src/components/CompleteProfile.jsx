import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ETLogo from '../assets/ET.png';
import { GraduationCap, MapPin, Building2, BookOpen, Phone, ChevronRight } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CompleteProfile = ({ token, student, setStudent }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    collegeName: '',
    location: '',
    degree: '',
    specialization: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/students/${student._id}/complete-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudent(res.data);
      navigate(student.domain === 'Pending' ? '/domain-selection' : '/onboarding');
    } catch (err) {
      alert("Failed to save profile. " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-surface shadow-2xl rounded-3xl border border-outline-variant/30 overflow-hidden animate-slide-up">
        <div className="bg-primary/5 p-8 border-b border-primary/10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
          <img src={ETLogo} alt="Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {student.name}!</h1>
          <p className="text-text-dim">Let's complete your profile to personalize your experience.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2"><Building2 size={16}/> College Name</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.collegeName} onChange={e=>setFormData({...formData, collegeName: e.target.value})} placeholder="e.g. ABC College of Engineering" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2"><MapPin size={16}/> Location</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} placeholder="e.g. Chennai, Tamil Nadu" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2"><GraduationCap size={16}/> Degree</label>
              <select required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.degree} onChange={e=>setFormData({...formData, degree: e.target.value})}>
                <option value="">Select Degree</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E">B.E</option>
                <option value="B.Sc">B.Sc</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2"><BookOpen size={16}/> Specialization</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.specialization} onChange={e=>setFormData({...formData, specialization: e.target.value})} placeholder="e.g. CSE, ECE, AI&DS" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary flex items-center gap-2"><Phone size={16}/> Contact Number</label>
            <input type="tel" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" maxLength="10" className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 9876543210" />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Saving...' : 'Continue'} <ChevronRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
