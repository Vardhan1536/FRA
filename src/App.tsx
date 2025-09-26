import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/grama-sabha/Dashboard';
import MapView from './pages/grama-sabha/MapView';
import Claims from './pages/grama-sabha/Claims';
import Alerts from './pages/grama-sabha/Alerts';
import Settings from './pages/grama-sabha/Settings';
// SDLC pages
import SDLCDashboard from './pages/sdlc/Dashboard';
import SDLCAlerts from './pages/sdlc/Alerts';
import SDLCSettings from './pages/sdlc/Settings';
import './i18n';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  const getDefaultRoute = () => {
    if (!currentUser) return '/';
    switch (currentUser.role) {
      case 'SDLC':
        return '/sdlc/dashboard';
      case 'DLC':
        return '/dlc/dashboard';
      default:
        return '/grama-sabha/dashboard';
    }
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={currentUser ? <Navigate to={getDefaultRoute()} replace /> : <LoginForm />} 
        />
        
        {/* Grama Sabha Routes */}
        <Route 
          path="/grama-sabha/*" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="claims" element={<Claims />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* SDLC Routes */}
        <Route 
          path="/sdlc/*" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SDLCDashboard />} />
          <Route path="alerts" element={<SDLCAlerts />} />
          <Route path="settings" element={<SDLCSettings />} />
        </Route>

        {/* DLC Routes - Placeholder for future implementation */}
        <Route 
          path="/dlc/*" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">DLC Dashboard - Coming Soon</h1></div>} />
          <Route path="alerts" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">DLC Alerts - Coming Soon</h1></div>} />
          <Route path="settings" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">DLC Settings - Coming Soon</h1></div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;