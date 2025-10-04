import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  Users,
  TreePine,
  Droplets,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceSuggestionsAPI } from '../../utils/api';
import { ResourceSuggestionsResponse, ResourceIntervention } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ResourceSuggestions: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<ResourceSuggestionsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuggestions = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const role = currentUser?.role || 'GramaSabha';
      const data = await resourceSuggestionsAPI.getResourceSuggestions(role, forceRefresh);
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching resource suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resource suggestions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentUser]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSchemeIcon = (scheme: string) => {
    if (scheme.toLowerCase().includes('jal') || scheme.toLowerCase().includes('water')) {
      return <Droplets className="w-5 h-5 text-blue-600" />;
    } else if (scheme.toLowerCase().includes('van') || scheme.toLowerCase().includes('forest')) {
      return <TreePine className="w-5 h-5 text-green-600" />;
    } else if (scheme.toLowerCase().includes('employment') || scheme.toLowerCase().includes('mgnre')) {
      return <Wrench className="w-5 h-5 text-orange-600" />;
    } else if (scheme.toLowerCase().includes('tribal') || scheme.toLowerCase().includes('village')) {
      return <Users className="w-5 h-5 text-purple-600" />;
    }
    return <TrendingUp className="w-5 h-5 text-emerald-600" />;
  };

  const handleRefresh = () => {
    fetchSuggestions(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Resource Suggestions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const villageEntries = Object.entries(suggestions);
  const totalInterventions = villageEntries.reduce((sum, [, villageData]) => sum + villageData.interventions.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Resource Suggestions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered recommendations for village development
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Villages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{villageEntries.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interventions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInterventions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {villageEntries.reduce((sum, [, villageData]) => 
                    sum + villageData.interventions.filter(i => i.priority === 'high').length, 0
                  )}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>
        </div>

        {/* Village Suggestions */}
        {villageEntries.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Suggestions Available</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Resource suggestions will appear here when available for your village.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {villageEntries.map(([villageId, villageData], villageIndex) => (
              <motion.div
                key={villageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: villageIndex * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Village Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Village {villageId.replace('VIL_', '')}
                    </h2>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-full text-sm font-medium">
                      {villageData.interventions.length} interventions
                    </span>
                  </div>
                </div>

                {/* Interventions */}
                <div className="p-6">
                  <div className="grid gap-6">
                    {villageData.interventions.map((intervention: ResourceIntervention, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (villageIndex * 0.1) + (index * 0.05) }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        {/* Intervention Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getSchemeIcon(intervention.scheme)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {intervention.scheme}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(intervention.priority)}`}>
                                  {getPriorityIcon(intervention.priority)}
                                  <span className="ml-1 capitalize">{intervention.priority} Priority</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                            Why This Intervention?
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {intervention.reason}
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2 text-emerald-600" />
                            Implementation Details
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {intervention.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceSuggestions;
