import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const ScheduleNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if schedule is configured
  const isScheduleConfigured = () => {
    if (!data.scheduleType) return false;
    
    if (data.scheduleType === 'cron' && data.cronExpression) return true;
    if (data.scheduleType === 'interval' && data.intervalMinutes) return true;
    if (data.scheduleType === 'fixed' && data.fixedTime) return true;
    
    return false;
  };
  
  const isValid = isScheduleConfigured();
  
  // Format schedule display
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
    <div 
      className={`node custom-node schedule-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-calendar"></i>
          <span>{data.label || 'Schedule'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Schedule configuration action
              }}
              title="Edit Schedule"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {getScheduleDisplay()}
          </div>
          
          {isExpanded && data.description && (
            <div className="node-description">
              {data.description}
            </div>
          )}
          
          {isExpanded && data.scheduleType === 'cron' && (
            <div className="cron-explanation">
              <div className="details-label">Next runs:</div>
              <div className="details-value">
                <div>Tomorrow at 9:00 AM</div>
                <div>Tomorrow at 2:00 PM</div>
                <div>Wednesday at 9:00 AM</div>
              </div>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Incomplete schedule configuration
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'waiting' && (
                <>
                  <i className="fa fa-hourglass-half"></i>
                  <span>Waiting</span>
                  {data.nextRun && (
                    <span className="next-run">Next: {new Date(data.nextRun).toLocaleString()}</span>
                  )}
                </>
              )}
              {data.executionStatus === 'triggered' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
            </div>
          )}
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