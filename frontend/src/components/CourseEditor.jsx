import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Edit3, X, Eye, Bold, Italic, Underline, List, ListOrdered, Link, Image as ImageIcon, Code, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Quote, Minus, Type, Video, FileText, GripVertical } from 'lucide-react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

import RichTextEditor from './RichTextEditor';

// ─── Course Editor Component ──────────────────────────────────────────────────
const CourseEditor = ({ course, contents, onRefresh, courses }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...course });
  const [activeTab, setActiveTab] = useState('modules'); // modules | add | settings

  // Add Module form
  const [newModule, setNewModule] = useState({
    category: '', title: '', type: 'text', body: '', videoUrl: '', imageUrl: '', order: 1
  });

  // Edit Module state
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleForm, setEditModuleForm] = useState({});

  const courseContents = contents.filter(c => c.domain === course.title).sort((a, b) => a.order - b.order);

  // ── Course Settings CRUD ──
  const saveCourseSettings = async () => {
    try {
      await axios.put(`${API_URL}/courses/${course._id}`, editForm);
      setIsEditing(false);
      onRefresh();
      alert('Course updated!');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  // ── Module CRUD ──
  const addModule = async (e) => {
    e.preventDefault();
    if (!newModule.title) return;
    try {
      await axios.post(`${API_URL}/contents`, {
        ...newModule,
        domain: course.title,
        order: courseContents.length + 1
      });
      setNewModule({ category: '', title: '', type: 'text', body: '', videoUrl: '', imageUrl: '', order: 1 });
      onRefresh();
    } catch (err) {
      alert('Failed to add module: ' + err.message);
    }
  };

  const deleteModule = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    await axios.delete(`${API_URL}/contents/${id}`);
    onRefresh();
  };

  const startEditModule = (mod) => {
    setEditingModuleId(mod._id);
    setEditModuleForm({ ...mod });
  };

  const saveModuleEdit = async () => {
    try {
      await axios.put(`${API_URL}/contents/${editingModuleId}`, editModuleForm);
      setEditingModuleId(null);
      onRefresh();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Course Header — always visible */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {course.imageUrl && (
          <img src={course.imageUrl} alt={course.title} className="w-16 h-12 object-cover rounded-lg shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base text-text-primary truncate">{course.title}</h4>
          <p className="text-xs text-text-dim">{course.duration} · {course.fee} · {courseContents.length} modules</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${courseContents.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {courseContents.length > 0 ? 'Active' : 'Empty'}
          </span>
          {isExpanded ? <ChevronUp size={20} className="text-text-dim" /> : <ChevronDown size={20} className="text-text-dim" />}
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="border-t border-outline-variant/30">
          {/* Tab Bar */}
          <div className="flex border-b border-outline-variant/20 bg-surface-container-lowest">
            {[
              { key: 'modules', label: 'Modules', icon: FileText },
              { key: 'add', label: 'Add Module', icon: Plus },
              { key: 'settings', label: 'Course Settings', icon: Edit3 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === tab.key ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-dim hover:text-text-primary hover:bg-surface-container'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── MODULES TAB ── */}
          {activeTab === 'modules' && (
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {courseContents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText size={40} className="text-text-dim/30 mx-auto mb-3" />
                  <p className="text-text-dim text-sm">No modules yet. Click "Add Module" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courseContents.map((mod, idx) => (
                    <div key={mod._id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                      {editingModuleId === mod._id ? (
                        /* ── Editing a Module ── */
                        <div className="p-4 space-y-3">
                          <div className="flex gap-3">
                            <input 
                              type="text" value={editModuleForm.title || ''} 
                              onChange={e => setEditModuleForm({ ...editModuleForm, title: e.target.value })}
                              className="flex-1 p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-medium" 
                              placeholder="Module Title"
                            />
                            <input 
                              type="text" value={editModuleForm.category || ''} 
                              onChange={e => setEditModuleForm({ ...editModuleForm, category: e.target.value })}
                              className="w-40 p-2.5 rounded-lg border border-outline-variant bg-white text-sm" 
                              placeholder="Category"
                            />
                            <select
                              value={editModuleForm.type || 'text'}
                              onChange={e => setEditModuleForm({ ...editModuleForm, type: e.target.value })}
                              className="w-28 p-2.5 rounded-lg border border-outline-variant bg-white text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="image">Image</option>
                            </select>
                          </div>

                          {editModuleForm.type === 'text' ? (
                            <RichTextEditor 
                              value={editModuleForm.body || ''} 
                              onChange={(html) => setEditModuleForm({ ...editModuleForm, body: html })}
                              placeholder="Write your module content..."
                            />
                          ) : editModuleForm.type === 'video' ? (
                            <input type="text" value={editModuleForm.videoUrl || ''} onChange={e => setEditModuleForm({ ...editModuleForm, videoUrl: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" placeholder="Video URL" />
                          ) : (
                            <input type="text" value={editModuleForm.imageUrl || ''} onChange={e => setEditModuleForm({ ...editModuleForm, imageUrl: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" placeholder="Image URL" />
                          )}

                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-text-dim hover:bg-surface-container transition-colors">Cancel</button>
                            <button onClick={saveModuleEdit} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                              <Save size={14} /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Module Row ── */
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{mod.category}</span>
                              {mod.type === 'video' && <Video size={12} className="text-secondary" />}
                              {mod.type === 'image' && <ImageIcon size={12} className="text-accent" />}
                              {mod.type === 'text' && <FileText size={12} className="text-primary" />}
                            </div>
                            <p className="text-sm font-medium text-text-primary truncate">{mod.title}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEditModule(mod)} className="p-1.5 rounded-lg text-text-dim hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => deleteModule(mod._id)} className="p-1.5 rounded-lg text-text-dim hover:text-error hover:bg-error/10 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADD MODULE TAB ── */}
          {activeTab === 'add' && (
            <form onSubmit={addModule} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" placeholder="Category (e.g. HTML Basics)" value={newModule.category} onChange={e => setNewModule({ ...newModule, category: e.target.value })} className="p-2.5 rounded-lg border border-outline-variant bg-white text-sm" required />
                <input type="text" placeholder="Module Title" value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} className="p-2.5 rounded-lg border border-outline-variant bg-white text-sm" required />
                <select value={newModule.type} onChange={e => setNewModule({ ...newModule, type: e.target.value })} className="p-2.5 rounded-lg border border-outline-variant bg-white text-sm">
                  <option value="text">Text Based</option>
                  <option value="video">Video Based</option>
                  <option value="image">Image Based</option>
                </select>
              </div>

              {newModule.type === 'text' ? (
                <RichTextEditor 
                  value={newModule.body} 
                  onChange={(html) => setNewModule({ ...newModule, body: html })}
                  placeholder="Start writing your module content..."
                />
              ) : newModule.type === 'video' ? (
                <input type="text" placeholder="Video URL (YouTube embed or Drive link)" value={newModule.videoUrl} onChange={e => setNewModule({ ...newModule, videoUrl: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" required />
              ) : (
                <input type="text" placeholder="Image URL" value={newModule.imageUrl} onChange={e => setNewModule({ ...newModule, imageUrl: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" required />
              )}

              <button type="submit" className="w-full bg-primary text-white p-3 rounded-xl hover:bg-primary/90 font-bold flex items-center justify-center gap-2 transition-colors">
                <Plus size={18} /> Add Module (Day {courseContents.length + 1})
              </button>
            </form>
          )}

          {/* ── COURSE SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Course Title</label>
                  <input type="text" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Duration</label>
                  <input type="text" value={editForm.duration || ''} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Fee</label>
                  <input type="text" value={editForm.fee || ''} onChange={e => setEditForm({ ...editForm, fee: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Image URL</label>
                  <input type="url" value={editForm.imageUrl || ''} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm min-h-[80px]" />
              </div>
              {editForm.imageUrl && (
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 block">Image Preview</label>
                  <img src={editForm.imageUrl} alt="Preview" className="w-full max-w-sm h-32 object-cover rounded-lg border border-outline-variant/30" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={saveCourseSettings} className="flex-1 bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 font-bold flex items-center justify-center gap-2 transition-colors">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseEditor;
