import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  FileText,
  Layers,
  Globe,
  BarChart3,
  Shield,
  Building,
  AlertCircle
} from 'lucide-react';

const Map: React.FC = () => {
  const [activeMap, setActiveMap] = useState<'landcover' | 'demographics' | 'claims'>('landcover');
  const [currentFile, setCurrentFile] = useState<string>('mandla_villages_icons_map.html');

  const mapConfigs = {
    landcover: {
      title: 'Land Cover Map',
      description: 'Village icons and land cover visualization',
      icon: Layers,
      color: 'emerald',
      file: 'mandla_villages_icons_map.html'
    },
    demographics: {
      title: 'Demographics Map',
      description: 'Complete demographic analysis and visualization',
      icon: Users,
      color: 'blue',
      file: 'mandla_demographics_map_complete.html'
    },
    claims: {
      title: 'Claims Map',
      description: 'FRA beneficiaries and claims distribution',
      icon: FileText,
      color: 'purple',
      file: 'fra_all_beneficiaries_map.html'
    }
  };

  // Update currentFile when activeMap changes
  useEffect(() => {
    setCurrentFile(mapConfigs[activeMap].file);
  }, [activeMap]);

  const getButtonClasses = (mapType: string) => {
    const baseClasses = "flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-lg";
    const isActive = activeMap === mapType;
    const config = mapConfigs[mapType as keyof typeof mapConfigs];
    
    if (isActive) {
      return `${baseClasses} bg-${config.color}-600 text-white shadow-lg transform scale-105`;
    } else {
      return `${baseClasses} bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-${config.color}-300 hover:bg-${config.color}-50 dark:hover:bg-${config.color}-900/20`;
    }
  };

  const getIconClasses = (mapType: string) => {
    const isActive = activeMap === mapType;
    const config = mapConfigs[mapType as keyof typeof mapConfigs];
    
    if (isActive) {
      return `w-6 h-6 text-white`;
    } else {
      return `w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <MapPin className="w-8 h-8 mr-3" />
            DLC Interactive Maps
          </h1>
          <p className="text-emerald-100 text-lg">
            Comprehensive mapping and visualization tools for forest rights analysis
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Interactive WebGIS</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Data Visualization</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>DLC Authority</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
            alt="Forest background"
            className="w-96 h-96 object-cover"
          />
        </div>
      </motion.div>

      {/* Map Selection Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Building className="w-6 h-6 mr-2 text-emerald-600" />
          Select Map View
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(mapConfigs).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMap(key as 'landcover' | 'demographics' | 'claims')}
                className={getButtonClasses(key)}
              >
                <IconComponent className={getIconClasses(key)} />
                <div className="text-left">
                  <div className="font-semibold text-lg">{config.title}</div>
                  <div className="text-sm opacity-80">{config.description}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Map Display Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(() => {
                const config = mapConfigs[activeMap];
                const IconComponent = config.icon;
                return (
                  <>
                    <IconComponent className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`} />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {config.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 bg-${mapConfigs[activeMap].color}-100 text-${mapConfigs[activeMap].color}-800 dark:bg-${mapConfigs[activeMap].color}-900/20 dark:text-${mapConfigs[activeMap].color}-300 rounded-full text-sm font-medium`}>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative" style={{ height: '70vh', minHeight: '500px' }}>
          <iframe
            src={currentFile}
            title={mapConfigs[activeMap].title}
            className="w-full h-full border-0 rounded-b-xl"
            style={{ 
              borderRadius: '0 0 0.75rem 0.75rem',
              background: '#f8fafc'
            }}
            onLoad={() => {
              console.log(`${mapConfigs[activeMap].title} map loaded successfully`);
            }}
            onError={(e) => {
              console.error(`Failed to load ${mapConfigs[activeMap].title} map:`, e);
            }}
          />
        </div>

        {/* Map Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Interactive Map</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>WebGIS Technology</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Powered by Leaflet & Folium
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(mapConfigs).map(([key, config]) => {
          const IconComponent = config.icon;
          const isActive = activeMap === key;
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (Object.keys(mapConfigs).indexOf(key) * 0.1) }}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                isActive 
                  ? `border-${config.color}-300 bg-${config.color}-50 dark:bg-${config.color}-900/20` 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-lg ${
                  isActive 
                    ? `bg-${config.color}-600 text-white` 
                    : `bg-${config.color}-100 text-${config.color}-600 dark:bg-${config.color}-900/20 dark:text-${config.color}-400`
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {config.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? `bg-${config.color}-500` : 'bg-gray-400'
                  }`}></div>
                  <span>Interactive visualization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? `bg-${config.color}-500` : 'bg-gray-400'
                  }`}></div>
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? `bg-${config.color}-500` : 'bg-gray-400'
                  }`}></div>
                  <span>DLC authorized access</span>
                </div>
                {key === 'claims' && (
                  <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Large dataset - may take longer to load
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Map;