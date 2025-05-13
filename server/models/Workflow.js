// server/models/Workflow.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate model error
const Workflow = mongoose.models.Workflow || (() => {
  const nodeSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }, { _id: false });

  const edgeSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    target: {
      type: String,
      required: true
    },
    sourceHandle: String,
    targetHandle: String,
    type: String,
    animated: Boolean,
    style: mongoose.Schema.Types.Mixed
  }, { _id: false });

  const workflowSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    variables: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    tags: [{
      type: String,
      trim: true
    }],
    category: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastExecuted: {
      type: Date
    }
  });

  // Update the 'updatedAt' field on save
  workflowSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  return mongoose.model('Workflow', workflowSchema);
})();

module.exports = Workflow;