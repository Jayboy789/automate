// models/index.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import individual models to ensure they're registered
const User = require('./User');
const Client = require('./Client');
const Agent = require('./Agent');
const Script = require('./Script');
const Workflow = require('./Workflow');
const Execution = require('./Execution');
const Job = require('./Job');

// Export all models
module.exports = {
  User,
  Client,
  Agent,
  Script,
  Workflow,
  Execution,
  Job
};