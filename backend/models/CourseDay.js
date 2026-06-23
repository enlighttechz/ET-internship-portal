const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image_selection', 'rearrange', 'mcq', 'msq', 'text_input'], default: 'mcq' },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctAnswerIndex: { type: Number },
  correctAnswers: [{ type: Number }], // For MSQ
  expectedTextAnswer: { type: String }, // For text-based grading
  correctOrder: [{ type: String }]
});

const itemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['content', 'assessment', 'ai_qa'], required: true },
  title: { type: String, required: true },
  // Fields for 'content'
  contentType: { type: String, enum: ['text', 'video', 'image'] },
  body: { type: String },
  videoUrl: { type: String },
  imageUrl: { type: String },
  // Fields for 'assessment'
  questions: [questionSchema],
  formUrl: { type: String }, // Google form embed URL
  // Fields for 'ai_qa'
  question: { type: String },
  expectedAnswer: { type: String }
});

const courseDaySchema = new mongoose.Schema({
  domain: { type: String, required: true, index: true },
  dayNumber: { type: Number, required: true },
  week: { type: String, default: 'Week 1' },
  title: { type: String, required: true },
  description: { type: String },
  hidden: { type: Boolean, default: false },
  items: [itemSchema], // Ordered array of content and assessments
  qnaText: { type: String }, // Post-day Q&A text
  geminiPrompt: { type: String } // System prompt for the Gemini Agent
}, { timestamps: true });

module.exports = mongoose.model('CourseDay', courseDaySchema);
