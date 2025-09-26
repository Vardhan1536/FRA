import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Shield,
  Eye,
  Download,
  Clock,
  Building
} from 'lucide-react';
import { Claim, ClaimEscalation } from '../../types';
import { dlcAPI } from '../../utils/api';

interface DLCClaimReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim | null;
  onReview: (claimId: string, action: 'approve' | 'reject', reason: string) => void;
}

const DLCClaimReviewModal: React.FC<DLCClaimReviewModalProps> = ({
  isOpen,
  onClose,
  claim,
  onReview
}) => {
  const { t } = useTranslation();
  const [escalationData, setEscalationData] = useState<ClaimEscalation | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (claim && isOpen) {
      loadEscalationData();
    }
  }, [claim, isOpen]);

  const loadEscalationData = async () => {
    if (!claim) return;
    
    setLoading(true);
    try {
      const escalation = await dlcAPI.getClaimEscalationDetails(claim.id);
      setEscalationData(escalation);
    } catch (error) {
      console.error('Failed to load escalation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!claim || !selectedAction || !reviewReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReview(claim.id, selectedAction, reviewReason);
      handleClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReviewReason('');
    setSelectedAction(null);
    setEscalationData(null);
    onClose();
  };

  const getDSSConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  const getDSSConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (!isOpen || !claim) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Final Claim Decision
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                DLC Authority - Final Approval/Rejection
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Claim Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Claim Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Claim ID:</span>
                    <span className="text-gray-900 dark:text-white">{claim.id}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-600 dark:text-gray-400">Applicant:</span>
                    <span className="text-gray-900 dark:text-white">{claim.applicantName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-600 dark:text-gray-400">Village:</span>
                    <span className="text-gray-900 dark:text-white">{claim.village}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-600 dark:text-gray-400">Submission:</span>
                    <span className="text-gray-900 dark:text-white">{claim.submissionDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="text-gray-900 dark:text-white">{claim.claimType}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Area:</span>
                    <span className="text-gray-900 dark:text-white">{claim.area} hectares</span>
                  </div>
                </div>
              </div>

              {/* SDLC Escalation Details */}
              {escalationData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    SDLC Escalation Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Escalated By:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{escalationData.escalatedBy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Escalation Date:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{escalationData.escalatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SDLC Decision:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        escalationData.sdlcDecision === 'Approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {escalationData.sdlcDecision}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Escalation Reason:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{escalationData.reason}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SDLC Reason:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{escalationData.sdlcReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DSS Validation */}
              {escalationData?.dssValidation && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    DSS Validation Results
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Validation Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        escalationData.dssValidation.isValid 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {escalationData.dssValidation.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Level:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDSSConfidenceColor(escalationData.dssValidation.confidence)}`}>
                        {escalationData.dssValidation.confidence}% - {getDSSConfidenceText(escalationData.dssValidation.confidence)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recommended Action:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        escalationData.dssValidation.recommendedAction === 'approve'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : escalationData.dssValidation.recommendedAction === 'reject'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}>
                        {escalationData.dssValidation.recommendedAction.charAt(0).toUpperCase() + escalationData.dssValidation.recommendedAction.slice(1)}
                      </span>
                    </div>
                    
                    {escalationData.dssValidation.suggestions.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">DSS Suggestions:</span>
                        <ul className="mt-1 space-y-1">
                          {escalationData.dssValidation.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {escalationData.dssValidation.riskFactors.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Factors:</span>
                        <ul className="mt-1 space-y-1">
                          {escalationData.dssValidation.riskFactors.map((risk, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                              <AlertTriangle className="w-3 h-3 text-red-500 mt-1 mr-2 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Supporting Documents */}
              {escalationData?.supportingDocuments && escalationData.supportingDocuments.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    Supporting Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {escalationData.supportingDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded border">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{doc}</span>
                        <button className="ml-auto text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DLC Decision */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  DLC Final Decision
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Decision *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="decision"
                          value="approve"
                          checked={selectedAction === 'approve'}
                          onChange={(e) => setSelectedAction(e.target.value as 'approve')}
                          className="mr-2"
                        />
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="decision"
                          value="reject"
                          checked={selectedAction === 'reject'}
                          onChange={(e) => setSelectedAction(e.target.value as 'reject')}
                          className="mr-2"
                        />
                        <span className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Decision Reason *
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder="Provide detailed reason for your decision..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Final Authority Notice
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          As DLC, your decision is final and cannot be overridden by other levels. 
                          This will be the official approval/rejection for this claim.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!selectedAction || !reviewReason.trim() || isSubmitting}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    selectedAction === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : selectedAction === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : selectedAction === 'approve' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting 
                      ? 'Processing...' 
                      : selectedAction === 'approve' 
                        ? 'Final Approve' 
                        : selectedAction === 'reject' 
                          ? 'Final Reject' 
                          : 'Select Decision'
                    }
                  </span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DLCClaimReviewModal;
