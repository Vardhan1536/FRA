import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Layer, MapFilter, DashboardStats } from '../types';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  mapLayers: Layer[];
  toggleLayer: (layerName: string) => void;
  mapFilter: MapFilter;
  updateMapFilter: (filter: Partial<MapFilter>) => void;
  dashboardStats: DashboardStats;
  updateStats: (stats: Partial<DashboardStats>) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('en');
  const [offlineMode, setOfflineMode] = useState(false);
  const [mapLayers, setMapLayers] = useState<Layer[]>([
    { name: 'Potential FRA Areas', color: '#FFFF00', data: null, visible: true, type: 'potential' },
    { name: 'Granted Patta Boundaries', color: '#008000', data: null, visible: true, type: 'granted' },
    { name: 'Pending Claims', color: '#FFA500', data: null, visible: true, type: 'pending' },
    { name: 'Rejected Claims', color: '#FF0000', data: null, visible: true, type: 'rejected' },
    { name: 'Encroachment Zones', color: '#800080', data: null, visible: true, type: 'encroachment' },
    { name: 'Scheme Assets', color: '#00FFFF', data: null, visible: true, type: 'scheme' },
    { name: 'Demographic Hotspots', color: '#FFC0CB', data: null, visible: true, type: 'demographic' }
  ]);
  const [mapFilter, setMapFilter] = useState<MapFilter>({
    state: 'Madhya Pradesh',
    district: '',
    village: '',
    tribalGroup: ''
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClaims: 156,
    approvedPattas: 89,
    pendingClaims: 45,
    rejectedClaims: 22,
    totalArea: 2845.6,
    activeAlerts: 7
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const toggleOfflineMode = useCallback(() => {
    setOfflineMode(prev => !prev);
  }, []);

  const toggleLayer = useCallback((layerName: string) => {
    setMapLayers(prev => 
      prev.map(layer => 
        layer.name === layerName 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  }, []);

  const updateMapFilter = useCallback((filter: Partial<MapFilter>) => {
    setMapFilter(prev => ({ ...prev, ...filter }));
  }, []);

  const updateStats = useCallback((stats: Partial<DashboardStats>) => {
    setDashboardStats(prev => ({ ...prev, ...stats }));
  }, []);

  const value = {
    theme,
    toggleTheme,
    language,
    setLanguage,
    offlineMode,
    toggleOfflineMode,
    mapLayers,
    toggleLayer,
    mapFilter,
    updateMapFilter,
    dashboardStats,
    updateStats
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};