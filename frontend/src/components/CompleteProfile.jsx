import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ETLogo from '../assets/ET.png';
import { GraduationCap, MapPin, Building2, BookOpen, Phone, ChevronRight, ArrowLeft } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CompleteProfile = ({ token, student, setStudent, logout }) => {
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
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 relative">
      {logout && (
        <button 
          onClick={() => {
            logout();
            setTimeout(() => navigate(-1), 50);
          }} 
          className="absolute top-6 left-6 p-2 bg-surface hover:bg-surface-container-high rounded-full shadow-md text-text-dim hover:text-primary transition-all flex items-center justify-center z-10 group"
          title="Go Back"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      )}
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
              <input type="text" required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.collegeName} onChange={e=>setFormData({...formData, collegeName: e.target.value})} placeholder="Enter your college name" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2"><MapPin size={16}/> State</label>
              <select required className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}>
                <option value="">Select State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Goa">Goa</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Odisha">Odisha</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Tripura">Tripura</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                <option value="Delhi">Delhi</option>
                <option value="Lakshadweep">Lakshadweep</option>
                <option value="Puducherry">Puducherry</option>
              </select>
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
            <input type="tel" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" maxLength="10" className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none" value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value.replace(/\D/g, '')})} placeholder="9876543210" />
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
