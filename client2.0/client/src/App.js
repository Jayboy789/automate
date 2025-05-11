import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import WorkflowsList from './components/workflow/WorkflowsList';
import WorkflowEditor from './components/workflow/WorkflowEditor';
import ScriptsList from './components/scripts/ScriptsList';
import ScriptEditor from './components/scripts/ScriptEditor';
import ClientsList from './components/clients/ClientsList';
import AgentsList from './components/agents/AgentsList';
import AgentDetails from './components/agents/AgentDetails';
import ExecutionDetails from './components/executions/ExecutionDetails';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#10b981',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <Dashboard />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/workflows" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <WorkflowsList />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/workflows/:id" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content workflow-editor-container">
                        <WorkflowEditor />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/scripts" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <ScriptsList />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/scripts/:id" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <ScriptEditor />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/clients" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <ClientsList />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/agents" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <AgentsList />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/agents/:id" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <AgentDetails />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/executions/:id" element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Sidebar />
                      <div className="page-content">
                        <ExecutionDetails />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Redirect to dashboard as fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;