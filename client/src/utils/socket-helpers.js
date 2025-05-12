/**
 * Socket connection utilities
 */

// Diagnose socket connection issues
export const diagnoseSocketConnection = () => {
  // Check if browser supports WebSockets
  const hasWebSockets = 'WebSocket' in window;
  
  // Check if we're using HTTPS (mixed content issues)
  const isSecureContext = window.isSecureContext;
  const isHttps = window.location.protocol === 'https:';
  
  // Check server URL
  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const isMixedContent = isHttps && serverUrl.startsWith('http:');
  
  // Log diagnostic info
  console.log('Socket Diagnostics:');
  console.log('- WebSocket Support:', hasWebSockets ? 'Yes' : 'No');
  console.log('- Secure Context:', isSecureContext ? 'Yes' : 'No');
  console.log('- Using HTTPS:', isHttps ? 'Yes' : 'No');
  console.log('- Server URL:', serverUrl);
  console.log('- Mixed Content Issue:', isMixedContent ? 'Yes' : 'No');
  
  // Return diagnostic results
  return {
    hasWebSockets,
    isSecureContext,
    isHttps,
    serverUrl,
    isMixedContent,
    // Overall assessment
    hasIssues: !hasWebSockets || (isHttps && isMixedContent)
  };
};

export default {
  diagnoseSocketConnection
};