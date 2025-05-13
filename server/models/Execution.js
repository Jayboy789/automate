// server/models/Execution.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Execution = mongoose.models.Execution || (() => {
  const executionSchema = new mongoose.Schema({
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true
    },
    agentId: {
      type: String,
      ref: 'Agent',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    duration: {
      type: Number
    },
    logs: [{
      nodeId: String,
      timestamp: Date,
      message: String,
      type: {
        type: String,
        enum: ['info', 'error', 'warn', 'debug'],
        default: 'info'
      }
    }],
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        variables: {
          system: {},
          workflow: {},
          user: {}
        }
      }
    },
    executedNodes: [{
      nodeId: String,
      startedAt: Date,
      completedAt: Date,
      status: String,
      outputs: mongoose.Schema.Types.Mixed
    }],
    error: {
      message: String,
      stack: String,
      nodeId: String
    },
    // Track the user who initiated the execution
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  });

  // Calculate duration when execution completes
  executionSchema.pre('save', function(next) {
    if (this.status === 'completed' || this.status === 'failed') {
      if (this.completedAt && this.startedAt) {
        this.duration = (this.completedAt - this.startedAt) / 1000; // Duration in seconds
      }
    }
    next();
  });

  return mongoose.model('Execution', executionSchema);
})();

module.exports = Execution;