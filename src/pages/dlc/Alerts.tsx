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
  Info,
  TrendingDown,
  Droplets,
  Flame,
  Minus,
  Bell,
  RefreshCw
} from 'lucide-react';
import { dlcAPI, alertsAPI } from '../../utils/api';
import { Alert } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string, comments?: string) => void;
  onView: (alert: Alert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onView }) => {
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

  const getTypeIcon = (type: string, changeDetection?: any) => {
    // For change detection alerts, use specific icons based on change type
    if (changeDetection) {
      switch (changeDetection.change_type) {
        case 'Reforestation':
          return <TreePine className="w-5 h-5 text-green-500" />;
        case 'Deforestation':
          return <TrendingDown className="w-5 h-5 text-red-500" />;
        case 'Water_Level_Change':
          return <Droplets className="w-5 h-5 text-blue-500" />;
        case 'Forest_Fire':
          return <Flame className="w-5 h-5 text-red-500" />;
        case 'Encroachment':
          return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        case 'No_Change':
          return <Minus className="w-5 h-5 text-gray-500" />;
        default:
          return <Shield className="w-5 h-5 text-blue-500" />;
      }
    }

    // For regular alerts
    switch (type) {
      case 'change_detection':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'deforestation':
        return <TreePine className="w-5 h-5 text-red-500" />;
      case 'encroachment':
        return <Shield className="w-5 h-5 text-orange-500" />;
      case 'fraudulent_claims':
        return <AlertTriangle className="w-5 h-5 text-purple-500" />;
      case 'urgent_review':
        return <Clock className="w-5 h-5 text-red-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string, changeDetection?: any) => {
    // For change detection alerts, use the specific change type
    if (changeDetection) {
      return `${changeDetection.change_type.replace(/_/g, ' ')} Alert`;
    }

    // For regular alerts, provide proper labels
    switch (type) {
      case 'change_detection':
        return 'Change Detection Alert';
      case 'deforestation':
        return 'Deforestation Alert';
      case 'encroachment':
        return 'Encroachment Alert';
      case 'fraudulent_claims':
        return 'Fraudulent Claims Alert';
      case 'urgent_review':
        return 'Urgent Review Required';
      case 'system':
        return 'System Notification';
      case 'dss_flag':
        return 'DSS Flag Alert';
      case 'anomaly':
        return 'Anomaly Detected';
      case 'claim_update':
        return 'Claim Update Notification';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          {getTypeIcon(alert.type, alert.changeDetection)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getTypeLabel(alert.type, alert.changeDetection)}
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

      {/* Change Detection Details */}
      {alert.changeDetection && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Area Change:</span>
              <span className="font-medium">{alert.changeDetection.area_change_hectares} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <span className="font-medium">{alert.changeDetection.confidence_score}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Beneficiary ID:</span>
              <span className="font-medium">{alert.changeDetection.beneficiary_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Risk Category:</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${
                alert.changeDetection.risk_category === 'High' ? 'bg-red-100 text-red-800' :
                alert.changeDetection.risk_category === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {alert.changeDetection.risk_category}
              </span>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {alert.resolved ? 'Resolved' : 'Requires DLC attention'}
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView(alert)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
          
          {!alert.resolved && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Acknowledge</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [acknowledgeComments, setAcknowledgeComments] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    console.log('DLC Alerts: Component mounted, loading alerts...');
    loadAlerts();
  }, []);

  const loadAlerts = async (forceRefresh: boolean = false) => {
    if (!currentUser?.role) return;
    
    console.log('DLC Alerts: loadAlerts called');
    setLoading(true);
    try {
      // Use the same monitoring API with user role for DLC
      const alertsData = await alertsAPI.getAll(currentUser.role, forceRefresh);
      console.log('DLC Alerts: Received alerts data:', alertsData.length, 'alerts');
      setAlerts(alertsData);
    } catch (error) {
      console.error('DLC Alerts: Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setSelectedAlertId(alertId);
    setShowAcknowledgeModal(true);
  };

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const handleAcknowledgeSubmit = async () => {
    if (!selectedAlertId) return;

    try {
      await alertsAPI.acknowledge(selectedAlertId);
      
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            District-Level Alerts
          </h3>
          
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                <option value="change_detection">Change Detection</option>
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
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loadAlerts(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
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
                    await loadAlerts(true);
                  } catch (error) {
                    console.error('Failed to refresh change detection data:', error);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh API</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </motion.button>
            </div>
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
                onView={handleViewAlert}
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
                        <span className="font-medium text-right max-w-48 truncate">
                          {selectedAlert.coordinates[0]?.toFixed(6)}, {selectedAlert.coordinates[1]?.toFixed(6)}
                        </span>
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
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
