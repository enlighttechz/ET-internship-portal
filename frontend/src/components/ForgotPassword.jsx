import React, { useState } from 'react';
import axios from 'axios';
import { Mail, KeyRound, Lock, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(res.data.msg);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      setMessage(res.data.msg);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
      setMessage(res.data.msg);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md antialiased p-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
      <main className="w-full max-w-md mx-auto animate-slide-up">
        {/* Forgot Password Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden bg-white/60">
          
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <button 
            onClick={() => navigate('/login')}
            className="absolute top-6 left-6 text-text-dim hover:text-primary transition-colors flex items-center gap-1 z-20 font-label-md text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="relative z-10 flex flex-col items-center mb-8 mt-4">
            <div className="w-20 h-20 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/10">
              <img src={ETLogo} alt="Enlight Techz Logo" className="w-14 h-14 object-contain" loading="lazy" />
            </div>
            <h1 className="font-headline-lg text-3xl font-bold text-primary mb-2 text-center tracking-tight">
              {step === 1 ? 'Reset Password' : step === 2 ? 'Enter OTP' : 'New Password'}
            </h1>
            <p className="font-body-md text-text-dim text-center">
              {step === 1 
                ? 'Enter your registered email and we\'ll send you a 6-digit OTP to reset your password.' 
                : step === 2 
                ? 'Enter the 6-digit OTP sent to your email.'
                : 'Enter your new password.'}
            </p>
          </div>

          {message && (
            <div className="relative z-10 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center font-label-md text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="relative z-10 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-label-md text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="relative z-10 space-y-5" onSubmit={handleRequestOtp}>
              <div className="space-y-1.5">
                <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="email">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-outline" size={20} />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                    id="email" 
                    placeholder="student@university.edu" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md font-bold text-white bg-primary hover:bg-primary-container disabled:opacity-50 transition-all duration-200" 
                  type="submit"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            <form className="relative z-10 space-y-5" onSubmit={handleVerifyOtp}>
              <div className="space-y-1.5">
                <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="otp">6-Digit OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="text-outline" size={20} />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary tracking-widest text-center text-xl" 
                    id="otp" 
                    placeholder="000000" 
                    required 
                    maxLength={6}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isLoading || otp.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md font-bold text-white bg-primary hover:bg-primary-container disabled:opacity-50 transition-all duration-200" 
                  type="submit"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form className="relative z-10 space-y-5" onSubmit={handleResetPassword}>
              <div className="space-y-1.5">
                <label className="block font-label-md text-sm font-bold text-text-primary" htmlFor="newPassword">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-outline" size={20} />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                    id="newPassword" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isLoading || !newPassword}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md font-bold text-white bg-primary hover:bg-primary-container disabled:opacity-50 transition-all duration-200" 
                  type="submit"
                >
                  {isLoading ? 'Resetting...' : 'Confirm New Password'}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
