import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Users, Award, Bell, MessageSquare, Settings, Menu, X, Star } from 'lucide-react';
import ETLogo from '../../assets/ET.png';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { name: 'Course Manager', path: '/admin/courses', icon: <BookOpen size={20} /> },
    { name: 'Student Management', path: '/admin/students', icon: <Users size={20} /> },
    { name: 'Assessment Builder', path: '/admin/assessments', icon: <Award size={20} /> },
    { name: 'Notifications', path: '/admin/notifications', icon: <Bell size={20} /> },
    { name: 'Feedbacks', path: '/admin/feedbacks', icon: <Star size={20} /> },
    { name: 'Chat & Mentoring', path: '/admin/chat', icon: <MessageSquare size={20} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-background font-body-md overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-outline-variant/30 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 object-contain" />
            <span className="font-headline-md text-lg font-bold text-primary">Admin Portal</span>
          </div>
          <button className="lg:hidden text-text-dim hover:text-primary" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-sm border border-primary/20'
                    : 'text-text-dim hover:bg-surface-container-highest hover:text-on-surface'
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button className="lg:hidden text-text-dim hover:text-primary p-2 -ml-2 rounded-lg hover:bg-surface-container-highest" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="hidden lg:block font-bold text-text-dim uppercase tracking-widest text-xs">Admin Workspace</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
