import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ScheduleNode = memo(({ data, isConnectable, selected }) => {
  // Helper to format schedule display
  const getScheduleDisplay = () => {
    if (!data.scheduleType) return 'No schedule set';
    
    if (data.scheduleType === 'cron' && data.cronExpression) {
      return `CRON: ${data.cronExpression}`;
    } else if (data.scheduleType === 'interval' && data.intervalMinutes) {
      return `Every ${data.intervalMinutes} min`;
    } else if (data.scheduleType === 'fixed' && data.fixedTime) {
      return `At ${data.fixedTime} daily`;
    }
    
    return 'Schedule not configured';
  };

  return (
    <div className={`node custom-node schedule-node ${selected ? 'selected' : ''}`}>
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-calendar"></i>
          <span>{data.label || 'Schedule'}</span>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {getScheduleDisplay()}
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="main"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ScheduleNode;