import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, BookOpen, Plus, Trash2, Eye, EyeOff, Edit2, X, Save } from 'lucide-react';
import CourseDayBuilder from '../CourseDayBuilder';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminCourseManager = () => {
  const [courses, setCourses] = useState([]);
  
  // New Course Form
  const [crsTitle, setCrsTitle] = useState('');
  const [crsDesc, setCrsDesc] = useState('');
  const [crsFee, setCrsFee] = useState('');
  const [crsDur, setCrsDur] = useState('');
  const [crsIcon, setCrsIcon] = useState('Monitor');
  const [crsColor, setCrsColor] = useState('border-primary');
  const [crsImg, setCrsImg] = useState('');
  const [crsStartDate, setCrsStartDate] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [onboardingNote, setOnboardingNote] = useState('');

  // Edit Course State
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch(err) { console.error(err); }
  };

  const addCourse = async (e) => {
    e.preventDefault();
    if (!crsTitle) return;
    await axios.post(`${API_URL}/courses`, {
      title: crsTitle, description: crsDesc, fee: crsFee, duration: crsDur, iconName: crsIcon, color: crsColor, imageUrl: crsImg, whatsappLink, onboardingNote, startDate: crsStartDate
    });
    setCrsTitle(''); setCrsDesc(''); setCrsFee(''); setCrsDur(''); setCrsImg(''); setWhatsappLink(''); setOnboardingNote(''); setCrsStartDate('');
    fetchCourses();
  };

  const deleteCourse = async (id) => {
    if(window.confirm('Delete this course completely?')) {
      await axios.delete(`${API_URL}/courses/${id}`);
      fetchCourses();
    }
  };

  const toggleVisibility = async (course) => {
    try {
      await axios.put(`${API_URL}/courses/${course._id}`, { hidden: !course.hidden });
      fetchCourses();
    } catch (err) {
      alert("Failed to update visibility");
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      description: course.description,
      fee: course.fee,
      duration: course.duration,
      iconName: course.iconName,
      color: course.color,
      imageUrl: course.imageUrl,
      whatsappLink: course.whatsappLink,
      onboardingNote: course.onboardingNote,
      startDate: course.startDate
    });
  };

  const saveEditCourse = async (e) => {
    e.preventDefault();
    if (!editForm.title) return;
    try {
      await axios.put(`${API_URL}/courses/${editingCourse._id}`, editForm);
      setEditingCourse(null);
      fetchCourses();
    } catch(err) {
      alert(err.response?.data?.error || "Failed to update course");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">Course Manager</h1>
        <p className="text-text-dim text-md font-medium">Create and manage your educational domains and their daily curriculum.</p>
      </div>

      {/* Course Manager Panel */}
      <div className="glass-card bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-md mb-12">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <GraduationCap size={20} className="text-success" />
          </div>
          Create New Course
        </h3>
        
        <form onSubmit={addCourse} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="text" placeholder="Course Title" value={crsTitle} onChange={e => setCrsTitle(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" required />
            <input type="text" placeholder="Duration (e.g. 4 Weeks)" value={crsDur} onChange={e => setCrsDur(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" required />
            <input type="text" placeholder="Fee (e.g. ₹999)" value={crsFee} onChange={e => setCrsFee(e.target.value)} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" required />
            <div className="flex gap-2">
              <select value={crsIcon} onChange={e => setCrsIcon(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success">
                <option value="Code">Code</option>
                <option value="Monitor">Monitor</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Database">Database</option>
                <option value="Shield">Shield</option>
              </select>
              <select value={crsColor} onChange={e => setCrsColor(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success">
                <option value="border-primary">Blue</option>
                <option value="border-success">Green</option>
                <option value="border-accent">Purple</option>
                <option value="border-error">Red</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <textarea placeholder="Course Description" value={crsDesc} onChange={e => setCrsDesc(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success min-h-[50px]" required />
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="url" placeholder="Image URL (e.g. https://images.unsplash.com/...)" value={crsImg} onChange={e => setCrsImg(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" />
              <input type="text" placeholder="Start Date (e.g. 15 Aug 2026)" value={crsStartDate} onChange={e => setCrsStartDate(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" />
              <input type="url" placeholder="WhatsApp Community Link" value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success" />
            </div>
            <textarea placeholder="Onboarding Note (Shown once after registration)" value={onboardingNote} onChange={e => setOnboardingNote(e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-success focus:ring-1 focus:ring-success min-h-[50px]" />
            <button type="submit" className="bg-success text-white p-3 rounded-xl hover:bg-[#15803d] font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md">
              <Plus size={20} /> Add Course
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto pr-2">
          {courses.map(c => (
            <div key={c._id} className={`bg-surface-container-lowest rounded-xl border-t-4 ${c.color} border border-outline-variant/30 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
              {c.imageUrl && (
                <img src={c.imageUrl} alt={c.title} className="w-full h-32 object-cover" />
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-xl">{c.title}</h4>
                  {c.hidden && <span className="bg-surface-container text-text-dim text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Hidden</span>}
                </div>
                <p className="text-sm text-text-dim mb-4 line-clamp-2">{c.description}</p>
                <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">{c.duration} | {c.fee}</span>
                    {c.startDate && <span className="text-[10px] text-text-dim">Starts: {c.startDate}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(c)} className="text-text-dim bg-surface-container hover:bg-surface-container-highest transition-colors p-2 rounded-lg shrink-0" title="Edit Course">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => toggleVisibility(c)} className="text-text-dim bg-surface-container hover:bg-surface-container-highest transition-colors p-2 rounded-lg shrink-0" title={c.hidden ? "Show Course" : "Hide Course"}>
                      {c.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => deleteCourse(c._id)} className="text-error bg-error/10 hover:bg-error hover:text-white transition-colors p-2 rounded-lg shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-text-dim text-sm py-4 col-span-full text-center">No courses found</p>}
        </div>
      </div>

      {/* Per-Course Curriculum Builder (Days & Items) */}
      <div className="mb-12">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <BookOpen size={20} className="text-secondary" />
          </div>
          Curriculum Builder
          <span className="text-sm font-normal text-text-dim ml-2">— Click a course to manage its days and modules</span>
        </h3>
        <div className="space-y-4">
          {courses.map(c => (
            <CourseDayBuilder key={c._id} course={c} onRefresh={() => fetchCourses()} />
          ))}
          {courses.length === 0 && <p className="text-text-dim text-sm text-center py-8 bg-surface rounded-xl border border-outline-variant/30">No courses found. Add a course above first.</p>}
        </div>
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-outline-variant/30 animate-slide-up relative">
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xl flex items-center gap-2 text-text-primary">
                <Edit2 className="text-primary" size={20} /> Edit Course Details
              </h3>
              <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-text-dim">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="editCourseForm" onSubmit={saveEditCourse} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Course Title</label>
                    <input type="text" placeholder="Course Title" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Duration</label>
                    <input type="text" placeholder="Duration (e.g. 4 Weeks)" value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Fee</label>
                    <input type="text" placeholder="Fee (e.g. ₹999)" value={editForm.fee} onChange={e => setEditForm({...editForm, fee: e.target.value})} className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Style Options</label>
                    <div className="flex gap-2">
                      <select value={editForm.iconName} onChange={e => setEditForm({...editForm, iconName: e.target.value})} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                        <option value="Code">Code</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Smartphone">Smartphone</option>
                        <option value="Database">Database</option>
                        <option value="Shield">Shield</option>
                      </select>
                      <select value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                        <option value="border-primary">Blue</option>
                        <option value="border-success">Green</option>
                        <option value="border-accent">Purple</option>
                        <option value="border-error">Red</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-dim ml-1">Course Description</label>
                  <textarea placeholder="Course Description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]" required />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Image URL</label>
                    <input type="url" placeholder="Image URL" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-bold text-text-dim ml-1">Start Date</label>
                    <input type="text" placeholder="Start Date" value={editForm.startDate || ''} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-bold text-text-dim ml-1">WhatsApp Link</label>
                    <input type="url" placeholder="WhatsApp Link" value={editForm.whatsappLink} onChange={e => setEditForm({...editForm, whatsappLink: e.target.value})} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-dim ml-1">Onboarding Note (Shown once during start)</label>
                  <textarea placeholder="Onboarding Note..." value={editForm.onboardingNote} onChange={e => setEditForm({...editForm, onboardingNote: e.target.value})} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]" />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-outline-variant/30 shrink-0 flex justify-end gap-3 bg-surface-container-lowest rounded-b-2xl">
              <button type="button" onClick={() => setEditingCourse(null)} className="px-6 py-2.5 rounded-xl font-bold text-text-primary border border-outline hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button type="submit" form="editCourseForm" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-container flex items-center gap-2 transition-colors shadow-md">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseManager;
