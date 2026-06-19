import React from 'react';
import { useNavigate } from 'react-router-dom';
import { domainData } from './DomainSelection';
import ETLogo from '../assets/ET.png';
import { CheckCircle, LogOut } from 'lucide-react';

const StudentDashboard = ({ token, student, logout }) => {
  const navigate = useNavigate();

  if (!student) {
    return <div className="p-10 text-center">Loading Dashboard...</div>;
  }

  // Find the student's registered domain
  const registeredDomain = domainData.find(d => d.id === student.domain);
  const otherDomains = domainData.filter(d => d.id !== student.domain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest">
      {/* Navbar */}
      <header className="bg-surface shadow-sm border-b border-outline-variant/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 drop-shadow-md" />
            <span className="font-headline-md text-xl font-bold text-primary">Enlight Techz</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{student.name}</p>
                <p className="text-[10px] text-text-dim">{student.internId}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-error hover:bg-error/10 transition-colors border border-error/20"
            >
              <LogOut size={16} />
              <span className="text-sm font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-headline-xl font-bold text-text-primary mb-2">Welcome back, {student.name.split(' ')[0]}!</h1>
          <p className="text-lg text-text-dim">Your personalized learning dashboard. Resume your journey below.</p>
        </div>

        {/* Registered Course Section */}
        <section className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-headline-lg font-bold text-primary mb-6 flex items-center gap-2">
            <CheckCircle className="text-success" />
            My Registered Course
          </h2>
          
          {registeredDomain ? (
            <div 
              onClick={() => navigate('/course')}
              className={`glass-card rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border-2 border-primary bg-white/80 group flex flex-col md:flex-row items-center justify-between gap-4 w-full`}
            >
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="shrink-0 p-3 bg-primary/5 rounded-xl group-hover:scale-110 transition-transform flex items-center justify-center">
                  {React.cloneElement(registeredDomain.icon, { className: registeredDomain.icon.props.className.replace('mb-4', 'm-0') })}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary">{registeredDomain.title}</h3>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
                <span className="text-sm font-semibold bg-surface-container py-1.5 px-3 rounded-md whitespace-nowrap">
                  Duration: <span className="text-text-primary font-bold">{registeredDomain.duration}</span>
                </span>
                <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Active
                </span>
                <button className="bg-primary text-white font-bold py-2 px-6 rounded-full group-hover:bg-primary-container transition-colors shadow-md whitespace-nowrap">
                  Continue Learning
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 text-center">
              <p className="text-text-dim mb-4">You have not registered for any domain yet.</p>
              <button 
                onClick={() => navigate('/domain-selection')}
                className="bg-primary text-white font-bold py-2 px-6 rounded-full"
              >
                Choose Domain
              </button>
            </div>
          )}
        </section>

        {/* Recommended Courses Section */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-headline-lg font-bold text-secondary mb-6">Explore Other Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherDomains.map(domain => (
              <div 
                key={domain.id} 
                className="glass-card rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30 flex flex-col hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-surface-container rounded-2xl mb-4">
                    {domain.icon}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">{domain.title}</h3>
                  <p className="text-text-dim text-sm mb-6 flex-grow">{domain.description}</p>
                  <div className="w-full bg-surface-container-lowest rounded-xl p-4 mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-text-dim">Duration:</span>
                      <span className="font-bold text-text-primary">{domain.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-text-dim">Course Fee:</span>
                      <span className="font-bold text-primary">{domain.fee}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert('Please contact administration to enroll in an additional course.')}
                    className="w-full mt-4 py-2 rounded-lg font-bold text-primary border border-primary hover:bg-primary/5 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
