const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('Assessment', assessmentSchema);
