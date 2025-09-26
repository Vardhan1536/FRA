import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { Claim } from '../../types';

interface ClaimCardProps {
  claim: Claim;
  onReview: (claim: Claim) => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onReview }) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDSSStatusColor = (dssValidation?: boolean) => {
    if (dssValidation === true) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (dssValidation === false) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {claim.id}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(claim.status)}`}>
              {getStatusIcon(claim.status)}
              <span className="ml-1">{claim.status}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {claim.claimType} • {claim.area} hectares
          </p>
        </div>
        
        {claim.dssValidation !== undefined && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDSSStatusColor(claim.dssValidation)}`}>
            DSS: {claim.dssValidation ? 'Valid' : 'Flagged'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="w-4 h-4" />
          <span>{claim.applicantName}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{claim.village}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{claim.submissionDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4" />
          <span>{claim.evidence.length} files</span>
        </div>
      </div>

      {claim.dssSuggestion && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>DSS:</strong> {claim.dssSuggestion}
          </p>
        </div>
      )}

      {claim.reason && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Reason:</strong> {claim.reason}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {claim.reviewedBy && (
            <span>Reviewed by {claim.reviewedBy}</span>
          )}
          {claim.reviewedAt && (
            <span className="ml-2">on {claim.reviewedAt.toLocaleDateString()}</span>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onReview(claim)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          <span>{t('review_claim')}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ClaimCard;
