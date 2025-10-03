import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle,
  MessageSquare,
  Eye,
  TreePine,
  TrendingDown,
  Droplets,
  Flame,
  Minus,
  Shield,
  Bell
} from 'lucide-react';
import { Alert } from '../../types';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string, comments?: string) => void;
  onView: (alert: Alert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onView }) => {
  const { t } = useTranslation();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: string, changeDetection?: any) => {
    // For change detection alerts, use specific icons based on change type
    if (changeDetection) {
      switch (changeDetection.change_type) {
        case 'Reforestation':
          return <TreePine className="w-5 h-5 text-green-600" />;
        case 'Deforestation':
          return <TrendingDown className="w-5 h-5 text-red-600" />;
        case 'Water_Level_Change':
          return <Droplets className="w-5 h-5 text-blue-600" />;
        case 'Forest_Fire':
          return <Flame className="w-5 h-5 text-red-600" />;
        case 'Encroachment':
          return <AlertTriangle className="w-5 h-5 text-orange-600" />;
        case 'No_Change':
          return <Minus className="w-5 h-5 text-gray-600" />;
        default:
          return <Shield className="w-5 h-5 text-blue-600" />;
      }
    }

    // For regular alerts
    switch (type) {
      case 'change_detection':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'urgent_review':
        return <Clock className="w-5 h-5 text-red-600" />;
      case 'dss_flag':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'deforestation':
        return <TreePine className="w-5 h-5 text-red-600" />;
      case 'encroachment':
        return <Shield className="w-5 h-5 text-orange-600" />;
      case 'fraudulent_claims':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      case 'claim_update':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
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
      case 'urgent_review':
        return 'Urgent Review Required';
      case 'dss_flag':
        return 'DSS Flag Alert';
      case 'anomaly':
        return 'Anomaly Detected';
      case 'system':
        return 'System Notification';
      case 'deforestation':
        return 'Deforestation Alert';
      case 'encroachment':
        return 'Encroachment Alert';
      case 'fraudulent_claims':
        return 'Fraudulent Claims Alert';
      case 'claim_update':
        return 'Claim Update Notification';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-200 ${
        alert.resolved ? 'opacity-75' : ''
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
              {formatTimeAgo(alert.timestamp)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center border ${getSeverityColor(alert.severity)}`}>
            {getSeverityIcon(alert.severity)}
            <span className="ml-1">{alert.severity.toUpperCase()}</span>
          </span>
          
          {alert.resolved && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Resolved
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{alert.location}</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{alert.description}</p>
      </div>

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
              <span className="text-gray-600 dark:text-gray-400">Title ID:</span>
              <span className="font-medium">{alert.changeDetection.title_id}</span>
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

      {alert.acknowledgedBy && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>Acknowledged by:</strong> {alert.acknowledgedBy}
            {alert.acknowledgedAt && (
              <span className="ml-2">on {alert.acknowledgedAt.toLocaleDateString()}</span>
            )}
          </p>
          {alert.comments && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              <strong>Comments:</strong> {alert.comments}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
          {alert.coordinates && (
            <span className="block truncate">
              Coordinates: {alert.coordinates[0]?.toFixed(6)}, {alert.coordinates[1]?.toFixed(6)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView(alert)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </motion.button>
          
          {!alert.resolved && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('acknowledge_alert')}</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AlertCard;
