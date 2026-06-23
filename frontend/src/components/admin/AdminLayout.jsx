import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Users, Award, Bell, MessageSquare, Settings, Menu, X, Star, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import ETLogo from '../../assets/ET.png';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('admin_auth') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Admin@ET1tern') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-3xl"></div>
        
        <form onSubmit={handleLogin} className="glass-card bg-white p-8 rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-sm animate-fade-in relative z-10 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2 font-headline-md">Admin Portal</h2>
          <p className="text-text-dim text-sm mb-6">Please enter the admin password to continue.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface placeholder-text-dim mb-4"
            placeholder="Password"
            autoFocus
          />
          
          {error && <p className="text-error text-xs mb-4 animate-shake">{error}</p>}
          
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors active:scale-95">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

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
  const toggleMinimize = () => setSidebarMinimized(!sidebarMinimized);

  // Generate breadcrumbs from location
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    // Format name (capitalize, remove dashes)
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    return { name: formattedName, path: routeTo, isLast };
  });

  return (
    <div className="flex h-screen bg-background font-body-md overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarMinimized ? 'w-20' : 'w-64'} bg-surface border-r border-outline-variant/30 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-outline-variant/30">
          <div className={`flex items-center gap-3 ${sidebarMinimized ? 'justify-center w-full' : ''}`}>
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 object-contain shrink-0" />
            {!sidebarMinimized && <span className="font-headline-md text-lg font-bold text-primary truncate">Admin Portal</span>}
          </div>
          <button className="lg:hidden text-text-dim hover:text-primary shrink-0" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              title={sidebarMinimized ? link.name : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${sidebarMinimized ? 'justify-center px-0' : ''} ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-sm border border-primary/20'
                    : 'text-text-dim hover:bg-surface-container-highest hover:text-on-surface'
                }`
              }
            >
              <div className="shrink-0">{link.icon}</div>
              {!sidebarMinimized && <span className="truncate">{link.name}</span>}
            </NavLink>
          ))}
        </nav>
        
        {/* Minimize Toggle for Desktop */}
        <div className="hidden lg:flex p-4 border-t border-outline-variant/30">
          <button 
            onClick={toggleMinimize} 
            className="w-full flex items-center justify-center p-2 rounded-xl text-text-dim hover:text-primary hover:bg-surface-container-highest transition-colors"
            title={sidebarMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {sidebarMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-surface-container-lowest">
        <header className="sticky top-0 z-40 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-text-dim hover:text-primary p-2 -ml-2 rounded-lg hover:bg-surface-container-highest shrink-0" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <ChevronRight size={14} className="text-text-dim" />}
                  {crumb.isLast ? (
                    <span className="text-primary font-bold">{crumb.name}</span>
                  ) : (
                    <NavLink to={crumb.path} className="text-text-dim hover:text-primary transition-colors">
                      {crumb.name}
                    </NavLink>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
