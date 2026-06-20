import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, Monitor, EyeOff, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const Register = ({ setToken }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, domain: 'Pending' });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased p-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
      <main className="w-full max-w-md mx-auto animate-slide-up">
        {/* Register Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden bg-white/60">
          
          {/* Decorative gradient orb in background of card */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/10">
              <img src={ETLogo} alt="Enlight Techz Logo" className="w-14 h-14 object-contain" loading="lazy" />
            </div>
            <h1 className="font-headline-lg md:font-headline-lg text-3xl font-bold text-primary mb-2 text-center tracking-tight">Create Account</h1>
            <p className="font-body-md text-text-dim text-center">Join Enlight Techz to start learning.</p>
          </div>

          <form className="relative z-10 space-y-4" onSubmit={handleRegister}>
            
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="name">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-outline" size={20} />
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" 
                  id="name" 
                  placeholder="Alex Rivera" 
                  required 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-outline" size={20} />
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" 
                  id="email" 
                  placeholder="student@university.edu" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>


            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-outline" size={20} />
                </div>
                <input 
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                  <EyeOff size={20} />
                </button>
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-4">
              <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md font-bold text-white bg-primary hover:bg-primary-container hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200" type="submit">
                Create Account
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center relative z-10">
            <p className="font-body-md text-sm text-text-dim">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-label-md text-sm text-primary hover:text-primary-container font-bold transition-colors">Log In</button>
            </p>
          </div>
        </div>

        {/* Footer / Support links
        <div className="mt-8 text-center">
          <p className="font-label-md text-xs text-text-dim">
            © 2026 Enlight Techz LMS. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center space-x-4 font-label-md text-xs text-text-dim">
            <a className="hover:text-primary transition-colors" href="/help">Help</a>
            <span>·</span>
            <a className="hover:text-primary transition-colors" href="/privacy-policy">Privacy</a>
            <span>·</span>
            <a className="hover:text-primary transition-colors" href="/terms-of-service">Terms</a>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default Register;
