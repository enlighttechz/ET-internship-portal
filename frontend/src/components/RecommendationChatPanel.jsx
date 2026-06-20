import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, X, User } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const RecommendationChatPanel = ({ student, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChat();
  }, [student._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChat = async () => {
    try {
      const res = await axios.get(`${API_URL}/recommendations/${student._id}`);
      setMessages(res.data.messages || []);
      // Mark student messages as read by admin
      await axios.put(`${API_URL}/recommendations/${student._id}/read`, { roleToMarkRead: 'Student' });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/recommendations/${student._id}`, {
        text: newMessage,
        senderRole: 'Admin'
      });
      setMessages(res.data.messages);
      setNewMessage('');
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-slide-up border-l border-outline-variant/30">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-on-surface leading-tight">{student.name}</h3>
              <p className="text-xs text-text-dim">Recommendation Chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container text-text-dim hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
          {loading ? (
            <p className="text-center text-text-dim text-sm mt-10">Loading conversation...</p>
          ) : messages.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-text-dim text-sm">No messages yet.</p>
              <p className="text-xs text-text-dim mt-2">Send a recommendation or feedback to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === 'Admin';
              return (
                <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${isAdmin ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface-container text-on-surface rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <div className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-white/70' : 'text-text-dim'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your recommendation..."
              className="flex-1 bg-surface border border-outline-variant rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default RecommendationChatPanel;
