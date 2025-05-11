// models/index.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Client Schema
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

// Agent Schema
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

// Script Schema
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

// Node Schema for Workflow
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

// Edge Schema for Workflow
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

// Workflow Schema
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

// Execution Schema
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
    default: {}
  },
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

// Job Schema
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

// Create and export models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
const Script = mongoose.models.Script || mongoose.model('Script', scriptSchema);
const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
const Execution = mongoose.models.Execution || mongoose.model('Execution', executionSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = {
  User,
  Client,
  Agent,
  Script,
  Workflow,
  Execution,
  Job
};