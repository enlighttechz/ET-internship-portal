import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, User, Search } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminChatPanel = () => {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recommendationText, setRecommendationText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0 && location.state?.studentId) {
      const studentToSelect = students.find(s => s._id === location.state.studentId);
      if (studentToSelect) setActiveStudent(studentToSelect);
    }
  }, [students, location.state]);

  useEffect(() => {
    if (activeStudent) {
      fetchChat();
      const interval = setInterval(fetchChat, 5000);
      return () => clearInterval(interval);
    }
  }, [activeStudent]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`);
      setStudents(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchChat = async () => {
    if (!activeStudent) return;
    try {
      const res = await axios.get(`${API_URL}/recommendations/${activeStudent._id}`);
      setMessages(res.data);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch(err) { console.error(err); }
  };

  const sendRecommendation = async (e) => {
    e.preventDefault();
    if (!recommendationText.trim() || !activeStudent) return;
    try {
      await axios.post(`${API_URL}/recommendations/${activeStudent._id}`, {
        message: recommendationText,
        sender: 'admin'
      });
      setRecommendationText('');
      fetchChat();
    } catch(err) { console.error(err); }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-headline-xl font-bold text-primary mb-1">Chat & Mentoring</h1>
        <p className="text-text-dim text-sm font-medium">Send personal recommendations and chat with students.</p>
      </div>

      <div className="glass-card bg-surface rounded-2xl border border-outline-variant/20 shadow-md flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar: Students List */}
        <div className="w-1/3 border-r border-outline-variant/30 flex flex-col bg-surface-container-lowest">
          <div className="p-4 border-b border-outline-variant/30">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-dim" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.map(s => (
              <button 
                key={s._id}
                onClick={() => setActiveStudent(s)}
                className={`w-full text-left p-4 border-b border-outline-variant/20 hover:bg-surface-container-highest transition-colors flex items-center gap-3 ${activeStudent?._id === s._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-surface border border-outline-variant flex items-center justify-center shrink-0 shadow-sm">
                  <User size={20} className={activeStudent?._id === s._id ? 'text-primary' : 'text-text-dim'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${activeStudent?._id === s._id ? 'text-primary' : 'text-on-surface'}`}>{s.name}</p>
                  <p className="text-xs text-text-dim truncate">{s.domain}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Chat Window */}
        <div className="w-2/3 flex flex-col bg-surface">
          {activeStudent ? (
            <>
              <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3 shrink-0 bg-surface-container-lowest">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{activeStudent.name}</h3>
                  <p className="text-xs text-text-dim">{activeStudent.domain} - Day {activeStudent.learningProgress}</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${m.sender === 'admin' ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface-container-highest text-on-surface rounded-tl-sm border border-outline-variant/30'}`}>
                      <p className="text-sm">{m.message}</p>
                      <span className={`text-[10px] mt-1 block opacity-70 ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-text-dim opacity-50">
                    <MessageSquare size={48} className="mb-3" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendRecommendation} className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest shrink-0">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={recommendationText} 
                    onChange={e => setRecommendationText(e.target.value)} 
                    placeholder="Type a recommendation or message..." 
                    className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface focus:border-success focus:ring-1 focus:ring-success outline-none text-sm"
                  />
                  <button type="submit" disabled={!recommendationText.trim()} className="bg-success text-white px-5 py-3 rounded-xl hover:bg-[#15803d] disabled:opacity-50 transition-colors flex items-center justify-center shadow-md">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-dim">
              <MessageSquare size={64} className="opacity-20 mb-4" />
              <p className="font-bold text-lg">Select a student</p>
              <p className="text-sm">Choose a student from the left sidebar to start mentoring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPanel;
