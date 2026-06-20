const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  questions: [{
    type: { type: String, enum: ['text', 'image_selection', 'rearrange'], default: 'text' },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswerIndex: { type: Number },
    correctOrder: [{ type: String }]
  }]
});

module.exports = mongoose.model('Assessment', assessmentSchema);
