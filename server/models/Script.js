// models/Script.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Script = mongoose.models.Script || (() => {
  const scriptSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['PowerShell', 'Python', 'JavaScript', 'Bash', 'Other'],
      default: 'PowerShell'
    },
    version: {
      type: Number,
      default: 1
    },
    tags: [{
      type: String,
      trim: true
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Update the 'updatedAt' field on save
  scriptSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  return mongoose.model('Script', scriptSchema);
})();

module.exports = Script;