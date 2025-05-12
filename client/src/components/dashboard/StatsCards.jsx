import React from 'react';

const StatsCards = ({ stats }) => {
  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon workflow-icon">
          <i className="fa fa-project-diagram"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.workflowCount}</div>
          <div className="stat-label">Workflows</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon script-icon">
          <i className="fa fa-code"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.scriptCount}</div>
          <div className="stat-label">Scripts</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon agent-icon">
          <i className="fa fa-robot"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">
            {stats.onlineAgents} / {stats.agentCount}
          </div>
          <div className="stat-label">Online Agents</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
          <i className="fa fa-history"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">0</div>
          <div className="stat-label">Executions Today</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;