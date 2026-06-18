const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  internId: { type: String },
  contact: { type: String, default: '' },
  domain: { type: String, default: 'Pending' },
  attendance: { type: Number, default: 0 },
  weekendProjectStatus: { type: String, enum: ['Pending', 'Submitted', 'Evaluated'], default: 'Pending' },
  weekendProjectLink: { type: String, default: '' },
  finalProjectStatus: { type: String, enum: ['Pending', 'Submitted', 'Evaluated'], default: 'Pending' },
  finalProjectLink: { type: String, default: '' },
  learningProgress: { type: Number, default: 0 }, // Tracks which content index the student is on
  assessmentScore: { type: Number, default: null }, // Null if not taken
  certificateIssued: { type: Boolean, default: false }, // Admin controls this
  resetOtp: { type: String },
  resetOtpExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
