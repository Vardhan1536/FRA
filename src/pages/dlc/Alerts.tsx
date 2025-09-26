import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  Download,
  Search,
  Filter,
  Eye,
  Shield,
  TreePine,
  AlertCircle,
  Info
} from 'lucide-react';
import { dlcAPI } from '../../utils/api';
import { Alert } from '../../types';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string, comments?: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deforestation':
        return <TreePine className="w-5 h-5 text-red-500" />;
      case 'encroachment':
        return <Shield className="w-5 h-5 text-orange-500" />;
      case 'fraudulent_claims':
        return <AlertTriangle className="w-5 h-5 text-purple-500" />;
      case 'urgent_review':
        return <Clock className="w-5 h-5 text-red-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deforestation':
        return 'Deforestation';
      case 'encroachment':
        return 'Encroachment';
      case 'fraudulent_claims':
        return 'Fraudulent Claims';
      case 'urgent_review':
        return 'Urgent Review';
      case 'system':
        return 'System Alert';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-200 ${
        alert.resolved ? 'border-gray-200 dark:border-gray-700 opacity-75' : getSeverityColor(alert.severity)
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getTypeIcon(alert.type)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getTypeLabel(alert.type)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alert.location}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getSeverityColor(alert.severity)}`}>
            {getSeverityIcon(alert.severity)}
            <span className="ml-1">{alert.severity.toUpperCase()}</span>
          </span>
          {alert.resolved && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full text-xs font-medium flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Resolved
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {alert.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatTimeAgo(alert.timestamp)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{alert.location}</span>
          </div>
        </div>
      </div>

      {alert.acknowledgedBy && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
            <User className="w-4 h-4" />
            <span>Acknowledged by {alert.acknowledgedBy}</span>
            <span>•</span>
            <span>{alert.acknowledgedAt?.toLocaleDateString()}</span>
          </div>
          {alert.comments && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              "{alert.comments}"
            </p>
          )}
        </div>
      )}

      {!alert.resolved && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Requires DLC attention
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAcknowledge(alert.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Acknowledge</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [acknowledgeComments, setAcknowledgeComments] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const alertsData = await dlcAPI.getDLCAerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setSelectedAlertId(alertId);
    setShowAcknowledgeModal(true);
  };

  const handleAcknowledgeSubmit = async () => {
    if (!selectedAlertId) return;

    try {
      await dlcAPI.acknowledgeDLCAlert(selectedAlertId, acknowledgeComments);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === selectedAlertId 
          ? { 
              ...alert, 
              resolved: true,
              acknowledgedBy: 'DLC Officer',
              acknowledgedAt: new Date(),
              comments: acknowledgeComments
            }
          : alert
      ));
      
      setShowAcknowledgeModal(false);
      setSelectedAlertId(null);
      setAcknowledgeComments('');
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = [
        'ID,Type,Location,Severity,Description,Timestamp,Resolved,Acknowledged By,Acknowledged At',
        ...alerts.map(alert => 
          `${alert.id},${alert.type},${alert.location},${alert.severity},"${alert.description}",${alert.timestamp.toISOString()},${alert.resolved},${alert.acknowledgedBy || 'N/A'},${alert.acknowledgedAt?.toISOString() || 'N/A'}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dlc-alerts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'resolved' && alert.resolved) ||
                         (statusFilter === 'unresolved' && !alert.resolved);
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
  const highSeverityAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved).length;
  const acknowledgedAlerts = alerts.filter(a => a.acknowledgedBy).length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">District Alerts</h1>
          <p className="text-emerald-100 text-lg">
            Monitor district-level alerts, deforestation, encroachment, and fraudulent claims
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
            alt="Forest background"
            className="w-96 h-96 object-cover"
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {totalAlerts}
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
                Unresolved
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {unresolvedAlerts}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Clock className="w-8 h-8 text-red-600" />
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
                High Severity
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {highSeverityAlerts}
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
                Acknowledged
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {acknowledgedAlerts}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            District-Level Alerts
          </h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="deforestation">Deforestation</option>
              <option value="encroachment">Encroachment</option>
              <option value="fraudulent_claims">Fraudulent Claims</option>
              <option value="urgent_review">Urgent Review</option>
              <option value="system">System</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAcknowledgeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Acknowledge Alert
                </h2>
                <button
                  onClick={() => setShowAcknowledgeModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={acknowledgeComments}
                  onChange={(e) => setAcknowledgeComments(e.target.value)}
                  placeholder="Add any comments about this alert..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAcknowledgeModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAcknowledgeSubmit}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Acknowledge
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
