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
  XCircle
} from 'lucide-react';
import { Alert } from '../../types';
import { alertsAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'encroachment' | 'deforestation' | 'claim_update' | 'system'>('all');
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

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = severity === 'high' ? 'text-red-600' : 
                     severity === 'medium' ? 'text-yellow-600' : 'text-blue-600';
    
    switch (type) {
      case 'encroachment':
        return <AlertTriangle className={`w-6 h-6 ${iconClass}`} />;
      case 'deforestation':
        return <XCircle className={`w-6 h-6 ${iconClass}`} />;
      case 'claim_update':
        return <CheckCircle className={`w-6 h-6 ${iconClass}`} />;
      case 'system':
        return <Bell className={`w-6 h-6 ${iconClass}`} />;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'encroachment': return 'Encroachment';
      case 'deforestation': return 'Deforestation';
      case 'claim_update': return 'Claim Update';
      case 'system': return 'System';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('alerts')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor real-time alerts and notifications
        </p>
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
                  {getAlertIcon(alert.type, alert.severity)}
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getTypeLabel(alert.type)}
                      </h3>
                      <span className={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </span>
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
                <div className="flex-shrink-0">
                  {!alert.resolved && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
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
    </div>
  );
};

export default Alerts;