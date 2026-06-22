import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminSystemSettings = () => {
  const [geminiKeysInput, setGeminiKeysInput] = useState('');
  const [isCourseShuttered, setIsCourseShuttered] = useState(false);
  const [shutterNote, setShutterNote] = useState('');

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/system-config`);
      if (res.data) {
        if (res.data.geminiApiKeys) {
          setGeminiKeysInput(res.data.geminiApiKeys.join(',\n'));
        }
        setIsCourseShuttered(res.data.isCourseShuttered || false);
        setShutterNote(res.data.shutterNote || '');
      }
    } catch(err) { console.error(err); }
  };

  const updateSystemConfig = async (e) => {
    e.preventDefault();
    const keysArray = geminiKeysInput.split(',').map(k => k.trim()).filter(Boolean);
    try {
      await axios.put(`${API_URL}/system-config`, { geminiApiKeys: keysArray, isCourseShuttered, shutterNote });
      alert("System Config updated!");
    } catch(err) { alert("Error updating config."); }
  };

  const handleToggleShutter = async (checked) => {
    setIsCourseShuttered(checked);
    try {
      await axios.put(`${API_URL}/system-config`, { isCourseShuttered: checked });
    } catch(err) {
      console.error(err);
      setIsCourseShuttered(!checked); // Revert on fail
      alert("Failed to toggle shutter");
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">System Settings</h1>
        <p className="text-text-dim text-md font-medium">Configure global platform variables and API integrations.</p>
      </div>

      <div className="glass-card bg-surface rounded-2xl p-8 border border-outline-variant/20 shadow-md">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Settings size={20} className="text-accent" />
          </div>
          AI Service Configuration
        </h3>
        <form onSubmit={updateSystemConfig} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface uppercase tracking-wider mb-2">Gemini API Keys Pool (Comma Separated)</label>
            <textarea 
              value={geminiKeysInput} 
              onChange={e => setGeminiKeysInput(e.target.value)} 
              className="w-full p-5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-success focus:ring-1 focus:ring-success outline-none text-sm font-code min-h-[200px] shadow-inner"
              placeholder="AIzaSy..., AIzaSy..., ..."
            />
            <p className="text-sm text-text-dim mt-3 leading-relaxed">
              Add minimum 20 keys to prevent token expiry issues. The backend will round-robin these keys automatically. 
              If all keys fail, an urgent alert will be broadcasted to the Notification Manager.
            </p>
          </div>
          
          <div className="pt-4 border-t border-outline-variant/30">
            <label className="flex items-center justify-between cursor-pointer mb-4">
              <div>
                <span className="block text-sm font-bold text-on-surface uppercase tracking-wider">Course Page Shutter</span>
                <span className="text-sm text-text-dim block mt-1">If enabled, students will not be able to access the course content and will see a "Please visit this course after 1 hour" message, or your custom note below.</span>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isCourseShuttered} onChange={(e) => handleToggleShutter(e.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${isCourseShuttered ? 'bg-error' : 'bg-surface-container-highest'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isCourseShuttered ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
            {isCourseShuttered && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-xs font-bold text-text-dim mb-2 uppercase tracking-wider">Custom Shutter Note</label>
                <textarea 
                  value={shutterNote}
                  onChange={e => setShutterNote(e.target.value)}
                  placeholder="The course content is currently closed for maintenance or scheduled downtime. Please visit this course after 1 hour."
                  className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-error focus:ring-1 focus:ring-error outline-none text-sm min-h-[100px]"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-success text-white px-8 py-3 rounded-xl font-bold hover:bg-[#15803d] shadow-md transition-colors flex items-center gap-2">
              <Save size={20} /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
