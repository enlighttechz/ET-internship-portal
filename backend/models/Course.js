const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  fee: { type: String, required: true },
  duration: { type: String, required: true },
  iconName: { type: String, default: 'Code' },
  color: { type: String, default: 'border-primary' },
  imageUrl: { type: String, default: '' },
  whatsappLink: { type: String, default: '' },
  onboardingNote: { type: String, default: '' },
  hidden: { type: Boolean, default: false },
  startDate: { type: String, default: '' },
  weeks: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
