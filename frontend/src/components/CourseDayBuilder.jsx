import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Edit3, Eye, EyeOff, Video, FileText, Image as ImageIcon, Award, GripVertical, X, Bot } from 'lucide-react';
import axios from 'axios';
import RichTextEditor from './RichTextEditor';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const CourseDayBuilder = ({ course }) => {
  const [days, setDays] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Day form
  const [newDayNum, setNewDayNum] = useState(1);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDayDesc, setNewDayDesc] = useState('');

  useEffect(() => {
    if (isExpanded) {
      fetchDays();
    }
  }, [isExpanded]);

  const fetchDays = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/course-days/${course.title}`);
      setDays(res.data);
      if (res.data.length > 0) {
        setNewDayNum(Math.max(...res.data.map(d => d.dayNumber)) + 1);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addDay = async (e) => {
    e.preventDefault();
    if (!newDayTitle) return;
    try {
      await axios.post(`${API_URL}/course-days`, {
        domain: course.title,
        dayNumber: newDayNum,
        title: newDayTitle,
        description: newDayDesc,
        items: []
      });
      setNewDayTitle('');
      setNewDayDesc('');
      fetchDays();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteDay = async (id) => {
    if (!window.confirm("Delete this entire day and all its items?")) return;
    try {
      await axios.delete(`${API_URL}/course-days/${id}`);
      fetchDays();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden transition-all duration-300 mb-4">
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-lowest transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
          {course.title.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base text-text-primary truncate">{course.title} Curriculum Builder</h4>
          <p className="text-xs text-text-dim">{days.length} Days configured</p>
        </div>
        <div className="shrink-0">
          {isExpanded ? <ChevronUp size={20} className="text-text-dim" /> : <ChevronDown size={20} className="text-text-dim" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-outline-variant/30 p-4 bg-surface-container-lowest">
          {loading ? (
            <p className="text-center text-text-dim py-4 text-sm">Loading days...</p>
          ) : (
            <div className="space-y-6">
              {days.map(day => (
                <DayEditor key={day._id} day={day} onRefresh={fetchDays} />
              ))}
              
              {/* Add New Day */}
              <form onSubmit={addDay} className="bg-surface p-4 rounded-xl border border-dashed border-primary/50">
                <h5 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                  <Plus size={16} /> Add New Day
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <input type="number" value={newDayNum} onChange={e => setNewDayNum(Number(e.target.value))} className="p-2 rounded-lg border border-outline-variant text-sm" placeholder="Day #" required min="1" />
                  <input type="text" value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)} className="p-2 rounded-lg border border-outline-variant text-sm sm:col-span-3" placeholder="Day Title (e.g. Intro to Python)" required />
                </div>
                <div className="flex gap-3">
                  <input type="text" value={newDayDesc} onChange={e => setNewDayDesc(e.target.value)} className="flex-1 p-2 rounded-lg border border-outline-variant text-sm" placeholder="Short description..." />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                    Create Day
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DayEditor = ({ day, onRefresh }) => {
  const [items, setItems] = useState(day.items || []);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemType, setNewItemType] = useState('content');
  const [newItemContentForm, setNewItemContentForm] = useState({ title: '', contentType: 'text', body: '', videoUrl: '', imageUrl: '', formUrl: '', question: '', expectedAnswer: '', questions: [] });
  const [editingItemIdx, setEditingItemIdx] = useState(null);

  useEffect(() => {
    setItems(day.items || []);
  }, [day.items]);
  
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [editDayForm, setEditDayForm] = useState({ dayNumber: day.dayNumber, title: day.title, description: day.description || '' });
  
  // Drag and drop state
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDrop = async () => {
    const copyListItems = [...items];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    
    setItems(copyListItems);
    
    // Save to backend immediately
    try {
      await axios.put(`${API_URL}/course-days/${day._id}`, { items: copyListItems });
    } catch (err) {
      alert("Failed to reorder: " + err.message);
    }
  };

  const deleteItem = async (idx) => {
    if(!window.confirm("Delete this item?")) return;
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    try {
      await axios.put(`${API_URL}/course-days/${day._id}`, { items: newItems });
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const startEditItem = (idx) => {
    const item = items[idx];
    setEditingItemIdx(idx);
    setNewItemType(item.itemType || 'content');
    setNewItemContentForm({
      title: item.title || '',
      contentType: item.contentType || 'text',
      body: item.body || '',
      videoUrl: item.videoUrl || '',
      imageUrl: item.imageUrl || '',
      formUrl: item.formUrl || '',
      question: item.question || '',
      expectedAnswer: item.expectedAnswer || '',
      questions: item.questions || []
    });
    setIsAddingItem(true);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const newItem = {
      itemType: newItemType,
      title: newItemType === 'content' ? newItemContentForm.title : newItemType === 'ai_qa' ? newItemContentForm.title : 'Assessment Block',
    };
    
    if (newItemType === 'content') {
      newItem.contentType = newItemContentForm.contentType;
      newItem.body = newItemContentForm.body;
      newItem.videoUrl = newItemContentForm.videoUrl;
      newItem.imageUrl = newItemContentForm.imageUrl;
    } else if (newItemType === 'ai_qa') {
      newItem.question = newItemContentForm.question;
      newItem.expectedAnswer = newItemContentForm.expectedAnswer;
    } else {
      newItem.questions = newItemContentForm.questions;
    }

    let newItems;
    if (editingItemIdx !== null) {
      newItems = [...items];
      newItems[editingItemIdx] = { ...newItems[editingItemIdx], ...newItem };
    } else {
      newItems = [...items, newItem];
    }

    setItems(newItems);
    setIsAddingItem(false);
    setEditingItemIdx(null);
    try {
      const res = await axios.put(`${API_URL}/course-days/${day._id}`, { items: newItems });
      if (res.data && res.data.items) {
        setItems(res.data.items);
      }
      setNewItemContentForm({ title: '', contentType: 'text', body: '', videoUrl: '', imageUrl: '', formUrl: '', question: '', expectedAnswer: '', questions: [] });
    } catch (err) {
      alert("Failed to add item: " + err.message);
    }
  };

  const toggleVisibility = async () => {
    try {
      await axios.put(`${API_URL}/course-days/${day._id}`, { hidden: !day.hidden });
      onRefresh();
    } catch (err) {
      alert("Failed to update visibility: " + err.message);
    }
  };

  const handleEditDay = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/course-days/${day._id}`, editDayForm);
      setIsEditingDay(false);
      onRefresh();
    } catch (err) {
      alert("Failed to update day: " + err.message);
    }
  };

  const handleDeleteDay = async () => {
    if(!window.confirm(`Are you sure you want to delete Day ${day.dayNumber}: ${day.title}? This will also delete all items inside it.`)) return;
    try {
      await axios.delete(`${API_URL}/course-days/${day._id}`);
      onRefresh();
    } catch (err) {
      alert("Failed to delete day: " + err.message);
    }
  };

  return (
    <div className={`bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm transition-opacity ${day.hidden ? 'opacity-60' : ''}`}>
      <div className="bg-surface-container-highest px-4 py-3 flex justify-between items-center border-b border-outline-variant/30">
        {isEditingDay ? (
          <form onSubmit={handleEditDay} className="flex-1 flex gap-2 items-center mr-4">
            <input type="number" value={editDayForm.dayNumber} onChange={e => setEditDayForm({...editDayForm, dayNumber: Number(e.target.value)})} className="w-16 p-1.5 rounded border border-outline-variant text-sm bg-surface" required min="1" placeholder="Day #" />
            <input type="text" value={editDayForm.title} onChange={e => setEditDayForm({...editDayForm, title: e.target.value})} className="flex-1 p-1.5 rounded border border-outline-variant text-sm bg-surface" required placeholder="Title" />
            <input type="text" value={editDayForm.description} onChange={e => setEditDayForm({...editDayForm, description: e.target.value})} className="flex-1 p-1.5 rounded border border-outline-variant text-sm bg-surface" placeholder="Description" />
            <button type="submit" className="p-1.5 bg-primary text-white rounded hover:bg-primary/90"><Save size={18} /></button>
            <button type="button" onClick={() => setIsEditingDay(false)} className="p-1.5 bg-surface-container text-text-dim rounded hover:text-text-primary border border-outline-variant"><X size={18} /></button>
          </form>
        ) : (
          <div>
            <h5 className="font-bold text-on-surface flex items-center gap-2">
              Day {day.dayNumber}: {day.title}
              {day.hidden && <span className="bg-outline-variant text-text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Hidden</span>}
            </h5>
            {day.description && <p className="text-xs text-text-dim mt-0.5">{day.description}</p>}
          </div>
        )}
        
        {!isEditingDay && (
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => setIsEditingDay(true)} 
              className="p-1.5 rounded-lg text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit Module"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={toggleVisibility} 
              className={`p-1.5 rounded-lg transition-colors ${day.hidden ? 'text-primary hover:bg-primary/10' : 'text-text-dim hover:bg-surface-container'}`}
              title={day.hidden ? "Show Module" : "Hide Module"}
            >
              {day.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={handleDeleteDay} className="p-1.5 rounded-lg text-error/70 hover:text-error hover:bg-error/10 transition-colors" title="Delete Module">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-surface-container-lowest">
        {items.length === 0 ? (
          <p className="text-xs text-text-dim italic mb-4">No items in this day yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 bg-white border border-outline-variant/50 p-3 rounded-lg shadow-sm group"
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="cursor-grab active:cursor-grabbing text-text-dim hover:text-primary">
                  <GripVertical size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.itemType === 'assessment' ? 'bg-accent/10 text-accent' : item.itemType === 'ai_qa' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                      {item.itemType}
                    </span>
                    {item.contentType === 'video' && <Video size={12} className="text-text-dim" />}
                    {item.contentType === 'image' && <ImageIcon size={12} className="text-text-dim" />}
                    {item.itemType === 'ai_qa' && <Bot size={12} className="text-text-dim" />}
                    <span className="text-sm font-bold text-text-primary">{item.title}</span>
                  </div>
                  {item.itemType === 'assessment' && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-bold text-accent">Google Form Assessment</p>
                      <p className="text-[10px] text-text-dim truncate max-w-xs">{item.formUrl || 'No URL provided'}</p>
                    </div>
                  )}
                  {item.itemType === 'ai_qa' && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-bold text-success">Automated Q&A</p>
                      <p className="text-[10px] text-text-dim truncate max-w-xs">{item.question}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditItem(idx)} className="text-primary/70 hover:text-primary p-1.5 bg-primary/5 rounded-md hover:bg-primary/10">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteItem(idx)} className="text-error/70 hover:text-error p-1.5 bg-error/5 rounded-md hover:bg-error/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddingItem ? (
          <form onSubmit={handleAddItem} className="bg-surface p-4 rounded-lg border border-outline-variant mt-2 shadow-sm">
            <div className="flex gap-4 mb-4 border-b border-outline-variant/30 pb-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input type="radio" checked={newItemType === 'content'} onChange={() => setNewItemType('content')} className="accent-primary" />
                Content Block
              </label>
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-accent">
                <input type="radio" checked={newItemType === 'assessment'} onChange={() => setNewItemType('assessment')} className="accent-accent" />
                Assessment Block
              </label>
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-success">
                <input type="radio" checked={newItemType === 'ai_qa'} onChange={() => setNewItemType('ai_qa')} className="accent-success" />
                AI Q&A Block
              </label>
            </div>

            {newItemType === 'content' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input type="text" placeholder="Content Title" value={newItemContentForm.title} onChange={e => setNewItemContentForm({...newItemContentForm, title: e.target.value})} className="flex-1 p-2 rounded-md border text-sm" required />
                  <select value={newItemContentForm.contentType} onChange={e => setNewItemContentForm({...newItemContentForm, contentType: e.target.value})} className="w-32 p-2 rounded-md border text-sm">
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                {newItemContentForm.contentType === 'text' && (
                  <div className="mt-2 mb-4">
                    <RichTextEditor 
                      value={newItemContentForm.body} 
                      onChange={(html) => setNewItemContentForm({...newItemContentForm, body: html})}
                      placeholder="Start writing your HTML content..."
                    />
                  </div>
                )}
                {newItemContentForm.contentType === 'video' && (
                  <input type="text" placeholder="Video Embed URL" value={newItemContentForm.videoUrl} onChange={e => setNewItemContentForm({...newItemContentForm, videoUrl: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                )}
                {newItemContentForm.contentType === 'image' && (
                  <input type="text" placeholder="Image URL (Comma separate for multiple images to create a carousel)" value={newItemContentForm.imageUrl} onChange={e => setNewItemContentForm({...newItemContentForm, imageUrl: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                )}
              </div>
            )}

            {newItemType === 'assessment' && (
              <div className="space-y-4">
                <input type="text" placeholder="Assessment Title (e.g., Module 1 Quiz)" value={newItemContentForm.title} onChange={e => setNewItemContentForm({...newItemContentForm, title: e.target.value})} className="w-full p-2 rounded-md border text-sm font-bold" required />
                
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 space-y-3">
                  <h6 className="font-bold text-sm text-text-primary">Questions ({newItemContentForm.questions.length})</h6>
                  {newItemContentForm.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-surface p-3 rounded-md border border-outline-variant shadow-sm relative pr-10">
                      <p className="text-sm font-bold"><span className="text-primary mr-1">Q{qIdx + 1}.</span> {q.questionText}</p>
                      <span className="text-xs text-text-dim uppercase tracking-wider font-bold block mb-2">{q.type === 'mcq' ? 'Multiple Choice' : q.type === 'msq' ? 'Multiple Select' : 'Text Answer'}</span>
                      
                      {(q.type === 'mcq' || q.type === 'msq') && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`text-xs p-1.5 rounded border ${((q.type === 'mcq' && q.correctAnswerIndex === oIdx) || (q.type === 'msq' && q.correctAnswers.includes(oIdx))) ? 'bg-success/10 border-success/30 text-success font-bold' : 'bg-surface-container border-transparent'}`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'text_input' && (
                        <div className="mt-2 text-xs text-success bg-success/10 p-2 rounded border border-success/20">
                          <strong>Expected Answer:</strong> {q.expectedTextAnswer}
                        </div>
                      )}
                      
                      <button type="button" onClick={() => {
                        const newQs = [...newItemContentForm.questions];
                        newQs.splice(qIdx, 1);
                        setNewItemContentForm({...newItemContentForm, questions: newQs});
                      }} className="absolute top-3 right-3 text-error/70 hover:text-error bg-error/10 hover:bg-error/20 p-1.5 rounded-md transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add New Question Form Inline */}
                  <div className="bg-surface-container-highest p-3 rounded-md border border-outline-variant border-dashed">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2 flex items-center gap-1"><Plus size={14}/> Add Question</p>
                    <AssessmentQuestionBuilder onAdd={(newQ) => {
                      setNewItemContentForm({...newItemContentForm, questions: [...newItemContentForm.questions, newQ]});
                    }} />
                  </div>
                </div>
              </div>
            )}

            {newItemType === 'ai_qa' && (
              <div className="space-y-3">
                <input type="text" placeholder="Block Title (e.g., AI Challenge)" value={newItemContentForm.title} onChange={e => setNewItemContentForm({...newItemContentForm, title: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                <input type="text" placeholder="Question Text" value={newItemContentForm.question} onChange={e => setNewItemContentForm({...newItemContentForm, question: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                <textarea placeholder="Expected Answer / Key Concepts (Hidden from student, used by AI to grade)" value={newItemContentForm.expectedAnswer} onChange={e => setNewItemContentForm({...newItemContentForm, expectedAnswer: e.target.value})} className="w-full p-2 rounded-md border text-sm" rows="3" required></textarea>
              </div>
            )}

            <div className="flex gap-2 mt-4 justify-end">
              <button type="button" onClick={() => { setIsAddingItem(false); setEditingItemIdx(null); }} className="px-4 py-2 text-sm font-bold text-text-dim hover:bg-surface-container rounded-md">Cancel</button>
              <button type="submit" className={`px-4 py-2 text-sm font-bold text-white rounded-md ${newItemType === 'content' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}>
                {editingItemIdx !== null ? 'Save Changes' : `Add ${newItemType === 'content' ? 'Content' : 'Assessment'}`}
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => {
              setEditingItemIdx(null);
              setNewItemContentForm({ title: '', contentType: 'text', body: '', videoUrl: '', imageUrl: '', formUrl: '', question: '', expectedAnswer: '' });
              setNewItemType('content');
              setIsAddingItem(true);
            }}
            className="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-lg text-sm font-bold text-text-dim hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Item to Day {day.dayNumber}
          </button>
        )}
      </div>
    </div>
  );
};

// Sub-component for adding a single question to the assessment
const AssessmentQuestionBuilder = ({ onAdd }) => {
  const [qType, setQType] = useState('mcq');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState(0);
  const [msqCorrect, setMsqCorrect] = useState([0]);
  const [textExpected, setTextExpected] = useState('');

  const handleAdd = () => {
    if (!qText.trim()) return alert("Enter question text");
    
    let newQ = { type: qType, questionText: qText };
    
    if (qType === 'mcq') {
      if (options.some(o => !o.trim())) return alert("Fill all options");
      newQ.options = options;
      newQ.correctAnswerIndex = Number(mcqCorrect);
    } else if (qType === 'msq') {
      if (options.some(o => !o.trim())) return alert("Fill all options");
      if (msqCorrect.length === 0) return alert("Select at least one correct option");
      newQ.options = options;
      newQ.correctAnswers = msqCorrect;
    } else if (qType === 'text_input') {
      if (!textExpected.trim()) return alert("Enter expected answer text");
      newQ.expectedTextAnswer = textExpected;
    }

    onAdd(newQ);
    // Reset form
    setQText('');
    setOptions(['', '', '', '']);
    setMcqCorrect(0);
    setMsqCorrect([0]);
    setTextExpected('');
  };

  const toggleMsq = (idx) => {
    if (msqCorrect.includes(idx)) {
      setMsqCorrect(msqCorrect.filter(i => i !== idx));
    } else {
      setMsqCorrect([...msqCorrect, idx]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={qType} onChange={e => setQType(e.target.value)} className="p-2 rounded text-sm border bg-surface outline-none focus:border-primary">
          <option value="mcq">Single Choice (MCQ)</option>
          <option value="msq">Multiple Select (MSQ)</option>
          <option value="text_input">Text Answer</option>
        </select>
        <input type="text" placeholder="Question Text..." value={qText} onChange={e => setQText(e.target.value)} className="flex-1 p-2 rounded text-sm border bg-surface outline-none focus:border-primary" />
      </div>

      {(qType === 'mcq' || qType === 'msq') && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {qType === 'mcq' ? (
                <input type="radio" name="mcq_correct" checked={mcqCorrect === idx} onChange={() => setMcqCorrect(idx)} className="accent-primary" />
              ) : (
                <input type="checkbox" checked={msqCorrect.includes(idx)} onChange={() => toggleMsq(idx)} className="accent-primary" />
              )}
              <input type="text" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                const newOpts = [...options];
                newOpts[idx] = e.target.value;
                setOptions(newOpts);
              }} className="flex-1 p-1.5 rounded text-xs border bg-surface outline-none focus:border-primary" />
            </div>
          ))}
        </div>
      )}

      {qType === 'text_input' && (
        <textarea 
          placeholder="Expected Answer (keywords or phrases)..." 
          value={textExpected} 
          onChange={e => setTextExpected(e.target.value)} 
          className="w-full p-2 rounded text-sm border bg-surface outline-none focus:border-primary" 
          rows="2"
        />
      )}

      <button type="button" onClick={handleAdd} className="w-full bg-surface text-primary border border-primary/30 hover:bg-primary hover:text-white px-3 py-1.5 rounded-md text-sm font-bold transition-colors">
        Add Question to Assessment
      </button>
    </div>
  );
};

export default CourseDayBuilder;
