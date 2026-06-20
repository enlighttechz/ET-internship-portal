import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2 } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminNotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [newNotifMsg, setNewNotifMsg] = useState('');
  const [newNotifType, setNewNotifType] = useState('general');
  const [newNotifDomain, setNewNotifDomain] = useState('all');

  useEffect(() => {
    fetchNotifications();
    fetchCourses();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch(err) { console.error(err); }
  };

  const addNotification = async (e) => {
    e.preventDefault();
    if (!newNotifMsg) return;
    try {
      await axios.post(`${API_URL}/notifications`, { message: newNotifMsg, type: newNotifType, domain: newNotifDomain });
      setNewNotifMsg('');
      fetchNotifications();
    } catch(err) { alert('Failed to publish'); }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      fetchNotifications();
    } catch(err) { console.error(err); }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">Notification Manager</h1>
        <p className="text-text-dim text-md font-medium">Broadcast alerts and general messages to students.</p>
      </div>

      <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          Create Broadcast
        </h3>
        
        <form onSubmit={addNotification} className="space-y-4 mb-8">
          <div>
            <textarea 
              placeholder="Type your notification message here..." 
              value={newNotifMsg}
              onChange={(e) => setNewNotifMsg(e.target.value)}
              className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] text-base"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Target Audience</label>
              <select value={newNotifDomain} onChange={(e) => setNewNotifDomain(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary">
                <option value="all">All Domains</option>
                {courses.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Message Type</label>
              <select value={newNotifType} onChange={(e) => setNewNotifType(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary">
                <option value="general">General (Blue)</option>
                <option value="alert">Alert (Red)</option>
                <option value="success">Success (Green)</option>
                <option value="submission">Submission Update (Purple)</option>
              </select>
            </div>
            <div className="flex items-end shrink-0">
              <button type="submit" className="bg-success text-white px-8 py-3 rounded-xl hover:bg-[#15803d] font-bold flex items-center justify-center gap-2 transition-colors shadow-md h-[50px] w-full sm:w-auto">
                <Plus size={20} /> Publish
              </button>
            </div>
          </div>
        </form>

        <h4 className="font-bold text-lg mb-4">Active Broadcasts</h4>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {notifications.map(n => (
            <div key={n._id} className={`p-5 rounded-xl border flex justify-between items-start gap-4 shadow-sm ${n.type === 'alert' ? 'bg-error/5 border-error/30' : n.type === 'success' ? 'bg-success/5 border-success/30' : 'bg-surface-container-lowest border-outline-variant/30'}`}>
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container-highest text-text-dim border border-outline-variant/50">{n.domain}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${n.type === 'alert' ? 'bg-error/10 text-error border-error/20' : n.type === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>{n.type}</span>
                </div>
                <p className="text-base text-text-primary">{n.message}</p>
                <p className="text-xs text-text-dim mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => deleteNotification(n._id)} className="text-error bg-error/10 hover:bg-error hover:text-white transition-colors p-2.5 rounded-lg shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
              <p className="text-text-dim font-medium">No active notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationManager;
