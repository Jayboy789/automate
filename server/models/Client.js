// models/Client.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Client = mongoose.models.Client || (() => {
  const clientSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    active: {
      type: Boolean,
      default: true
    }
  });

  return mongoose.model('Client', clientSchema);
})();

module.exports = Client;