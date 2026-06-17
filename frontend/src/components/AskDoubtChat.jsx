import React, { useState } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AskDoubtChat = ({ token, currentContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { text: question, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ask-doubt`, {
        question: userMessage.text,
        context: currentContent ? `${currentContent.title}: ${currentContent.body}` : 'No specific context.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, { text: res.data.answer, sender: 'gemini' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: "Failed to get an answer. Please try again later.", sender: 'gemini' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-container transition-all hover:scale-105 z-50 flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden h-[500px] max-h-[80vh]">
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <MessageCircle size={18} /> Ask a Doubt
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface">
            {messages.length === 0 && (
              <div className="text-center text-text-dim my-auto text-sm">
                Hi! Ask me anything about the current module.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-primary text-white self-end rounded-br-sm' : 'bg-surface-variant text-on-surface self-start rounded-bl-sm'}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-surface-variant text-on-surface self-start p-3 rounded-xl rounded-bl-sm max-w-[85%] text-sm flex gap-1 items-center">
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSend} className="p-3 bg-surface-container border-t border-outline-variant/20 flex gap-2 items-center">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..." 
              className="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="bg-primary text-white p-2 rounded-full disabled:opacity-50 hover:bg-primary-container transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AskDoubtChat;
