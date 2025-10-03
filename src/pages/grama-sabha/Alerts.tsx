import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Filter,
  Search,
  Bell,
  XCircle,
  RefreshCw,
  TreePine,
  Droplets,
  Flame,
  Shield,
  Eye,
  Info,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Alert } from '../../types';
import { alertsAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'encroachment' | 'deforestation' | 'claim_update' | 'system' | 'change_detection'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const alertsData = await alertsAPI.getAll();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshChangeDetection = async () => {
    setRefreshing(true);
    try {
      await alertsAPI.refreshChangeDetection();
      await loadAlerts(); // Reload all alerts
    } catch (error) {
      console.error('Failed to refresh change detection data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertsAPI.acknowledge(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, acknowledgedBy: 'Current User' }
          : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesResolved = showResolved ? true : !alert.resolved;
    
    return matchesSearch && matchesType && matchesSeverity && matchesResolved;
  });

  const getAlertIcon = (alert: Alert) => {
    const { type, severity, changeDetection } = alert;
    const iconClass = severity === 'high' ? 'text-red-600' : 
                     severity === 'medium' ? 'text-yellow-600' : 'text-blue-600';
    
    // For change detection alerts, use specific icons based on change type
    if (changeDetection) {
      switch (changeDetection.change_type) {
        case 'Reforestation':
          return <TreePine className={`w-6 h-6 ${iconClass}`} />;
        case 'Deforestation':
          return <TrendingDown className={`w-6 h-6 text-red-600`} />;
        case 'Water_Level_Change':
          return <Droplets className={`w-6 h-6 ${iconClass}`} />;
        case 'Forest_Fire':
          return <Flame className={`w-6 h-6 text-red-600`} />;
        case 'Encroachment':
          return <AlertTriangle className={`w-6 h-6 ${iconClass}`} />;
        case 'No_Change':
          return <Minus className={`w-6 h-6 ${iconClass}`} />;
        default:
          return <Shield className={`w-6 h-6 ${iconClass}`} />;
      }
    }
    
    // For regular alerts
    switch (type) {
      case 'encroachment':
        return <AlertTriangle className={`w-6 h-6 ${iconClass}`} />;
      case 'deforestation':
        return <TrendingDown className={`w-6 h-6 text-red-600`} />;
      case 'claim_update':
        return <CheckCircle className={`w-6 h-6 ${iconClass}`} />;
      case 'system':
        return <Bell className={`w-6 h-6 ${iconClass}`} />;
      case 'change_detection':
        return <Shield className={`w-6 h-6 ${iconClass}`} />;
      default:
        return <AlertTriangle className={`w-6 h-6 ${iconClass}`} />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (severity) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'low':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      default:
        return baseClasses;
    }
  };

  const getTypeLabel = (alert: Alert) => {
    if (alert.changeDetection) {
      return alert.changeDetection.change_type.replace(/_/g, ' ');
    }
    
    switch (alert.type) {
      case 'encroachment': return 'Encroachment';
      case 'deforestation': return 'Deforestation';
      case 'claim_update': return 'Claim Update';
      case 'system': return 'System';
      case 'change_detection': return 'Change Detection';
      default: return alert.type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('alerts')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor real-time alerts and change detection notifications
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshChangeDetection}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search alerts by description or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="change_detection">Change Detection</option>
                <option value="encroachment">Encroachment</option>
                <option value="deforestation">Deforestation</option>
                <option value="claim_update">Claim Update</option>
                <option value="system">System</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Priorities</option>
                <option value="high">{t('high_priority')}</option>
                <option value="medium">{t('medium_priority')}</option>
                <option value="low">{t('low_priority')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show resolved alerts
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No alerts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no alerts matching your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${
                alert.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Alert Icon */}
                <div className="flex-shrink-0">
                  {getAlertIcon(alert)}
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getTypeLabel(alert)}
                      </h3>
                      <span className={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </span>
                      {alert.changeDetection && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full text-xs font-medium">
                          {alert.changeDetection.risk_category} Risk
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full text-xs font-medium">
                          {t('resolved')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {alert.description}
                  </p>

                  {/* Change Detection Details */}
                  {alert.changeDetection && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Area Change:</span>
                          <span className={`ml-1 ${alert.changeDetection.area_change_hectares < 0 ? 'text-red-600' : alert.changeDetection.area_change_hectares > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {alert.changeDetection.area_change_hectares > 0 ? '+' : ''}{alert.changeDetection.area_change_hectares.toFixed(2)} ha
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
                          <span className="ml-1 text-blue-600 dark:text-blue-400">
                            {(alert.changeDetection.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Beneficiary:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {alert.changeDetection.beneficiary_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Title ID:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {alert.changeDetection.title_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Asset ID:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {alert.changeDetection.asset_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">GP:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {alert.changeDetection.gp_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {alert.acknowledgedBy && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Acknowledged by: {alert.acknowledgedBy}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col space-y-2">
                  {alert.changeDetection && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedAlert(alert)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </motion.button>
                  )}
                  {!alert.resolved && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('acknowledge')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'blue' },
          { label: 'High Priority', value: alerts.filter(a => a.severity === 'high' && !a.resolved).length, color: 'red' },
          { label: 'Unresolved', value: alerts.filter(a => !a.resolved).length, color: 'yellow' },
          { label: 'Resolved', value: alerts.filter(a => a.resolved).length, color: 'green' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Change Detection Detail Modal */}
      {selectedAlert && selectedAlert.changeDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Change Detection Details
              </h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Change Overview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  {getAlertIcon(selectedAlert)}
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    {selectedAlert.changeDetection.change_type.replace(/_/g, ' ')}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detection Date</h4>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedAlert.changeDetection.detection_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Category</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedAlert.changeDetection.risk_category === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                      selectedAlert.changeDetection.risk_category === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {selectedAlert.changeDetection.risk_category} Risk
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area Change</h4>
                    <p className={`text-lg font-semibold ${
                      selectedAlert.changeDetection.area_change_hectares < 0 ? 'text-red-600' : 
                      selectedAlert.changeDetection.area_change_hectares > 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {selectedAlert.changeDetection.area_change_hectares > 0 ? '+' : ''}
                      {selectedAlert.changeDetection.area_change_hectares.toFixed(2)} hectares
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confidence Score</h4>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {(selectedAlert.changeDetection.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    Location Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Village</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.village_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gram Panchayat</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.gp_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Block</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.block_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.district}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.state}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Village ID</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.village_id}</p>
                  </div>
                </div>
              </div>

              {/* Asset Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                    Asset Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beneficiary ID</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.beneficiary_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title ID</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.title_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset ID</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.asset_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Change ID</h4>
                    <p className="text-gray-900 dark:text-white">{selectedAlert.changeDetection.change_id}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                    Description
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedAlert.changeDetection.description}
                </p>
              </div>

              {/* Coordinates */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                    Geographic Coordinates
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-600 dark:text-gray-400">
                    {JSON.stringify(selectedAlert.changeDetection.coordinates, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Alerts;