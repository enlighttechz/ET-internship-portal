const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const geminiSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  domain: { type: String, required: true },
  dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseDay' },
  moduleId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  chatHistory: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('GeminiSession', geminiSessionSchema);
