import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, FileText, MapPin, Calendar, User } from 'lucide-react';
import { Claim, DSSValidation } from '../../types';
import { sdlcAPI } from '../../utils/api';
import DSSValidationCard from './DSSValidationCard';

interface ClaimReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim | null;
  onReview: (claimId: string, action: 'approve' | 'reject', reason: string) => void;
}

const ClaimReviewModal: React.FC<ClaimReviewModalProps> = ({
  isOpen,
  onClose,
  claim,
  onReview
}) => {
  const { t } = useTranslation();
  const [dssValidation, setDssValidation] = useState<DSSValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (claim && isOpen) {
      loadDSSValidation();
    }
  }, [claim, isOpen]);

  const loadDSSValidation = async () => {
    if (!claim) return;
    
    setLoading(true);
    try {
      const validation = await sdlcAPI.getDSSValidation(claim.id);
      setDssValidation(validation);
    } catch (error) {
      console.error('Failed to load DSS validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'approve' | 'reject') => {
    setPendingAction(action);
    setShowReasonInput(true);
  };

  const handleSubmit = () => {
    if (!claim || !reason.trim()) return;
    
    onReview(claim.id, pendingAction!, reason);
    setShowReasonInput(false);
    setReason('');
    setPendingAction(null);
    onClose();
  };

  const handleCancel = () => {
    setShowReasonInput(false);
    setReason('');
    setPendingAction(null);
  };

  if (!claim) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t('claim_details')}</h2>
                  <p className="text-emerald-100">Claim ID: {claim.id}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Claim Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Applicant Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {claim.applicantName}</div>
                      <div><span className="font-medium">Village:</span> {claim.village}</div>
                      <div><span className="font-medium">Claim Type:</span> {claim.claimType}</div>
                      <div><span className="font-medium">Area:</span> {claim.area} hectares</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Location Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Coordinates:</span> {claim.coordinates[0]}, {claim.coordinates[1]}</div>
                      <div><span className="font-medium">QR Code:</span> {claim.qrCode}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Submission Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Submitted:</span> {claim.submissionDate.toLocaleDateString()}</div>
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Supporting Evidence
                    </h3>
                    <div className="space-y-2">
                      {claim.evidence.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                          <span className="text-sm">{file}</span>
                          <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                            {t('view_evidence')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* DSS Validation */}
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : dssValidation ? (
                <DSSValidationCard validation={dssValidation} />
              ) : null}

              {/* Action Buttons */}
              {!showReasonInput ? (
                <div className="flex justify-center space-x-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction('approve')}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('approve_claim')}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction('reject')}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>{t('reject_claim')}</span>
                  </motion.button>
                </div>
              ) : (
                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                    {t('mandatory_reason')}
                  </h3>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('enter_reason')}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!reason.trim()}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pendingAction === 'approve' ? t('approve_claim') : t('reject_claim')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClaimReviewModal;
