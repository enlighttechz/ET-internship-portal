const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  internId: { type: String },
  contact: { type: String, default: '' },
  domain: { type: String, default: 'Pending' },
  additionalCourses: [{
    domain: String,
    attendance: { type: Number, default: 0 },
    learningProgress: { type: Number, default: 0 },
    assessmentScore: { type: Number, default: null },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
  }],
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  attendance: { type: Number, default: 0 },
  weekendProjectStatus: { type: String, enum: ['Pending', 'Submitted', 'Evaluated'], default: 'Pending' },
  weekendProjectLink: { type: String, default: '' },
  finalProjectStatus: { type: String, enum: ['Pending', 'Submitted', 'Evaluated'], default: 'Pending' },
  finalProjectLink: { type: String, default: '' },
  learningProgress: { type: Number, default: 0 }, // Tracks which content index the student is on
  assessmentScore: { type: Number, default: null }, // Null if not taken
  certificateIssued: { type: Boolean, default: false }, // Admin controls this
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  hasCompletedOnboarding: { type: Boolean, default: false },
  
  // Profile Additions
  collegeName: { type: String, default: '' },
  location: { type: String, default: '' },
  degree: { type: String, default: '' },
  specialization: { type: String, default: '' },
  hasCompletedProfile: { type: Boolean, default: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // Time Tracking
  timeTracking: [{
    domain: String,
    dayNumber: Number,
    itemIndex: Number,
    timeSpentSeconds: Number
  }],
  totalPlatformTimeSeconds: { type: Number, default: 0 },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
