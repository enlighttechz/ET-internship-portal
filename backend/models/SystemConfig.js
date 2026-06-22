const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  geminiApiKeys: { type: [String], default: [] },
  isCourseShuttered: { type: Boolean, default: false },
  shutterNote: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
