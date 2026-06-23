import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, CheckCircle, Trash2, Plus } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminAssessmentBuilder = () => {
  const [courses, setCourses] = useState([]);
  const [assessDomain, setAssessDomain] = useState('');
  const [assessQuestions, setAssessQuestions] = useState([]);
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [formUrl, setFormUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (assessDomain) fetchAssessment(assessDomain);
  }, [assessDomain]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
      if (res.data.length > 0) {
        setAssessDomain(res.data[0].title);
      }
    } catch(err) { console.error(err); }
  };

  const fetchAssessment = async (domain) => {
    try {
      const res = await axios.get(`${API_URL}/assessments/${domain}`);
      if (res.data && res.data.questions) {
        setAssessQuestions(res.data.questions);
      } else {
        setAssessQuestions([]);
      }
    } catch(err) { console.error(err); }
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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const lines = csvText.split('\n');
      const newQuestions = [];

      const parseCSV = (str) => {
        const arr = [];
        let quote = false;
        let val = '';
        for (let c of str) {
            if (c === '"' && !quote) { quote = true; }
            else if (c === '"' && quote) { quote = false; }
            else if (c === ',' && !quote) { arr.push(val); val = ''; }
            else { val += c; }
        }
        arr.push(val);
        return arr.map(v => v.trim());
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const matches = parseCSV(line);
        if (matches.length >= 6) {
           const [q, o1, o2, o3, o4, ans] = matches;
           if (q.toLowerCase() === 'question' || q.toLowerCase() === 'questions' || q.toLowerCase().includes('question')) continue; 
           
           let correctIdx = parseInt(ans) - 1;
           if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) correctIdx = 0;

           newQuestions.push({
             questionText: q,
             options: [o1, o2, o3, o4],
             correctAnswerIndex: correctIdx
           });
        }
      }

      if (newQuestions.length > 0) {
        setAssessQuestions(prev => [...prev, ...newQuestions]);
        alert(`Successfully loaded ${newQuestions.length} questions!`);
      } else {
        alert("No valid questions found. Ensure format is: Question, Opt1, Opt2, Opt3, Opt4, CorrectAnswer(1-4)");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const saveAssessment = async () => {
    try {
      await axios.post(`${API_URL}/assessments`, {
        domain: assessDomain,
        questions: assessQuestions
      });
      alert('Assessment saved successfully!');
    } catch(err) { alert('Failed to save assessment'); }
  };

  const importFromGoogleForm = async () => {
    if (!formUrl) return alert("Please enter a Google Form URL");
    setIsImporting(true);
    try {
      const res = await axios.post(`${API_URL}/assessments/import-form`, { url: formUrl });
      if (res.data && res.data.questions && res.data.questions.length > 0) {
        setAssessQuestions(prev => [...prev, ...res.data.questions]);
        alert(`Successfully imported ${res.data.questions.length} questions from Google Form! (Please review correct answers)`);
        setFormUrl('');
      } else {
        alert("No questions found in the form.");
      }
    } catch(err) {
      alert(err.response?.data?.msg || "Failed to import form. Make sure it's a valid, public Google Form link.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">Final Assessment Builder</h1>
          <p className="text-text-dim text-md font-medium">Create and manage final MCQs for each course domain.</p>
        </div>
        <button onClick={saveAssessment} className="bg-success text-white px-6 py-3 rounded-xl hover:bg-[#15803d] font-bold transition-colors shadow-md flex items-center gap-2 shrink-0">
          <Award size={20} /> Save Assessment
        </button>
      </div>

      <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md">
        <div className="mb-6">
          <label className="block text-sm font-bold text-text-dim uppercase tracking-wider mb-2">Select Domain to Edit</label>
          <select value={assessDomain} onChange={(e) => setAssessDomain(e.target.value)} className="w-full max-w-sm p-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none">
            {courses.length > 0 ? courses.map(c => <option key={c._id} value={c.title}>{c.title}</option>) : <option value="">Loading courses...</option>}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Form */}
          <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm h-fit">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={20} className="text-primary" /> Add New Question
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Question</label>
                <textarea placeholder="Type the question..." value={qText} onChange={e => setQText(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] text-sm resize-y" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider block">Options</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Option 1" value={opt0} onChange={e => setOpt0(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none text-sm" />
                  <input type="text" placeholder="Option 2" value={opt1} onChange={e => setOpt1(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none text-sm" />
                  <input type="text" placeholder="Option 3" value={opt2} onChange={e => setOpt2(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none text-sm" />
                  <input type="text" placeholder="Option 4" value={opt3} onChange={e => setOpt3(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Correct Answer</label>
                <select value={correctIdx} onChange={e => setCorrectIdx(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface focus:border-success focus:ring-1 focus:ring-success outline-none text-sm font-medium">
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>
              <button onClick={addQuestion} className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 hover:border-primary p-3 rounded-xl font-bold transition-colors text-sm mt-4 flex items-center justify-center gap-2">
                <Plus size={18} /> Append to Test
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h4 className="font-bold text-lg">Current Questions ({assessQuestions.length})</h4>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste Google Form Link..." 
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="p-2 text-sm rounded-xl border border-outline-variant bg-surface focus:border-primary outline-none min-w-[200px]"
                  />
                  <button 
                    onClick={importFromGoogleForm}
                    disabled={isImporting}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-xl font-bold text-sm transition-colors border border-primary/20 disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : 'Import Form'}
                  </button>
                </div>
                <label className="bg-accent/10 text-accent hover:bg-accent/20 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm border border-accent/20 flex-shrink-0">
                  Bulk Upload CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                </label>
              </div>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {assessQuestions.map((q, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex justify-between items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-medium text-base text-on-surface mb-4"><span className="text-primary font-bold mr-2 text-lg">Q{idx + 1}.</span> {q.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`text-sm flex items-center gap-3 p-2.5 rounded-lg border ${oIdx === q.correctAnswerIndex ? 'bg-success/10 text-success font-bold border-success/30' : 'text-text-dim border-transparent bg-surface'}`}>
                          {oIdx === q.correctAnswerIndex ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeQuestion(idx)} className="text-error bg-error/10 hover:bg-error hover:text-white transition-colors p-2.5 rounded-xl shrink-0 shadow-sm mt-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {assessQuestions.length === 0 && (
                <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                  <Award size={48} className="mx-auto text-text-dim opacity-50 mb-3" />
                  <p className="text-text-dim font-medium">No questions added to this domain yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAssessmentBuilder;
