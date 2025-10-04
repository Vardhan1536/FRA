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
  Wrench,
  BarChart3,
  Filter,
  Download,
  Eye,
  Target
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
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');

  const fetchSuggestions = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const role = currentUser?.role || 'DLC';
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

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      'Village ID,Scheme,Priority,Reason,Description',
      ...Object.entries(suggestions).flatMap(([villageId, villageData]) =>
        villageData.interventions.map(intervention => 
          `"${villageId}","${intervention.scheme}","${intervention.priority}","${intervention.reason.replace(/"/g, '""')}","${intervention.description.replace(/"/g, '""')}"`
        )
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-suggestions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter interventions based on priority and scheme
  const getFilteredSuggestions = () => {
    const filtered: ResourceSuggestionsResponse = {};
    
    Object.entries(suggestions).forEach(([villageId, villageData]) => {
      const filteredInterventions = villageData.interventions.filter(intervention => {
        const priorityMatch = priorityFilter === 'all' || intervention.priority === priorityFilter;
        const schemeMatch = schemeFilter === 'all' || 
          intervention.scheme.toLowerCase().includes(schemeFilter.toLowerCase());
        return priorityMatch && schemeMatch;
      });

      if (filteredInterventions.length > 0) {
        filtered[villageId] = {
          interventions: filteredInterventions
        };
      }
    });

    return filtered;
  };

  // Get all unique schemes for filter dropdown
  const getAllSchemes = () => {
    const schemes = new Set<string>();
    Object.values(suggestions).forEach(villageData => {
      villageData.interventions.forEach(intervention => {
        schemes.add(intervention.scheme);
      });
    });
    return Array.from(schemes).sort();
  };

  // Get summary statistics
  const getSummaryStats = () => {
    const stats = {
      totalVillages: Object.keys(suggestions).length,
      totalInterventions: Object.values(suggestions).reduce((sum, villageData) => sum + villageData.interventions.length, 0),
      priorityBreakdown: { high: 0, medium: 0, low: 0 },
      schemeBreakdown: {} as { [key: string]: number }
    };

    Object.values(suggestions).forEach(villageData => {
      villageData.interventions.forEach(intervention => {
        stats.priorityBreakdown[intervention.priority as keyof typeof stats.priorityBreakdown]++;
        stats.schemeBreakdown[intervention.scheme] = (stats.schemeBreakdown[intervention.scheme] || 0) + 1;
      });
    });

    return stats;
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

  const filteredSuggestions = getFilteredSuggestions();
  const villageEntries = Object.entries(filteredSuggestions);
  const totalInterventions = villageEntries.reduce((sum, [, villageData]) => sum + villageData.interventions.length, 0);
  const allSchemes = getAllSchemes();
  const summaryStats = getSummaryStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Resource Suggestions - DLC Strategic View
                </h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                  District-level resource allocation and strategic planning recommendations
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Controls</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View Mode</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="detailed">Detailed View</option>
                  <option value="summary">Summary View</option>
                </select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority Level</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheme Type</label>
                <select
                  value={schemeFilter}
                  onChange={(e) => setSchemeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Schemes</option>
                  {allSchemes.map(scheme => (
                    <option key={scheme} value={scheme}>{scheme}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Villages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalVillages}</p>
              </div>
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interventions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalInterventions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.priorityBreakdown.high}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Schemes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{allSchemes.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Summary View */}
        {viewMode === 'summary' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
              Strategic Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Priority Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(summaryStats.priorityBreakdown).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="capitalize text-gray-600 dark:text-gray-400">{priority} Priority</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                        {count} interventions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Schemes</h4>
                <div className="space-y-2">
                  {Object.entries(summaryStats.schemeBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([scheme, count]) => (
                      <div key={scheme} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-sm truncate">{scheme}</span>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Village Suggestions */}
        {villageEntries.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Matching Suggestions</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No resource suggestions match your current filters. Try adjusting the filter criteria.
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
                            <Target className="w-4 h-4 mr-2 text-amber-600" />
                            Strategic Rationale
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {intervention.reason}
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2 text-emerald-600" />
                            Implementation Strategy
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
