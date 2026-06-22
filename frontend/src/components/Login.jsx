import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, EyeOff, Eye, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const Login = ({ setToken }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased p-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
      <main className="w-full max-w-md mx-auto animate-slide-up">
        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden bg-white/60">
          
          {/* Decorative gradient orb in background of card */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/10">
              <img src={ETLogo} alt="Enlight Techz Logo" className="w-14 h-14 object-contain" loading="lazy" />
            </div>
            <h1 className="font-headline-lg md:font-headline-lg text-3xl font-bold text-primary mb-2 text-center tracking-tight">Enlight Techz</h1>
            <p className="font-body-md text-text-dim text-center">Welcome back! Please enter your details.</p>
          </div>

          <form className="relative z-10 space-y-5" onSubmit={handleLogin}>
            
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
                  name="email" 
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
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-lowest cursor-pointer" id="remember-me" name="remember-me" type="checkbox"/>
                <label className="ml-2 block font-label-md text-sm text-text-dim cursor-pointer" htmlFor="remember-me">
                    Remember me
                </label>
              </div>
              <button type="button" onClick={() => navigate('/forgot-password')} className="font-label-md text-sm text-primary hover:text-primary-container font-bold transition-colors">Forgot Password?</button>
            </div>

            {/* Login Button */}
            <div className="pt-4">
              <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md font-bold text-white bg-primary hover:bg-primary-container hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200" type="submit">
                Log In
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center relative z-10">
            <p className="font-body-md text-sm text-text-dim">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="font-label-md text-sm text-primary hover:text-primary-container font-bold transition-colors">Sign Up</button>
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

export default Login;
