const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderRole: { type: String, enum: ['Admin', 'Student'], required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const recommendationChatSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('RecommendationChat', recommendationChatSchema);
