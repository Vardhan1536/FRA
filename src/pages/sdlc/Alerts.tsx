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
  Bell,
  XCircle
} from 'lucide-react';
import AlertCard from '../../components/SDLC/AlertCard';
import { sdlcAPI, alertsAPI } from '../../utils/api';
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
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadAlerts();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Use the same monitoring API with user role for SDLC
      const alertsData = await alertsAPI.getAll();
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
      await alertsAPI.acknowledge(selectedAlert.id);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === selectedAlert.id 
          ? { 
              ...alert, 
              resolved: true,
              acknowledgedBy: 'SDLC Officer',
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
    setSelectedAlert(alert);
    setShowDetailModal(true);
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
              <option value="change_detection">Change Detection</option>
              <option value="urgent_review">Urgent Review</option>
              <option value="dss_flag">DSS Flag</option>
              <option value="anomaly">Anomaly</option>
              <option value="encroachment">Encroachment</option>
              <option value="deforestation">Deforestation</option>
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
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                await alertsAPI.refreshChangeDetection();
                await loadAlerts();
              } catch (error) {
                console.error('Failed to refresh change detection data:', error);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Change Detection</span>
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

      {/* Detailed View Modal */}
      {showDetailModal && selectedAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Alert Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Alert ID:</span>
                        <span className="font-medium">{selectedAlert.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="font-medium">{selectedAlert.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Severity:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedAlert.severity === 'high' ? 'bg-red-100 text-red-800' :
                          selectedAlert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedAlert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedAlert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedAlert.resolved ? 'RESOLVED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                        <span className="font-medium">{selectedAlert.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Location Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="font-medium">{selectedAlert.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
                        <span className="font-medium">{selectedAlert.coordinates[0]}, {selectedAlert.coordinates[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAlert.description}</p>
                </div>

                {/* Change Detection Details */}
                {selectedAlert.changeDetection && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Change Detection Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Change Type:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.change_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Detection Date:</span>
                        <span className="font-medium">{new Date(selectedAlert.changeDetection.detection_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Area Change:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.area_change_hectares} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Confidence Score:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.confidence_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Risk Category:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedAlert.changeDetection.risk_category === 'High' ? 'bg-red-100 text-red-800' :
                          selectedAlert.changeDetection.risk_category === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedAlert.changeDetection.risk_category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Beneficiary ID:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.beneficiary_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Asset ID:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.asset_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Title ID:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.title_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Village:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.village_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">GP:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.gp_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Block:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.block_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">District:</span>
                        <span className="font-medium">{selectedAlert.changeDetection.district}</span>
                      </div>
                    </div>
                    
                    {selectedAlert.changeDetection.description && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Additional Details</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedAlert.changeDetection.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Acknowledgment Information */}
                {selectedAlert.acknowledgedBy && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Acknowledgment Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Acknowledged By:</span>
                        <span className="font-medium">{selectedAlert.acknowledgedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Acknowledged At:</span>
                        <span className="font-medium">{selectedAlert.acknowledgedAt?.toLocaleString()}</span>
                      </div>
                      {selectedAlert.comments && (
                        <div className="mt-2">
                          <span className="text-gray-600 dark:text-gray-400">Comments:</span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{selectedAlert.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Alerts;
