const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, default: 'general' }, // e.g. general, alert, success
  domain: { type: String, default: 'all' } // specific domain or 'all'
});

module.exports = mongoose.model('Notification', notificationSchema);
