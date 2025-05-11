// models/Agent.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Agent = mongoose.models.Agent || (() => {
  const agentSchema = new mongoose.Schema({
    agentId: {
      type: String,
      required: true,
      unique: true
    },
    agentKey: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: function() {
        return `Agent-${this.agentId.substr(0, 8)}`;
      }
    },
    platform: {
      type: String,
      enum: ['Windows', 'Linux', 'macOS', 'Docker', 'Other'],
      default: 'Other'
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'error'],
      default: 'offline'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    socketId: {
      type: String
    },
    cpuUsage: {
      type: Number,
      default: 0
    },
    memoryUsage: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  return mongoose.model('Agent', agentSchema);
})();

module.exports = Agent;