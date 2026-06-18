import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Monitor, Smartphone, Cpu, Database, Shield, Palette } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const domainData = [
  {
    id: 'Web Development',
    title: 'Web Development',
    icon: <Monitor size={32} className="text-blue-500 mb-4" />,
    description: 'Master full-stack web development using React, Node.js, and MongoDB. Build responsive, dynamic web applications.',
    fee: '₹2,999',
    duration: '4 Weeks',
    color: 'border-blue-500'
  },
  {
    id: 'App Development',
    title: 'App Development',
    icon: <Smartphone size={32} className="text-green-500 mb-4" />,
    description: 'Learn cross-platform mobile app development with React Native. Build seamless apps for Android and iOS.',
    fee: '₹2,999',
    duration: '4 Weeks',
    color: 'border-green-500'
  },
  {
    id: 'AI Assisted App development',
    title: 'AI Assisted App development',
    icon: <Cpu size={32} className="text-purple-500 mb-4" />,
    description: 'Supercharge your development workflow by integrating AI tools. Build intelligent applications faster.',
    fee: '₹3,499',
    duration: '4 Weeks',
    color: 'border-purple-500'
  },
  {
    id: 'Data Science',
    title: 'Data Science',
    icon: <Database size={32} className="text-yellow-500 mb-4" />,
    description: 'Dive into data analysis, machine learning, and visualization using Python and modern data science libraries.',
    fee: '₹3,999',
    duration: '6 Weeks',
    color: 'border-yellow-500'
  },
  {
    id: 'Cyber Security',
    title: 'Cyber Security',
    icon: <Shield size={32} className="text-red-500 mb-4" />,
    description: 'Learn the fundamentals of ethical hacking, network security, and vulnerability assessment.',
    fee: '₹3,499',
    duration: '4 Weeks',
    color: 'border-red-500'
  },
  {
    id: 'UI/UX Design',
    title: 'UI/UX Design',
    icon: <Palette size={32} className="text-pink-500 mb-4" />,
    description: 'Design beautiful, intuitive user interfaces and master user experience principles using Figma.',
    fee: '₹2,499',
    duration: '4 Weeks',
    color: 'border-pink-500'
  }
];

const DomainSelection = ({ token, student, setStudent }) => {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelect = async () => {
    if (!selectedDomain) return alert('Please select a domain to continue.');
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/auth/profile`,
        { domain: selectedDomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (setStudent) {
        setStudent(res.data);
      }
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-slide-up">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline-lg font-bold text-primary mb-4 tracking-tight">Choose Your Internship Domain</h1>
          <p className="text-lg text-text-dim max-w-2xl mx-auto">
            Select the specialization you want to pursue. Each track is designed to give you hands-on experience and industry-relevant skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {domainData.map((domain) => (
            <div 
              key={domain.id} 
              onClick={() => setSelectedDomain(domain.id)}
              className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl relative overflow-hidden border-2 ${
                selectedDomain === domain.id ? domain.color + ' bg-white/80 shadow-lg scale-[1.02]' : 'border-transparent bg-white/40 hover:bg-white/60'
              }`}
            >
              {selectedDomain === domain.id && (
                <div className="absolute top-4 right-4 text-primary animate-pulse">
                  <CheckCircle size={28} />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                {domain.icon}
                <h3 className="text-xl font-bold text-text-primary mb-2">{domain.title}</h3>
                <p className="text-text-dim text-sm mb-6 flex-grow">{domain.description}</p>
                <div className="w-full bg-surface-container-lowest rounded-xl p-4 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-text-dim">Duration:</span>
                    <span className="font-bold text-text-primary">{domain.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-dim">Course Fee:</span>
                    <span className="font-bold text-primary text-lg">{domain.fee}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleSelect}
            disabled={loading || !selectedDomain}
            className={`py-4 px-10 rounded-full font-bold text-lg text-white shadow-lg transition-all duration-200 ${
              loading || !selectedDomain 
                ? 'bg-outline-variant cursor-not-allowed opacity-70' 
                : 'bg-primary hover:bg-primary-container hover:scale-105'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm Selection & Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainSelection;
