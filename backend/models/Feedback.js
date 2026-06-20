const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String },
  domain: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  message: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
