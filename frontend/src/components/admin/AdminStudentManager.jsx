import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, CheckSquare, XSquare, MessageSquare, Trash2, Settings, X, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_BASE}/api`;

const AdminStudentManager = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentForCourses, setSelectedStudentForCourses] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`);
      setStudents(res.data);
    } catch(err) { console.error(err); }
  };

  const deleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to completely delete this student?')) {
      await axios.delete(`${API_URL}/students/${id}`);
      fetchStudents();
    }
  };

  const updateStudent = async (id, field, value) => {
    await axios.put(`${API_URL}/students/${id}`, { [field]: value });
    fetchStudents();
  };

  const navigateToChat = (student) => {
    navigate('/admin/chat', { state: { studentId: student._id } });
  };

  const updateCoursePayment = async (student, isPrimary, courseDomain, status) => {
    if (isPrimary) {
      await updateStudent(student._id, 'paymentStatus', status);
      setSelectedStudentForCourses({ ...student, paymentStatus: status });
    } else {
      const updatedCourses = student.additionalCourses.map(c => c.domain === courseDomain ? { ...c, paymentStatus: status } : c);
      await updateStudent(student._id, 'additionalCourses', updatedCourses);
      setSelectedStudentForCourses({ ...student, additionalCourses: updatedCourses });
    }
  };

  const removeCourse = async (student, isPrimary, courseDomain) => {
    if (!window.confirm(`Remove course ${courseDomain}?`)) return;
    if (isPrimary) {
      await updateStudent(student._id, 'domain', 'Pending');
      setSelectedStudentForCourses({ ...student, domain: 'Pending' });
    } else {
      const updatedCourses = student.additionalCourses.filter(c => c.domain !== courseDomain);
      await updateStudent(student._id, 'additionalCourses', updatedCourses);
      setSelectedStudentForCourses({ ...student, additionalCourses: updatedCourses });
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-headline-xl font-bold text-primary mb-2">Student Management</h1>
        <p className="text-text-dim text-md font-medium">Monitor progress, evaluate projects, and issue certificates.</p>
      </div>

      <div className="glass-card bg-surface rounded-2xl border border-outline-variant/20 shadow-md flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">Registered Students</h3>
          </div>
          <div className="text-sm font-bold text-text-dim bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50">
            Total: {students.length}
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 h-full">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead className="bg-surface-container-lowest text-text-dim uppercase tracking-wider text-xs font-bold border-b border-outline-variant/30 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 bg-surface-container-lowest">Intern Info</th>
                <th className="px-6 py-4 bg-surface-container-lowest">Progress & Att.</th>
                <th className="px-6 py-4 bg-surface-container-lowest">Projects (Mini / Final)</th>
                <th className="px-6 py-4 bg-surface-container-lowest">Assessment</th>
                <th className="px-6 py-4 bg-surface-container-lowest">Total Time Spent</th>
                <th className="px-6 py-4 bg-surface-container-lowest">Certificate</th>
                <th className="px-6 py-4 bg-surface-container-lowest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {students.map(s => (
                <tr key={s._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-on-surface text-base">{s.name}</div>
                    <div className="text-xs text-text-dim mt-0.5">{s.email}</div>
                    {s.lastLogin && <div className="text-[10px] text-primary/80 mt-1">Last Login: {new Date(s.lastLogin).toLocaleString()}</div>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20" title="Primary Domain">{s.domain}</div>
                      {s.additionalCourses && s.additionalCourses.map(c => (
                        <div key={c.domain} className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20" title="Additional Course">{c.domain}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} className="text-secondary" />
                      <span className="font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded text-xs">Day {s.learningProgress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded p-0.5 w-fit focus-within:border-success focus-within:ring-1 focus-within:ring-success transition-all">
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
                      <div className="flex items-center justify-between gap-3 text-xs bg-surface-container-lowest p-1.5 rounded-lg border border-outline-variant/50">
                        <span className="font-bold text-text-dim min-w-[35px]">Mini:</span>
                        {s.weekendProjectLink ? (
                          <a href={s.weekendProjectLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[80px] font-medium" title={s.weekendProjectLink}>Link</a>
                        ) : (
                          <span className="text-[10px] text-text-dim italic">No Link</span>
                        )}
                        <select 
                          value={s.weekendProjectStatus} 
                          onChange={(e) => updateStudent(s._id, 'weekendProjectStatus', e.target.value)} 
                          className={`p-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider outline-none border border-transparent hover:border-outline-variant/50 cursor-pointer ${s.weekendProjectStatus === 'Evaluated' ? 'bg-success/20 text-success' : s.weekendProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-surface-container-highest text-text-dim'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Evaluated">Evaluated</option>
                        </select>
                      </div>
                      {/* Final Project */}
                      <div className="flex items-center justify-between gap-3 text-xs bg-surface-container-lowest p-1.5 rounded-lg border border-outline-variant/50">
                        <span className="font-bold text-text-dim min-w-[35px]">Final:</span>
                        {s.finalProjectLink ? (
                          <a href={s.finalProjectLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline truncate max-w-[80px] font-medium" title={s.finalProjectLink}>Link</a>
                        ) : (
                          <span className="text-[10px] text-text-dim italic">No Link</span>
                        )}
                        <select 
                          value={s.finalProjectStatus} 
                          onChange={(e) => updateStudent(s._id, 'finalProjectStatus', e.target.value)} 
                          className={`p-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider outline-none border border-transparent hover:border-outline-variant/50 cursor-pointer ${s.finalProjectStatus === 'Evaluated' ? 'bg-success/20 text-success' : s.finalProjectStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-surface-container-highest text-text-dim'}`}
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
                      <span className="text-xs font-medium text-text-dim italic bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/30">Not Taken</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {s.totalPlatformTimeSeconds || (s.timeTracking && s.timeTracking.length > 0) ? (
                      <div className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg inline-block border border-secondary/20">
                        {Math.floor((s.totalPlatformTimeSeconds || s.timeTracking.reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0)) / 60)} mins
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-text-dim bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/30">0 mins</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => updateStudent(s._id, 'certificateIssued', !s.certificateIssued)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${s.certificateIssued ? 'bg-success text-white border-success hover:bg-[#15803d]' : 'bg-surface text-text-dim border-outline-variant hover:bg-surface-container-highest'}`}
                    >
                      {s.certificateIssued ? <CheckSquare size={16} /> : <XSquare size={16} />}
                      {s.certificateIssued ? 'Issued' : 'Hold'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigateToChat(s)} 
                        className="text-primary hover:text-white bg-primary/10 hover:bg-primary p-2.5 rounded-xl transition-colors border border-primary/20 hover:border-primary flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        title="Recommend & Chat"
                      >
                        <MessageSquare size={16} /> Chat
                      </button>
                      <button 
                        onClick={() => setSelectedStudentForCourses(s)} 
                        className="text-secondary hover:text-white bg-secondary/10 hover:bg-secondary p-2.5 rounded-xl transition-colors shadow-sm"
                        title="Manage Courses & Payments"
                      >
                        <Settings size={16} />
                      </button>
                      <button onClick={() => deleteStudent(s._id)} className="text-error bg-error/10 hover:bg-error hover:text-white p-2.5 rounded-xl transition-colors shadow-sm" title="Delete Student">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-text-dim font-medium">No students registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentForCourses && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedStudentForCourses(null)}
              className="absolute top-4 right-4 p-2 bg-surface-container hover:bg-outline-variant/30 rounded-full transition-colors"
            >
              <X size={20} className="text-text-primary" />
            </button>
            <h2 className="text-2xl font-headline-md font-bold mb-1 pr-10 text-primary">Manage Courses & Payments</h2>
            <p className="text-sm text-text-dim mb-6 font-medium">Student: {selectedStudentForCourses.name}</p>

            <div className="overflow-y-auto pr-2 space-y-4">
              {/* Primary Domain */}
              {selectedStudentForCourses.domain !== 'Pending' && (
                <div className="bg-surface-container-lowest border border-primary/30 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">Primary Course</span>
                      <span className="font-bold text-on-surface">{selectedStudentForCourses.domain}</span>
                    </div>
                    <button onClick={() => removeCourse(selectedStudentForCourses, true, selectedStudentForCourses.domain)} className="text-error bg-error/10 hover:bg-error hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-colors">
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30">
                    <IndianRupee size={16} className="text-text-dim" />
                    <span className="text-sm font-bold text-text-dim">Payment:</span>
                    <select 
                      value={selectedStudentForCourses.paymentStatus || 'Pending'} 
                      onChange={(e) => updateCoursePayment(selectedStudentForCourses, true, selectedStudentForCourses.domain, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border-2 transition-all ${selectedStudentForCourses.paymentStatus === 'Paid' ? 'border-success text-success bg-success/10' : 'border-error text-error bg-error/10'}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Additional Courses */}
              {selectedStudentForCourses.additionalCourses && selectedStudentForCourses.additionalCourses.map(course => (
                <div key={course.domain} className="bg-surface-container-lowest border border-secondary/30 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 block">Additional Course</span>
                      <span className="font-bold text-on-surface">{course.domain}</span>
                    </div>
                    <button onClick={() => removeCourse(selectedStudentForCourses, false, course.domain)} className="text-error bg-error/10 hover:bg-error hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-colors">
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30">
                    <IndianRupee size={16} className="text-text-dim" />
                    <span className="text-sm font-bold text-text-dim">Payment:</span>
                    <select 
                      value={course.paymentStatus || 'Pending'} 
                      onChange={(e) => updateCoursePayment(selectedStudentForCourses, false, course.domain, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border-2 transition-all ${course.paymentStatus === 'Paid' ? 'border-success text-success bg-success/10' : 'border-error text-error bg-error/10'}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              ))}

              {selectedStudentForCourses.domain === 'Pending' && (!selectedStudentForCourses.additionalCourses || selectedStudentForCourses.additionalCourses.length === 0) && (
                <div className="text-center py-6 text-text-dim italic">
                  No courses registered.
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setSelectedStudentForCourses(null);
                fetchStudents();
              }}
              className="mt-6 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentManager;
