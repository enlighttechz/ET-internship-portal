import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentDashboard from './components/StudentDashboard';
import CourseViewer from './components/CourseViewer';
import Roadmap from './components/Roadmap';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import DomainSelection from './components/DomainSelection';
import Onboarding from './components/Onboarding';
import CompleteProfile from './components/CompleteProfile';
import ETLogo from './assets/ET.png';
import './index.css';

import AdminLayout from './components/admin/AdminLayout';
import AdminCourseManager from './components/admin/AdminCourseManager';
import AdminStudentManager from './components/admin/AdminStudentManager';
import AdminStudentDetails from './components/admin/AdminStudentDetails';
import AdminAssessmentBuilder from './components/admin/AdminAssessmentBuilder';
import AdminNotificationManager from './components/admin/AdminNotificationManager';
import AdminChatPanel from './components/admin/AdminChatPanel';
import AdminFeedbacks from './components/admin/AdminFeedbacks';
import AdminSystemSettings from './components/admin/AdminSystemSettings';

import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Help from './components/Help';

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
      <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-surface-container-low to-surface-container-highest">
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
      <div style={{ padding: '0', minHeight: 'calc(100vh - 60px)' }}>
        <Routes>
          <Route path="/" element={token ? (student && !student.hasCompletedProfile ? <Navigate to="/complete-profile" /> : student && student.domain === 'Pending' ? <Navigate to="/domain-selection" /> : student && !student.hasCompletedOnboarding ? <Navigate to="/onboarding" /> : <Roadmap token={token} student={student} logout={logout} />) : <Navigate to="/login" />} />
          <Route path="/dashboard" element={token ? (student && !student.hasCompletedProfile ? <Navigate to="/complete-profile" /> : student && student.domain === 'Pending' ? <Navigate to="/domain-selection" /> : student && !student.hasCompletedOnboarding ? <Navigate to="/onboarding" /> : <StudentDashboard token={token} student={student} setStudent={setStudent} logout={logout} />) : <Navigate to="/login" />} />
          <Route path="/course" element={token ? (student && !student.hasCompletedProfile ? <Navigate to="/complete-profile" /> : student && student.domain === 'Pending' ? <Navigate to="/domain-selection" /> : student && !student.hasCompletedOnboarding ? <Navigate to="/onboarding" /> : <CourseViewer token={token} student={student} logout={logout} />) : <Navigate to="/login" />} />
          <Route path="/domain-selection" element={token ? (student && !student.hasCompletedProfile ? <Navigate to="/complete-profile" /> : <DomainSelection token={token} student={student} setStudent={setStudent} logout={logout} />) : <Navigate to="/login" />} />
          <Route path="/onboarding" element={token ? (student && !student.hasCompletedProfile ? <Navigate to="/complete-profile" /> : <Onboarding student={student} setStudent={setStudent} logout={logout} />) : <Navigate to="/login" />} />
          <Route path="/complete-profile" element={token ? <CompleteProfile token={token} student={student} setStudent={setStudent} logout={logout} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!token ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/admin" element={token ? (student ? (student.role === 'admin' ? <AdminLayout /> : <AdminLayout />) : <div className="flex items-center justify-center min-h-[calc(100vh-60px)]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>) : <Navigate to="/login" />}>
            <Route index element={<Navigate to="courses" replace />} />
            <Route path="courses" element={<AdminCourseManager />} />
            <Route path="students" element={<AdminStudentManager />} />
            <Route path="students/:id" element={<AdminStudentDetails />} />
            <Route path="assessments" element={<AdminAssessmentBuilder />} />
            <Route path="notifications" element={<AdminNotificationManager />} />
            <Route path="chat" element={<AdminChatPanel />} />
            <Route path="feedbacks" element={<AdminFeedbacks />} />
            <Route path="settings" element={<AdminSystemSettings />} />
          </Route>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
      
      <footer style={{ background: 'var(--bg-card)', padding: '20px 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '8px' }}>&copy; 2026 Enlight Techz. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.85rem' }}>
          <Link to="/privacy-policy" style={{ color: 'var(--primary)', textDecoration: 'none' }} className="hover:underline">Privacy Policy</Link>
          <Link to="/terms-of-service" style={{ color: 'var(--primary)', textDecoration: 'none' }} className="hover:underline">Terms of Service</Link>
          <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }} className="hover:underline">Help</Link>
        </div>
      </footer>
    </Router>
  );
}

export default App;
