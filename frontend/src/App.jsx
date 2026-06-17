import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ETLogo from './assets/ET.png';
import './index.css';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [student, setStudent] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setStudent(res.data))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
        });
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    setStudent(null);
    localStorage.removeItem('token');
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
        <div className="flex flex-col items-center animate-slide-up">
          <div className="w-32 h-32 bg-primary/5 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10 mb-6 p-4">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-full h-full object-contain animate-pulse" loading="lazy" />
          </div>
          <h1 className="font-headline-lg text-4xl font-bold text-primary tracking-tight mb-2">Enlight Techz</h1>
          <p className="font-label-md text-text-dim uppercase tracking-widest text-sm">Learning Management System</p>
          
          <div className="mt-12 flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ padding: '0' }}>
        <Routes>
          <Route path="/" element={token ? <StudentDashboard token={token} student={student} logout={logout} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!token ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
      
      <footer style={{ background: 'var(--bg-card)', padding: '20px 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>&copy; 2026 Enlight Techz. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
