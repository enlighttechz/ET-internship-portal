const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  category: { type: String, default: 'General' },
  title: { type: String, required: true },
  type: { type: String, enum: ['text', 'video'], required: true },
  body: { type: String }, // For text type
  videoUrl: { type: String }, // For video type
  order: { type: Number, required: true },
  domain: { type: String, default: 'All' }
});

module.exports = mongoose.model('Content', contentSchema);
