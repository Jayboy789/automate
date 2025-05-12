import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const ConnectionDiagnostic = () => {
  const { connected, reconnect } = useSocket();
  const [diagnostics, setDiagnostics] = useState({
    serverReachable: false,
    mongoConnected: false,
    socketConnected: false,
    apiAvailable: false,
    browserInfo: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      setLoading(true);
      
      // Check server connection
      let serverReachable = false;
      try {
        const response = await axios.get('http://localhost:5000', { timeout: 5000 });
        serverReachable = response.status === 200;
      } catch (error) {
        console.error('Server diagnostic error:', error);
      }
      
      // Check API endpoints
      let apiAvailable = false;
      try {
        const response = await axios.get('http://localhost:5000/api/workflows', { timeout: 5000 });
        apiAvailable = Array.isArray(response.data);
      } catch (error) {
        console.error('API diagnostic error:', error);
      }
      
      // Get browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        webSocketSupport: 'WebSocket' in window,
        cookiesEnabled: navigator.cookieEnabled,
        language: navigator.language,
        online: navigator.onLine
      };
      
      setDiagnostics({
        serverReachable,
        socketConnected: connected,
        apiAvailable,
        browserInfo
      });
      
      setLoading(false);
    };
    
    runDiagnostics();
  }, [connected]);

  const handleRetryConnection = () => {
    reconnect();
    window.location.reload();
  };

  if (loading) {
    return <div>Running connection diagnostics...</div>;
  }

  return (
    <div className="diagnostics-panel">
      <h3>Connection Diagnostics</h3>
      
      <div className="diagnostics-results">
        <div className={`diagnostic-item ${diagnostics.serverReachable ? 'success' : 'failure'}`}>
          <span className="label">Server Reachable:</span>
          <span className="value">{diagnostics.serverReachable ? 'Yes' : 'No'}</span>
        </div>
        
        <div className={`diagnostic-item ${diagnostics.socketConnected ? 'success' : 'failure'}`}>
          <span className="label">Socket Connected:</span>
          <span className="value">{diagnostics.socketConnected ? 'Yes' : 'No'}</span>
        </div>
        
        <div className={`diagnostic-item ${diagnostics.apiAvailable ? 'success' : 'failure'}`}>
          <span className="label">API Available:</span>
          <span className="value">{diagnostics.apiAvailable ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div className="browser-info">
        <h4>Browser Information</h4>
        <div>WebSocket Support: {diagnostics.browserInfo.webSocketSupport ? 'Yes' : 'No'}</div>
        <div>Online Status: {diagnostics.browserInfo.online ? 'Online' : 'Offline'}</div>
      </div>
      
      <div className="actions">
        <button 
          className="btn btn-primary"
          onClick={handleRetryConnection}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
};

export default ConnectionDiagnostic;