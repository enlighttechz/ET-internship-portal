import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Bell, Plus, Trash2, Settings, BookOpen, Award, CheckCircle, Lock, PlayCircle, Clock, Upload, GraduationCap, Video, FileText, Image as ImageIcon, CheckSquare, XSquare } from 'lucide-react';
import ETLogo from '../assets/ET.png';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Notification Form
  const [newNotifMsg, setNewNotifMsg] = useState('');
  const [newNotifType, setNewNotifType] = useState('general');
  const [newNotifDomain, setNewNotifDomain] = useState('all');

  // New Content Form
  const [cCategory, setCCategory] = useState('HTML Tutorial');
  const [cTitle, setCTitle] = useState('');
  const [cType, setCType] = useState('text');
  const [cBody, setCBody] = useState('');
  const [cVideoUrl, setCVideoUrl] = useState('');
  const [cImageUrl, setCImageUrl] = useState('');
  const [cOrder, setCOrder] = useState(1);
  const [cDomain, setCDomain] = useState('All');

  // Assessment Form
  const [assessDomain, setAssessDomain] = useState('Web Development');
  const [assessQuestions, setAssessQuestions] = useState([]);
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchStudents(),
      fetchNotifications(),
      fetchContents(),
      fetchAssessment(assessDomain)
    ]).then(() => setIsLoading(false));
  }, [assessDomain]);

  const fetchStudents = async () => {
    const res = await axios.get(`${API_URL}/students`);
    setStudents(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get(`${API_URL}/notifications`);
    setNotifications(res.data);
  };

  const fetchContents = async () => {
    const res = await axios.get(`${API_URL}/contents`);
    setContents(res.data);
  };

  const fetchAssessment = async (domain) => {
    const res = await axios.get(`${API_URL}/assessments/${domain}`);
    if (res.data && res.data.questions) {
      setAssessQuestions(res.data.questions);
    } else {
      setAssessQuestions([]);
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm('Delete this student?')) {
      await axios.delete(`${API_URL}/students/${id}`);
      fetchStudents();
    }
  };

  const updateStudent = async (id, field, value) => {
    await axios.put(`${API_URL}/students/${id}`, { [field]: value });
    fetchStudents();
  };

  const addNotification = async (e) => {
    e.preventDefault();
    if (!newNotifMsg) return;
    await axios.post(`${API_URL}/notifications`, { message: newNotifMsg, type: newNotifType, domain: newNotifDomain });
    setNewNotifMsg('');
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await axios.delete(`${API_URL}/notifications/${id}`);
    fetchNotifications();
  };

  const addContent = async (e) => {
    e.preventDefault();
    if (!cTitle) return;
    await axios.post(`${API_URL}/contents`, {
      category: cCategory, title: cTitle, type: cType, body: cBody, videoUrl: cVideoUrl, imageUrl: cImageUrl, order: Number(cOrder), domain: cDomain
    });
    setCTitle(''); setCBody(''); setCVideoUrl(''); setCImageUrl(''); setCOrder(cOrder + 1);
    fetchContents();
  };

  const deleteContent = async (id) => {
    await axios.delete(`${API_URL}/contents/${id}`);
    fetchContents();
  };

  const addQuestion = () => {
    if(!qText || !opt0 || !opt1 || !opt2 || !opt3) return alert('Fill all options');
    const newQ = {
      questionText: qText,
      options: [opt0, opt1, opt2, opt3],
      correctAnswerIndex: Number(correctIdx)
    };
    setAssessQuestions([...assessQuestions, newQ]);
    setQText(''); setOpt0(''); setOpt1(''); setOpt2(''); setOpt3(''); setCorrectIdx(0);
  };

  const removeQuestion = (idx) => {
    const newQs = [...assessQuestions];
    newQs.splice(idx, 1);
    setAssessQuestions(newQs);
  };

  const saveAssessment = async () => {
    await axios.post(`${API_URL}/assessments`, {
      domain: assessDomain,
      questions: assessQuestions
    });
    alert('Assessment saved successfully!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container-highest">
        <div className="flex flex-col items-center animate-slide-up">
          <div className="w-32 h-32 bg-primary/5 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10 mb-6 p-4">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-full h-full object-contain animate-pulse" loading="lazy" />
          </div>
          <p className="font-label-md text-text-dim uppercase tracking-widest text-sm">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
      <header className="w-full bg-surface border-b border-outline-variant/30 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <img src={ETLogo} alt="Enlight Techz Logo" className="w-8 h-8 object-contain" />
            <span className="font-headline-md text-lg font-bold text-primary truncate">Enlight Techz Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 w-full flex-grow">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-headline-xl font-bold text-primary mb-3">Admin Dashboard</h1>
          <p className="text-text-dim text-lg font-medium">Manage students, content, and system notifications.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Notifications Panel */}
          <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md">
            <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              Broadcast Notifications
            </h3>
            
            <form onSubmit={addNotification} className="space-y-4 mb-6">
              <div>
                <textarea 
                  placeholder="Type your notification message here..." 
                  value={newNotifMsg}
                  onChange={(e) => setNewNotifMsg(e.target.value)}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={newNotifDomain} onChange={(e) => setNewNotifDomain(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest">
                  <option value="all">All Domains</option>
                  <option value="Web Development">Web Development</option>
                  <option value="App Development">App Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
                <select value={newNotifType} onChange={(e) => setNewNotifType(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest">
                  <option value="general">General</option>
                  <option value="alert">Alert</option>
                  <option value="success">Success</option>
                  <option value="submission">Submission Update</option>
                </select>
                <button type="submit" className="bg-primary text-white p-3 rounded-xl hover:bg-primary-container font-bold flex items-center justify-center gap-2 transition-colors">
                  <Plus size={20} /> Publish
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {notifications.map(n => (
                <div key={n._id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container-highest text-text-dim">{n.domain}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${n.type === 'alert' ? 'bg-error/10 text-error' : n.type === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{n.type}</span>
                    </div>
                    <p className="text-sm text-text-primary">{n.message}</p>
                  </div>
                  <button onClick={() => deleteNotification(n._id)} className="text-error/70 hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10 shrink-0">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-text-dim text-sm text-center py-4">No active notifications</p>}
            </div>
          </div>

          {/* Content Builder Panel */}
          <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md">
            <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <BookOpen size={20} className="text-secondary" />
              </div>
              Content Manager
            </h3>
            
            <form onSubmit={addContent} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={cDomain} onChange={e => setCDomain(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest col-span-1">
                  <option value="All">All Domains</option>
                  <option value="Web Development">Web Dev</option>
                  <option value="App Development">App Dev</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
                <input type="text" placeholder="Category (e.g. HTML Basics)" value={cCategory} onChange={e => setCCategory(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest col-span-1" required />
                <input type="number" placeholder="Order / Day Index" value={cOrder} onChange={e => setCOrder(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest col-span-1" required />
              </div>
              
              <div className="flex gap-3">
                <input type="text" placeholder="Module Title" value={cTitle} onChange={e => setCTitle(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest" required />
                <select value={cType} onChange={e => setCType(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest w-32 shrink-0">
                  <option value="text">Text Based</option>
                  <option value="video">Video Based</option>
                  <option value="image">Image Based</option>
                </select>
              </div>

              {cType === 'text' ? (
                <textarea placeholder="Markdown / Text Body..." value={cBody} onChange={e => setCBody(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest min-h-[100px]" required />
              ) : cType === 'video' ? (
                <input type="text" placeholder="Video Link (YouTube Embed or Drive Link)..." value={cVideoUrl} onChange={e => setCVideoUrl(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest" required />
              ) : (
                <input type="text" placeholder="Image URL..." value={cImageUrl} onChange={e => setCImageUrl(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest" required />
              )}
              
              <button type="submit" className="w-full bg-secondary text-white p-3 rounded-xl hover:bg-secondary-container font-bold flex items-center justify-center gap-2 transition-colors">
                <Plus size={20} /> Add Course Module
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {contents.map(c => (
                <div key={c._id} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 truncate">
                    {c.type === 'video' ? <Video size={16} className="text-secondary shrink-0" /> : c.type === 'image' ? <ImageIcon size={16} className="text-accent shrink-0" /> : <FileText size={16} className="text-primary shrink-0" />}
                    <div className="truncate">
                      <div className="flex gap-2 items-center mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Day {c.order}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 rounded">{c.domain}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{c.title}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteContent(c._id)} className="text-error/70 hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error/10 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {contents.length === 0 && <p className="text-text-dim text-sm text-center py-4">No content modules found</p>}
            </div>
          </div>
        </div>

        {/* Assessment Builder */}
        <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Award size={20} className="text-accent" />
              </div>
              Final Assessment Builder
            </h3>
            <div className="flex items-center gap-3">
              <select value={assessDomain} onChange={(e) => setAssessDomain(e.target.value)} className="p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest font-medium text-sm">
                <option value="Web Development">Web Development</option>
                <option value="App Development">App Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="UI/UX Design">UI/UX Design</option>
              </select>
              <button onClick={saveAssessment} className="bg-accent text-white px-5 py-2.5 rounded-xl hover:bg-accent/90 font-bold transition-colors shadow-sm whitespace-nowrap text-sm">
                Save Assessment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 h-fit">
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-text-dim">Add New Question</h4>
              <div className="space-y-3">
                <textarea placeholder="Question Text..." value={qText} onChange={e => setQText(e.target.value)} className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none min-h-[80px] text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Option 1" value={opt0} onChange={e => setOpt0(e.target.value)} className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm" />
                  <input type="text" placeholder="Option 2" value={opt1} onChange={e => setOpt1(e.target.value)} className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm" />
                  <input type="text" placeholder="Option 3" value={opt2} onChange={e => setOpt2(e.target.value)} className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm" />
                  <input type="text" placeholder="Option 4" value={opt3} onChange={e => setOpt3(e.target.value)} className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Correct Answer Index</label>
                  <select value={correctIdx} onChange={e => setCorrectIdx(e.target.value)} className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface focus:border-accent outline-none text-sm font-medium">
                    <option value={0}>Option 1</option>
                    <option value={1}>Option 2</option>
                    <option value={2}>Option 3</option>
                    <option value={3}>Option 4</option>
                  </select>
                </div>
                <button onClick={addQuestion} className="w-full bg-surface-container-highest hover:bg-outline-variant/30 text-on-surface p-2.5 rounded-lg font-bold transition-colors text-sm border border-outline-variant/50 mt-2">
                  Append Question
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <h4 className="font-bold text-sm mb-2 uppercase tracking-wider text-text-dim">Current Questions ({assessQuestions.length})</h4>
              {assessQuestions.map((q, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-on-surface mb-3"><span className="text-accent font-bold mr-1">Q{idx + 1}.</span> {q.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`text-xs flex items-center gap-2 p-1.5 rounded-md ${oIdx === q.correctAnswerIndex ? 'bg-success/10 text-success font-bold' : 'text-text-dim'}`}>
                          {oIdx === q.correctAnswerIndex ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-current opacity-50" />}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeQuestion(idx)} className="text-error/70 hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error/10 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {assessQuestions.length === 0 && <p className="text-text-dim text-sm py-4">No questions added yet.</p>}
            </div>
          </div>
        </div>

        {/* Student Management Table */}
        <div className="glass-card bg-surface rounded-2xl border border-outline-variant/20 shadow-md overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">Student Overview & Management</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-container-lowest text-text-dim uppercase tracking-wider text-xs font-bold border-b border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4">Intern Info</th>
                  <th className="px-6 py-4">Progress & Att.</th>
                  <th className="px-6 py-4">Projects (Mini / Final)</th>
                  <th className="px-6 py-4">Assessment</th>
                  <th className="px-6 py-4">Certificate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{s.name}</div>
                      <div className="text-xs text-text-dim">{s.email}</div>
                      <div className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest bg-primary/10 inline-block px-1.5 rounded">{s.domain}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={14} className="text-secondary" />
                        <span className="font-bold">Day {s.learningProgress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary" />
                        <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded p-0.5 w-fit">
                          <input 
                            type="number" 
                            value={s.attendance} 
                            onChange={(e) => updateStudent(s._id, 'attendance', Number(e.target.value))}
                            className="w-12 text-center text-xs font-bold bg-transparent outline-none"
                            min="0" max="100"
                          />
                          <span className="text-xs font-bold text-text-dim pr-1">%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {/* Mini Project */}
                        <div className="flex items-center justify-between gap-3 text-xs bg-surface-container-lowest p-1.5 rounded border border-outline-variant/50">
                          <span className="font-bold text-text-dim min-w-[30px]">Mini:</span>
                          {s.weekendProjectLink ? (
                            <a href={s.weekendProjectLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[80px] font-medium" title={s.weekendProjectLink}>Link</a>
                          ) : (
                            <span className="text-[10px] text-text-dim italic">No Link</span>
                          )}
                          <select 
                            value={s.weekendProjectStatus} 
                            onChange={(e) => updateStudent(s._id, 'weekendProjectStatus', e.target.value)} 
                            className={`p-1 rounded font-bold text-[10px] uppercase tracking-wider outline-none ${s.weekendProjectStatus === 'Evaluated' ? 'bg-success/20 text-success' : s.weekendProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-surface-container-highest text-text-dim'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Evaluated">Evaluated</option>
                          </select>
                        </div>
                        {/* Final Project */}
                        <div className="flex items-center justify-between gap-3 text-xs bg-surface-container-lowest p-1.5 rounded border border-outline-variant/50">
                          <span className="font-bold text-text-dim min-w-[30px]">Final:</span>
                          {s.finalProjectLink ? (
                            <a href={s.finalProjectLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline truncate max-w-[80px] font-medium" title={s.finalProjectLink}>Link</a>
                          ) : (
                            <span className="text-[10px] text-text-dim italic">No Link</span>
                          )}
                          <select 
                            value={s.finalProjectStatus} 
                            onChange={(e) => updateStudent(s._id, 'finalProjectStatus', e.target.value)} 
                            className={`p-1 rounded font-bold text-[10px] uppercase tracking-wider outline-none ${s.finalProjectStatus === 'Evaluated' ? 'bg-success/20 text-success' : s.finalProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-surface-container-highest text-text-dim'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Evaluated">Evaluated</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.assessmentScore !== null ? (
                        <div className="inline-flex items-center justify-center bg-accent/10 text-accent font-bold px-3 py-1.5 rounded-lg border border-accent/20">
                          {s.assessmentScore}%
                        </div>
                      ) : (
                        <span className="text-xs text-text-dim italic bg-surface-container-highest px-2 py-1 rounded">Not Taken</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => updateStudent(s._id, 'certificateIssued', !s.certificateIssued)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${s.certificateIssued ? 'bg-success/10 text-success border-success/30 hover:bg-success/20' : 'bg-surface-container-highest text-text-dim border-outline-variant/30 hover:bg-outline-variant/20'}`}
                      >
                        {s.certificateIssued ? <CheckSquare size={14} /> : <XSquare size={14} />}
                        {s.certificateIssued ? 'Issued' : 'Hold'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteStudent(s._id)} className="text-error/70 hover:text-error bg-surface-container-lowest hover:bg-error/10 p-2 rounded-lg transition-colors border border-outline-variant/30 hover:border-error/30">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-text-dim">No students registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
