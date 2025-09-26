import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Clock,
  Target
} from 'lucide-react';
import { DSSValidation } from '../../types';

interface DSSValidationCardProps {
  validation: DSSValidation;
}

const DSSValidationCard: React.FC<DSSValidationCardProps> = ({ validation }) => {
  const { t } = useTranslation();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-50 dark:bg-green-900/20';
    if (confidence >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reject':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'approve':
        return 'Recommend Approval';
      case 'reject':
        return 'Recommend Rejection';
      default:
        return 'Requires Review';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'reject':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Shield className="w-6 h-6 mr-2 text-emerald-600" />
          {t('dss_validation')}
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getActionColor(validation.recommendedAction)}`}>
          {getActionIcon(validation.recommendedAction)}
          <span className="ml-2">{getActionText(validation.recommendedAction)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidence Score */}
        <div className={`p-4 rounded-lg ${getConfidenceBg(validation.confidence)}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('confidence_score')}
            </h4>
            <span className={`text-2xl font-bold ${getConfidenceColor(validation.confidence)}`}>
              {validation.confidence}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                validation.confidence >= 80 ? 'bg-green-500' :
                validation.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.confidence}%` }}
            />
          </div>
        </div>

        {/* Validation Status */}
        <div className={`p-4 rounded-lg ${validation.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
            )}
            Validation Status
          </h4>
          <p className={`text-sm font-medium ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.isValid ? 'Valid' : 'Invalid'}
          </p>
        </div>

        {/* Timestamp */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-600" />
            Analysis Time
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {validation.timestamp.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {validation.suggestions.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            DSS Suggestions
          </h4>
          <div className="space-y-2">
            {validation.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {validation.riskFactors.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            {t('risk_factors')}
          </h4>
          <div className="space-y-2">
            {validation.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DSSValidationCard;
