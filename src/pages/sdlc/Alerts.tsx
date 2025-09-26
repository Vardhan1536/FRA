import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Bell
} from 'lucide-react';
import AlertCard from '../../components/SDLC/AlertCard';
import { sdlcAPI } from '../../utils/api';
import { Alert } from '../../types';

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [acknowledgeComments, setAcknowledgeComments] = useState('');

  useEffect(() => {
    loadAlerts();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const alertsData = await sdlcAPI.getSDLCAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      setSelectedAlert(alert);
      setShowAcknowledgeModal(true);
    }
  };

  const handleAcknowledgeSubmit = async () => {
    if (!selectedAlert) return;

    try {
      await sdlcAPI.acknowledgeAlert(selectedAlert.id, acknowledgeComments);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === selectedAlert.id 
          ? { 
              ...alert, 
              resolved: true,
              acknowledgedBy: 'Current User',
              acknowledgedAt: new Date(),
              comments: acknowledgeComments
            }
          : alert
      ));
      
      setShowAcknowledgeModal(false);
      setSelectedAlert(null);
      setAcknowledgeComments('');
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleViewAlert = (alert: Alert) => {
    // In a real app, this would navigate to a detailed view or open a map
    console.log('Viewing alert:', alert);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'resolved' && alert.resolved) ||
                         (statusFilter === 'active' && !alert.resolved);
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const getAlertStats = () => {
    const total = alerts.length;
    const active = alerts.filter(a => !a.resolved).length;
    const high = alerts.filter(a => a.severity === 'high' && !a.resolved).length;
    const dssFlagged = alerts.filter(a => a.type === 'dss_flag' && !a.resolved).length;
    
    return { total, active, high, dssFlagged };
  };

  const stats = getAlertStats();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Bell className="w-8 h-8 mr-3" />
            {t('alerts')}
          </h1>
          <p className="text-amber-100 text-lg">
            Real-time monitoring and alert management
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <AlertTriangle className="w-96 h-96" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Alerts
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active Alerts
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.active}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                High Priority
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.high}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                DSS Flagged
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.dssFlagged}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <AlertTriangle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="urgent_review">Urgent Review</option>
              <option value="dss_flag">DSS Flag</option>
              <option value="anomaly">Anomaly</option>
              <option value="encroachment">Encroachment</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No alerts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No alerts to display at the moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onView={handleViewAlert}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('acknowledge_alert')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedAlert.description}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('add_comment')} (Optional)
              </label>
              <textarea
                value={acknowledgeComments}
                onChange={(e) => setAcknowledgeComments(e.target.value)}
                placeholder="Add any additional comments..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setSelectedAlert(null);
                  setAcknowledgeComments('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledgeSubmit}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                {t('acknowledge_alert')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
