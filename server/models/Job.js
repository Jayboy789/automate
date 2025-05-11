// models/Job.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Job = mongoose.models.Job || (() => {
  const jobSchema = new mongoose.Schema({
    agentId: {
      type: String,
      required: true
    },
    script: {
      type: String,
      required: true
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued'
    },
    output: {
      type: String
    },
    error: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution'
    },
    nodeId: {
      type: String
    }
  });

  return mongoose.model('Job', jobSchema);
})();

module.exports = Job;