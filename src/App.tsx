import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/grama-sabha/Dashboard';
import MapView from './pages/grama-sabha/MapView';
import Claims from './pages/grama-sabha/Claims';
import CheckPatta from './pages/grama-sabha/CheckPatta';
import Schemes from './pages/grama-sabha/Schemes';
import ResourceSuggestions from './pages/grama-sabha/ResourceSuggestions';
import Alerts from './pages/grama-sabha/Alerts';
import Settings from './pages/grama-sabha/Settings';
import VolunteerUpload from './pages/VolunteerUpload';
// SDLC pages
import SDLCDashboard from './pages/sdlc/Dashboard';
import SDLCClaims from './pages/sdlc/Claims';
import SDLCCheckPatta from './pages/sdlc/CheckPatta';
import SDLCSchemes from './pages/sdlc/Schemes';
import SDLCResourceSuggestions from './pages/sdlc/ResourceSuggestions';
import SDLCAlerts from './pages/sdlc/Alerts';
import SDLCSettings from './pages/sdlc/Settings';
// DLC pages
import DLCDashboard from './pages/dlc/Dashboard';
import DLCMap from './pages/dlc/Map';
import DLCClaims from './pages/dlc/Claims';
import DLCCheckPatta from './pages/dlc/CheckPatta';
import DLCSchemes from './pages/dlc/Schemes';
import DLCResourceSuggestions from './pages/dlc/ResourceSuggestions';
import DLCAlerts from './pages/dlc/Alerts';
import DLCSettings from './pages/dlc/Settings';
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
        
        {/* Public Volunteer Upload Route */}
        <Route path="/volunteer-upload" element={<VolunteerUpload />} />
        
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
          <Route path="check-patta" element={<CheckPatta />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="resource-suggestions" element={<ResourceSuggestions />} />
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
          <Route path="claims" element={<SDLCClaims />} />
          <Route path="check-patta" element={<SDLCCheckPatta />} />
          <Route path="schemes" element={<SDLCSchemes />} />
          <Route path="resource-suggestions" element={<SDLCResourceSuggestions />} />
          <Route path="alerts" element={<SDLCAlerts />} />
          <Route path="settings" element={<SDLCSettings />} />
        </Route>

        {/* DLC Routes */}
        <Route 
          path="/dlc/*" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } 
        >
           
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DLCDashboard />} />
          <Route path="map" element={<DLCMap />} />
          <Route path="claims" element={<DLCClaims />} />
          <Route path="check-patta" element={<DLCCheckPatta />} />
          <Route path="schemes" element={<DLCSchemes />} />
          <Route path="resource-suggestions" element={<DLCResourceSuggestions />} />
          <Route path="alerts" element={<DLCAlerts />} />
          <Route path="settings" element={<DLCSettings />} />
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