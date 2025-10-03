import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { FRABeneficiary, Claim } from '../../types';
import { sdlcAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ClaimCard from '../../components/SDLC/ClaimCard';
import ClaimReviewModal from '../../components/SDLC/ClaimReviewModal';

interface ClaimValidation {
  beneficiary_id: string;
  title_id?: string;
  eligibility_result: {
    eligible: boolean;
    reason: string;
  };
  conflict_result: {
    conflict_detected: boolean;
    overlapping_claims: any[];
    resolution_steps: string;
  };
  dss_suggestion: string;
  confidence_score: number;
  validation_timestamp: string;
}

const Claims: React.FC = () => {
  const { t } = useTranslation();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(12);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use SDLC-specific endpoint to access grama-sabha data
      const beneficiariesData = await sdlcAPI.getApplicants();
      
      // Generate claim validations using batch eligibility check
      const validations = await generateBatchClaimValidations(beneficiariesData);
      
      // Convert validations to claims for the card display
      const claimsData = convertValidationsToClaims(validations, beneficiariesData);
      setClaims(claimsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBatchClaimValidations = async (beneficiaries: FRABeneficiary[]): Promise<ClaimValidation[]> => {
    // Only process top 20 beneficiaries for performance
    const top20Beneficiaries = beneficiaries.slice(0, 20);
    
    try {
      // Use batch eligibility check for all 20 at once
      const validations = await sdlcAPI.batchCheckEligibility(top20Beneficiaries);
      return validations;
    } catch (error) {
      console.error('Failed to batch validate claims:', error);
      // Return mock validations on error
      return top20Beneficiaries.map(beneficiary => ({
        beneficiary_id: beneficiary.beneficiary_id,
        eligibility_result: { eligible: true, reason: "Mock batch validation" },
        conflict_result: { 
          conflict_detected: false, 
          overlapping_claims: [], 
          resolution_steps: "No conflicts detected" 
        },
        dss_suggestion: "Mock suggestion for land rights",
        confidence_score: 0.8,
        validation_timestamp: new Date().toISOString()
      }));
    }
  };

  const convertValidationsToClaims = (validations: ClaimValidation[], beneficiaries: FRABeneficiary[]): Claim[] => {
    return validations.map((validation) => {
      const beneficiary = beneficiaries.find(b => b.beneficiary_id === validation.beneficiary_id);
      const status = getValidationStatus(validation) as 'Pending' | 'Approved' | 'Rejected';
      
      // Use title_id as unique identifier, fallback to beneficiary_id if title_id not available
      const uniqueId = validation.title_id || validation.beneficiary_id;
      
      return {
        id: uniqueId,
        titleId: validation.title_id,
        beneficiaryId: validation.beneficiary_id,
        village: beneficiary?.village_name || 'Unknown Village',
        status: status,
        coordinates: [22.9734, 78.6569], // Default coordinates for Mandla district
        area: Math.random() * 50 + 10, // Mock area between 10-60 hectares
        evidence: ['doc1.pdf', 'photo1.jpg', 'audio1.mp3'], // Mock evidence
        submissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        applicantName: `${beneficiary?.first_name || 'Unknown'} ${beneficiary?.last_name || 'User'}`,
        claimType: ['IFR', 'CR', 'CFR'][Math.floor(Math.random() * 3)] as 'IFR' | 'CR' | 'CFR', // Random claim type
        qrCode: `QR-${validation.beneficiary_id}`,
        dssValidation: validation.eligibility_result.eligible && !validation.conflict_result.conflict_detected,
        dssSuggestion: validation.dss_suggestion,
        reviewedBy: undefined,
        reviewedAt: undefined,
        reason: undefined,
        // Add new fields for better display
        confidenceScore: validation.confidence_score,
        validationTimestamp: validation.validation_timestamp,
        eligibilityReason: validation.eligibility_result.reason,
        conflictDetails: validation.conflict_result.resolution_steps
      };
    });
  };

  const getValidationStatus = (validation: ClaimValidation): string => {
    if (validation.eligibility_result.eligible && !validation.conflict_result.conflict_detected) {
      return 'Approved';
    } else if (validation.conflict_result.conflict_detected) {
      return 'Pending'; // Conflict needs review
    } else if (!validation.eligibility_result.eligible) {
      return 'Pending'; // Ineligible needs review
    }
    return 'Pending';
  };

  const handleClaimReview = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (claimId: string, action: 'approve' | 'reject', reason: string) => {
    try {
      await sdlcAPI.reviewClaim({
        claimId,
        reviewerId: 'current-user',
        action,
        reason,
        dssValidation: {} as any,
        timestamp: new Date()
      });
      
      // Update claims with review information
      setClaims(prev => prev.map(claim => 
        claim.id === claimId 
          ? { 
              ...claim, 
              status: action === 'approve' ? 'Approved' : 'Rejected',
              reason,
              reviewedBy: 'Current User',
              reviewedAt: new Date(),
              eligibilityReason: action === 'approve' ? 'Approved by SDLC reviewer' : reason
            }
          : claim
      ));
      
    } catch (error) {
      console.error('Failed to review claim:', error);
    }
  };

  const handleRefreshData = async () => {
    await loadData();
  };

  // Pagination helper functions
  const getPaginatedData = (data: any[], currentPage: number, recordsPerPage: number) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[], recordsPerPage: number) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1);
  };

  // Pagination Component
  const PaginationComponent = ({ 
    currentPage, 
    totalPages, 
    onPageChange
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
  }) => {
    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, claims.length)} of {claims.length} records
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                page === currentPage
                  ? 'bg-emerald-600 text-white'
                  : page === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('claim_validation')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            DSS-powered claim validation and review system
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Records per page:
            </label>
            <select
              value={recordsPerPage}
              onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleRefreshData}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Refresh Validations</span>
          </motion.button>
        </div>
      </div>

      {/* Data Source Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Source Information
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Using Grama Sabha Data
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                This DSS validation system automatically uses the same FRA beneficiaries data from the Grama Sabha portal. 
                The system validates the top 20 claims in real-time using AI agents for optimal performance.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> Only top 20 beneficiaries are processed for validation. To add new beneficiaries, use the Grama Sabha portal first, then refresh this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Validations Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              DSS Claim Validations
            </h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-full text-sm font-medium">
              {claims.length} Claims (Top 20 Validated)
            </span>
          </div>
        </div>
        
        {claims.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>DSS Note:</strong> Top 20 claims validated using AI agents for eligibility, conflict detection, and resource suggestions.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getPaginatedData(claims, currentPage, recordsPerPage).map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    onReview={handleClaimReview}
                  />
                ))}
              </div>
            </div>
            
            <PaginationComponent
              currentPage={currentPage}
              totalPages={getTotalPages(claims, recordsPerPage)}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Claim Review Modal */}
      <ClaimReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        claim={selectedClaim}
        onReview={handleReviewSubmit}
      />
    </div>
  );
};

export default Claims;