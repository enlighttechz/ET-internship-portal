import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Bell, Plus, Trash2, Settings, BookOpen, Award } from 'lucide-react';
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
  const [cOrder, setCOrder] = useState(1);

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
      category: cCategory, title: cTitle, type: cType, body: cBody, videoUrl: cVideoUrl, order: Number(cOrder)
    });
    setCTitle(''); setCBody(''); setCVideoUrl(''); setCOrder(cOrder + 1);
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
          <h1 className="font-headline-lg text-4xl font-bold text-primary tracking-tight mb-2">Enlight Techz</h1>
          <p className="font-label-md text-text-dim uppercase tracking-widest text-sm">Loading Admin Panel...</p>
          
          <div className="mt-12 flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up" style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img src={ETLogo} alt="Enlight Techz Logo" style={{ height: '44px', objectFit: 'contain' }} loading="lazy" />
        <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Admin Dashboard</h1>
      </div>

      <div className="grid" style={{ marginBottom: '40px' }}>
        {/* Manage Notifications */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Bell size={20} color="var(--primary)" />
            Manage Notifications
          </h3>
          
          <form onSubmit={addNotification} style={{ marginBottom: '20px' }}>
            <textarea 
              placeholder="Notification Message..." 
              value={newNotifMsg}
              onChange={(e) => setNewNotifMsg(e.target.value)}
              rows="3"
            ></textarea>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={newNotifDomain} onChange={(e) => setNewNotifDomain(e.target.value)} style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                <option value="all">All Domains</option>
                <option value="Web Development">Web Dev</option>
                <option value="App Development">App Dev</option>
                <option value="Data Science">Data Science</option>
                <option value="Cyber Security">Cyber Security</option>
              </select>
              <select value={newNotifType} onChange={(e) => setNewNotifType(e.target.value)} style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                <option value="general">General</option>
                <option value="alert">Alert</option>
                <option value="success">Success</option>
                <option value="submission">Submission Update</option>
              </select>
              <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
            </div>
          </form>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {notifications.map(n => (
              <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--glass)', padding: '2px 6px', borderRadius: '4px', marginRight: '5px' }}>{n.domain.toUpperCase()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{n.type.toUpperCase()}</span>
                  <p style={{ fontSize: '0.9rem', margin: '5px 0 0' }}>{n.message}</p>
                </div>
                <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => deleteNotification(n._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Learning Contents */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <BookOpen size={20} color="var(--primary)" />
            Content Management
          </h3>
          <form onSubmit={addContent}>
            <div className="flex-wrap-mobile" style={{ gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Category (e.g. HTML Tutorial)" value={cCategory} onChange={e => setCCategory(e.target.value)} required style={{ flex: '1 1 150px', marginBottom: '0' }} />
              <input type="text" placeholder="Title" value={cTitle} onChange={e => setCTitle(e.target.value)} required style={{ flex: '2 1 200px', marginBottom: '0' }} />
              <input type="number" placeholder="Order (Day)" value={cOrder} onChange={e => setCOrder(e.target.value)} required style={{ flex: '1 1 100px', marginBottom: '0' }} />
            </div>
            <select value={cType} onChange={e => setCType(e.target.value)}>
              <option value="text">Text Based</option>
              <option value="video">Video Based</option>
            </select>
            {cType === 'text' ? (
              <textarea placeholder="Learning Content (Text)" value={cBody} onChange={e => setCBody(e.target.value)} rows="3" required></textarea>
            ) : (
              <input type="text" placeholder="Video URL (YouTube/Drive)" value={cVideoUrl} onChange={e => setCVideoUrl(e.target.value)} required />
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Content</button>
          </form>

          <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '15px' }}>
            {contents.map(c => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.9rem' }}><b>{c.category}</b> - {c.order}. {c.title} ({c.type})</span>
                <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => deleteContent(c._id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Assessments Management */}
      <div className="card" style={{ marginBottom: '40px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Award size={20} color="var(--primary)" />
          Assessments Builder
        </h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Select Domain to Edit Assessment:</label>
            <select value={assessDomain} onChange={(e) => setAssessDomain(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="Web Development">Web Development</option>
              <option value="App Development">App Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="UI/UX Design">UI/UX Design</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={saveAssessment}>Save Assessment for {assessDomain}</button>
          </div>
        </div>
        
        <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ marginBottom: '15px' }}>Add Question</h4>
          <input type="text" placeholder="Question Text" value={qText} onChange={e => setQText(e.target.value)} />
          <div className="grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Option 1" value={opt0} onChange={e => setOpt0(e.target.value)} />
            <input type="text" placeholder="Option 2" value={opt1} onChange={e => setOpt1(e.target.value)} />
            <input type="text" placeholder="Option 3" value={opt2} onChange={e => setOpt2(e.target.value)} />
            <input type="text" placeholder="Option 4" value={opt3} onChange={e => setOpt3(e.target.value)} />
          </div>
          <div className="flex-wrap-mobile" style={{ alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <label style={{ fontSize: '0.9rem' }}>Correct Answer:</label>
            <select value={correctIdx} onChange={e => setCorrectIdx(e.target.value)} style={{ width: '150px', marginBottom: 0 }}>
              <option value={0}>Option 1</option>
              <option value={1}>Option 2</option>
              <option value={2}>Option 3</option>
              <option value={3}>Option 4</option>
            </select>
            <button className="btn btn-outline" onClick={addQuestion} style={{ marginLeft: 'auto' }}>Add Question</button>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4>Current Questions ({assessQuestions.length})</h4>
          {assessQuestions.map((q, idx) => (
            <div key={idx} style={{ padding: '15px', background: 'var(--glass)', borderRadius: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '500', marginBottom: '5px' }}>Q{idx + 1}: {q.questionText}</p>
                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                  {q.options.map((opt, oIdx) => (
                    <li key={oIdx} style={{ color: oIdx === q.correctAnswerIndex ? 'var(--primary)' : 'inherit', fontWeight: oIdx === q.correctAnswerIndex ? 'bold' : 'normal' }}>
                      {opt} {oIdx === q.correctAnswerIndex && '(Correct)'}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="btn btn-danger" onClick={() => removeQuestion(idx)} style={{ alignSelf: 'flex-start', padding: '5px 10px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Student List & Management */}
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Student Management</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name / Email / Domain</th>
                <th>Learning Progress</th>
                <th>Assessment Score</th>
                <th>Attendance %</th>
                <th>Projects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{s.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{s.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{s.domain}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Day {s.learningProgress}</span> / {contents.length}
                  </td>
                  <td>
                    {s.assessmentScore !== null ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{s.assessmentScore}%</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Not Taken</span>
                    )}
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={s.attendance} 
                      onChange={(e) => updateStudent(s._id, 'attendance', Number(e.target.value))}
                      style={{ width: '70px', marginBottom: 0, padding: '5px' }}
                      min="0" max="100"
                    />
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', marginBottom: '5px' }}>
                      Mini: 
                      <select value={s.weekendProjectStatus} onChange={(e) => updateStudent(s._id, 'weekendProjectStatus', e.target.value)} style={{ padding: '2px', marginLeft: '5px' }}>
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Evaluated">Evaluated</option>
                      </select>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      Final:
                      <select value={s.finalProjectStatus} onChange={(e) => updateStudent(s._id, 'finalProjectStatus', e.target.value)} style={{ padding: '2px', marginLeft: '5px' }}>
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Evaluated">Evaluated</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => deleteStudent(s._id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
