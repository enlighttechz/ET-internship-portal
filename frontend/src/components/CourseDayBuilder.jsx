import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Edit3, Eye, EyeOff, Video, FileText, Image as ImageIcon, Award, GripVertical } from 'lucide-react';
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
  const [newItemContentForm, setNewItemContentForm] = useState({ title: '', contentType: 'text', body: '', videoUrl: '', imageUrl: '' });
  
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

  const handleCSVUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
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
             type: 'text',
             questionText: q,
             options: [o1, o2, o3, o4],
             correctAnswerIndex: correctIdx
           });
        }
      }

      if (newQuestions.length > 0) {
        const newItems = [...items];
        if (!newItems[idx].questions) newItems[idx].questions = [];
        newItems[idx].questions = [...newItems[idx].questions, ...newQuestions];
        setItems(newItems);
        try {
          await axios.put(`${API_URL}/course-days/${day._id}`, { items: newItems });
          alert(`Successfully loaded ${newQuestions.length} questions!`);
        } catch(err) {
          alert('Failed to save to database: ' + err.message);
        }
      } else {
        alert("No valid questions found. Ensure format is: Question, Opt1, Opt2, Opt3, Opt4, CorrectAnswer(1-4)");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const newItem = {
      itemType: newItemType,
      title: newItemType === 'content' ? newItemContentForm.title : 'Assessment Block',
    };
    
    if (newItemType === 'content') {
      newItem.contentType = newItemContentForm.contentType;
      newItem.body = newItemContentForm.body;
      newItem.videoUrl = newItemContentForm.videoUrl;
      newItem.imageUrl = newItemContentForm.imageUrl;
    } else {
      newItem.formUrl = newItemContentForm.formUrl; // Google Form Embed URL
    }

    const newItems = [...items, newItem];
    setItems(newItems);
    setIsAddingItem(false);
    try {
      await axios.put(`${API_URL}/course-days/${day._id}`, { items: newItems });
      setNewItemContentForm({ title: '', contentType: 'text', body: '', videoUrl: '', imageUrl: '' });
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

  return (
    <div className={`bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm transition-opacity ${day.hidden ? 'opacity-60' : ''}`}>
      <div className="bg-surface-container-highest px-4 py-3 flex justify-between items-center border-b border-outline-variant/30">
        <div>
          <h5 className="font-bold text-on-surface flex items-center gap-2">
            Day {day.dayNumber}: {day.title}
            {day.hidden && <span className="bg-outline-variant text-text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Hidden</span>}
          </h5>
          {day.description && <p className="text-xs text-text-dim mt-0.5">{day.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleVisibility} 
            className={`p-1.5 rounded-lg transition-colors ${day.hidden ? 'text-primary hover:bg-primary/10' : 'text-text-dim hover:bg-surface-container'}`}
            title={day.hidden ? "Show Module" : "Hide Module"}
          >
            {day.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={() => {}} className="text-error/70 hover:text-error p-1 rounded hover:bg-error/10" title="Delete Day (Not implemented in this UI directly but logic exists)">
             {/* Not exposing day delete here to avoid accidental clicks, put it in day builder */}
          </button>
        </div>
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
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.itemType === 'assessment' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {item.itemType}
                    </span>
                    {item.contentType === 'video' && <Video size={12} className="text-text-dim" />}
                    {item.contentType === 'image' && <ImageIcon size={12} className="text-text-dim" />}
                    <span className="text-sm font-bold text-text-primary">{item.title}</span>
                  </div>
                  {item.itemType === 'assessment' && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-bold text-accent">Google Form Assessment</p>
                      <p className="text-[10px] text-text-dim truncate max-w-xs">{item.formUrl || 'No URL provided'}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="flex gap-4 mb-4 border-b border-outline-variant/30 pb-3">
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input type="radio" checked={newItemType === 'content'} onChange={() => setNewItemType('content')} className="accent-primary" />
                Content Block
              </label>
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-accent">
                <input type="radio" checked={newItemType === 'assessment'} onChange={() => setNewItemType('assessment')} className="accent-accent" />
                Assessment Block
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
                  <input type="text" placeholder="Image URL" value={newItemContentForm.imageUrl} onChange={e => setNewItemContentForm({...newItemContentForm, imageUrl: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                )}
              </div>
            )}

            {newItemType === 'assessment' && (
              <div className="space-y-3">
                <input type="text" placeholder="Google Form Embed URL (src link)" value={newItemContentForm.formUrl || ''} onChange={e => setNewItemContentForm({...newItemContentForm, formUrl: e.target.value})} className="w-full p-2 rounded-md border text-sm" required />
                <p className="text-xs text-text-dim italic">
                  Paste the Google Form URL here. Students will take the assessment inside the platform via this embedded form.
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-4 justify-end">
              <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-2 text-sm font-bold text-text-dim hover:bg-surface-container rounded-md">Cancel</button>
              <button type="submit" className={`px-4 py-2 text-sm font-bold text-white rounded-md ${newItemType === 'content' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}>
                Add {newItemType === 'content' ? 'Content' : 'Assessment'}
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingItem(true)}
            className="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-lg text-sm font-bold text-text-dim hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Item to Day {day.dayNumber}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseDayBuilder;
