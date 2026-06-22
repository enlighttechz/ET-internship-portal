import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Building2, MapPin, GraduationCap, BookOpen, Phone, Clock, Award, Star } from 'lucide-react';

const AdminStudentDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const student = state?.student;

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-error font-bold mb-4">Student not found.</p>
        <button onClick={() => navigate('/admin/students')} className="text-primary hover:underline">Back to Students</button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-container rounded-xl hover:bg-outline-variant/30 transition-colors">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <div>
          <h1 className="text-3xl font-headline-md font-bold text-primary">Student Details</h1>
          <p className="text-sm text-text-dim">Viewing detailed profile for {student.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Info Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-xl text-on-surface">{student.name}</h2>
              <p className="text-xs font-bold text-primary">ID: {student.internId || 'N/A'}</p>
              <p className="text-sm text-text-dim">{student.email}</p>
            </div>
          </div>
          
          <div className="space-y-3 mt-2">
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-text-dim mt-0.5" />
              <div>
                <p className="text-xs text-text-dim font-bold">Contact</p>
                <p className="text-sm text-on-surface">{student.contact || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 size={16} className="text-text-dim mt-0.5" />
              <div>
                <p className="text-xs text-text-dim font-bold">College</p>
                <p className="text-sm text-on-surface">{student.collegeName || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-text-dim mt-0.5" />
              <div>
                <p className="text-xs text-text-dim font-bold">Location</p>
                <p className="text-sm text-on-surface">{student.location || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GraduationCap size={16} className="text-text-dim mt-0.5" />
              <div>
                <p className="text-xs text-text-dim font-bold">Degree</p>
                <p className="text-sm text-on-surface">{student.degree || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="text-text-dim mt-0.5" />
              <div>
                <p className="text-xs text-text-dim font-bold">Specialization</p>
                <p className="text-sm text-on-surface">{student.specialization || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-lg text-primary mb-2 flex items-center gap-2"><Award size={20} /> Academic Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <p className="text-xs text-text-dim font-bold mb-1 uppercase">Primary Domain</p>
              <p className="font-bold text-lg text-primary">{student.domain}</p>
              <div className="mt-2 text-sm text-on-surface flex justify-between">
                <span>Days Completed:</span> 
                <span className="font-bold">{Math.max(0, (student.learningProgress || 1) - 1)}</span>
              </div>
              <div className="text-sm text-on-surface flex justify-between">
                <span>Attendance:</span> 
                <span className="font-bold">{student.attendance}%</span>
              </div>
            </div>
            
            <div className="bg-secondary/5 rounded-2xl p-4 border border-secondary/10 flex flex-col justify-center">
              <p className="text-xs text-text-dim font-bold mb-1 uppercase">Total Time Spent</p>
              <div className="flex items-center gap-2 text-secondary">
                <Clock size={24} />
                <span className="font-bold text-2xl">
                  {Math.floor((student.totalPlatformTimeSeconds || student.timeTracking?.reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0) || 0) / 60)} mins
                </span>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
              <p className="text-xs text-text-dim font-bold">XP Points</p>
              <p className="text-lg font-bold text-amber-500">{student.gamification?.points || 0}</p>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
              <p className="text-xs text-text-dim font-bold">Level</p>
              <p className="text-lg font-bold text-blue-500">{student.gamification?.level || 1}</p>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
              <p className="text-xs text-text-dim font-bold">Achievements</p>
              <p className="text-lg font-bold text-purple-500">{student.gamification?.achievements?.length || 0}</p>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
              <p className="text-xs text-text-dim font-bold">Cert. Status</p>
              <p className={`text-sm font-bold mt-1 ${student.certificateIssued ? 'text-success' : 'text-text-dim'}`}>
                {student.certificateIssued ? 'Issued' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminStudentDetails;
