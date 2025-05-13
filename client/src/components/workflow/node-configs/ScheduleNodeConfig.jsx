// src/components/workflow/node-configs/ScheduleNodeConfig.jsx
import React from 'react';

const ScheduleNodeConfig = ({ node, onChange }) => {
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  return (
    <div className="node-config schedule-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Schedule"
        />
      </div>
      
      <div className="form-group">
        <label>Schedule Type</label>
        <select
          value={node.data.scheduleType || 'cron'}
          onChange={(e) => updateNodeData({ scheduleType: e.target.value })}
        >
          <option value="cron">Cron Expression</option>
          <option value="interval">Interval</option>
          <option value="fixed">Fixed Time</option>
        </select>
      </div>
      
      {node.data.scheduleType === 'cron' && (
        <div className="form-group">
          <label>Cron Expression</label>
          <input
            type="text"
            value={node.data.cronExpression || ''}
            onChange={(e) => updateNodeData({ cronExpression: e.target.value })}
            placeholder="0 0 * * *"
          />
          <div className="form-help">
            Example: "0 0 * * *" (Daily at midnight)
          </div>
        </div>
      )}
      
      {node.data.scheduleType === 'interval' && (
        <div className="form-group">
          <label>Interval (minutes)</label>
          <input
            type="number"
            min="1"
            value={node.data.intervalMinutes || 60}
            onChange={(e) => updateNodeData({ intervalMinutes: parseInt(e.target.value) || 60 })}
          />
        </div>
      )}
      
      {node.data.scheduleType === 'fixed' && (
        <div className="form-group">
          <label>Fixed Time</label>
          <input
            type="time"
            value={node.data.fixedTime || ''}
            onChange={(e) => updateNodeData({ fixedTime: e.target.value })}
          />
        </div>
      )}
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="What this schedule does"
        />
      </div>
    </div>
  );
};

export default ScheduleNodeConfig;