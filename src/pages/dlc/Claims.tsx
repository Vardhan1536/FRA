import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Download,
  Eye,
  File,
  Building,
  Map,
  Shield,
  Check,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  FileText,
  X,
  Zap,
  Database
} from 'lucide-react';
import { Claim } from '../../types';
import { dlcAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const DLCClaims: React.FC = () => {
  const { t } = useTranslation();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDigitalizeModal, setShowDigitalizeModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [digitalizedData, setDigitalizedData] = useState<any>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async (currentRetryCount = 0) => {
    setLoading(true);
    setRetryCount(currentRetryCount);
    setIsRetrying(currentRetryCount > 0);
    setIsFromCache(false);
    
    try {
      console.log(`Loading DLC claims (attempt ${currentRetryCount + 1})`);
      
      // Fetch from API
      const claimsData = await dlcAPI.getEscalatedClaims();
      setClaims(claimsData);
      console.log('Loaded DLC claims from API:', claimsData.length);
      setLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
      setIsFromCache(false);
    } catch (error) {
      console.error(`Failed to load DLC claims (attempt ${currentRetryCount + 1}):`, error);
      
      // Check if we have cached data first
      const cachedData = localStorage.getItem('beneficiaries_DLC');
      
      if (cachedData && currentRetryCount === 0) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} DLC claims from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            setClaims(parsed.data);
            setLoading(false);
            setIsRetrying(false);
            setRetryCount(0);
            setIsFromCache(true);
            return;
          }
        } catch (cacheError) {
          console.error('Error parsing DLC cached data:', cacheError);
        }
      }
      
      // Retry logic - wait and retry up to 5 times with longer intervals
      if (currentRetryCount < 5) {
        const retryDelay = Math.min(10000 + (currentRetryCount * 5000), 30000); // 10s, 15s, 20s, 25s, 30s
        console.log(`Retrying in ${retryDelay / 1000} seconds... (attempt ${currentRetryCount + 1}/5)`);
        setTimeout(() => {
          loadClaims(currentRetryCount + 1);
        }, retryDelay);
      } else {
        console.error('Max retry attempts reached. Please check if the API server is running.');
        setLoading(false);
        setIsRetrying(false);
        setClaims([]);
      }
    }
  };

  const handleFinalDecision = async (claimId: string, decision: 'approve' | 'reject', remarks: string) => {
    try {
      console.log(`Making final decision for claim ${claimId}: ${decision} with remarks: ${remarks}`);
      // TODO: Implement final decision logic
      alert(`Final decision made for claim: ${claimId} - ${decision}`);
      // Reload claims after decision
      loadClaims(0);
    } catch (error) {
      console.error('Error making final decision:', error);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      console.log(`Approving claim ${claimId} with notes: ${approvalNotes}`);
      
      // Update the claim status
      const updatedClaims = claims.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            status: 'Approved',
            statuses: {
              ...claim.statuses,
              dlc: {
                review: true,
                remarks: [...(claim.statuses.dlc?.remarks || []), `Approved by DLC: ${approvalNotes}`]
              }
            }
          };
        }
        return claim;
      });
      
      setClaims(updatedClaims);
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedClaim(null);
      
      alert('Claim approved successfully!');
    } catch (error) {
      console.error('Error approving claim:', error);
      alert('Error approving claim. Please try again.');
    }
  };

  const handleDigitalizeClaim = async (claimId: string) => {
    try {
      console.log(`Digitalizing claim ${claimId}`);
      
      // Simulate digitalization process
      const mockDigitalizedData = {
        claimId: claimId,
        digitalizedAt: new Date(),
        extractedData: {
          beneficiaryName: selectedClaim?.applicantName || 'Unknown',
          aadhaarNumber: selectedClaim?.personal_info?.aadhaar || 'Unknown',
          village: selectedClaim?.admin_info?.village || 'Unknown',
          claimArea: selectedClaim?.title_info?.claim_area_hectares || 0,
          rightType: selectedClaim?.title_info?.right_type || 'Unknown',
          coordinates: selectedClaim?.coordinates || [0, 0],
          forestArea: selectedClaim?.admin_info?.forest_area_hectares || 0,
          tribalCommunity: selectedClaim?.personal_info?.tribal_community || 'Unknown',
          income: selectedClaim?.personal_info?.income || 0
        },
        metadata: {
          sourceDocuments: selectedClaim?.evidence || [],
          verificationStatus: 'Verified',
          digitalizationMethod: 'AI-Enhanced OCR',
          confidenceScore: 95.5,
          processingTime: '2.3 seconds'
        },
        blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        digitalSignature: `DIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      setDigitalizedData(mockDigitalizedData);
      setShowDigitalizeModal(true);
      
      // Update claim status
      const updatedClaims = claims.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            status: 'Digitalized',
            statuses: {
              ...claim.statuses,
              dlc: {
                review: true,
                remarks: [...(claim.statuses.dlc?.remarks || []), `Digitalized and approved by DLC`]
              }
            },
            digitalizedData: mockDigitalizedData
          };
        }
        return claim;
      });
      
      setClaims(updatedClaims);
      
    } catch (error) {
      console.error('Error digitalizing claim:', error);
      alert('Error digitalizing claim. Please try again.');
    }
  };

  const handleExportClaims = async () => {
    try {
      console.log('Exporting DLC claims to CSV');
      const blob = await dlcAPI.exportDLCCaimsToCSV(claims);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dlc-claims-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting claims:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300`;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              DLC Final Review
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Final review and decision on escalated forest rights claims
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {isFromCache && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                📦 Loaded from cache
              </div>
            )}
            {isRetrying && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                Retrying... (Attempt {retryCount + 1}/5)
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={handleExportClaims}
              disabled={loading || claims.length === 0}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Export CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => loadClaims(0)}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>{loading ? (isRetrying ? 'Retrying...' : 'Loading...') : 'Refresh'}</span>
            </motion.button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by applicant name, village, or claim ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 space-y-4">
            <LoadingSpinner size="lg" />
            {isRetrying && (
              <div className="text-center">
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  API server not responding. Retrying...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Attempt {retryCount + 1} of 5
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClaims.map((claim) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {claim.applicantName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {claim.village} • {claim.claimType}
                      </p>
                    </div>
                    <span className={getStatusBadge(claim.status)}>
                      {claim.status}
                    </span>
                  </div>

                  {/* Personal Information */}
                  {claim.personal_info && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Personal Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>Gender: {claim.personal_info.gender}</div>
                        <div>Community: {claim.personal_info.tribal_community}</div>
                        <div>Income: ₹{claim.personal_info.income.toLocaleString()}</div>
                        <div>Aadhaar: {claim.personal_info.aadhaar}</div>
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  {claim.statuses && (
                    <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Status Details</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>GramaSabha:</span>
                          <span className={`font-medium ${
                            claim.statuses.gramasabha === 'Approved' ? 'text-green-600' : 
                            claim.statuses.gramasabha === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {claim.statuses.gramasabha}
                          </span>
                        </div>
                        {claim.statuses.sdlc && (
                          <div className="flex justify-between">
                            <span>SDLC Review:</span>
                            <span className={`font-medium ${claim.statuses.sdlc.review ? 'text-green-600' : 'text-yellow-600'}`}>
                              {claim.statuses.sdlc.review ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        )}
                        {claim.statuses.dlc && (
                          <div className="flex justify-between">
                            <span>DLC Decision:</span>
                            <span className="font-medium text-blue-600">Final Decision Made</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SDLC Remarks */}
                  {claim.statuses?.sdlc?.remarks && claim.statuses.sdlc.remarks.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">SDLC Remarks</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        {claim.statuses.sdlc.remarks.slice(0, 2).map((remark, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span className="flex-1">{remark}</span>
                          </div>
                        ))}
                        {claim.statuses.sdlc.remarks.length > 2 && (
                          <div className="text-amber-600 dark:text-amber-400 text-xs">
                            +{claim.statuses.sdlc.remarks.length - 2} more remarks
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Administrative Information */}
                  {claim.admin_info && (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-2">
                        <Map className="w-4 h-4 text-gray-400" />
                        <span>Area: {claim.area} hectares</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>GP: {claim.admin_info.gp} ({claim.admin_info.gp_id})</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedClaim(claim)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFinalDecision(claim.id, 'approve', '')}
                      className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Final Decision</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClaims.length === 0 && (
          <div className="text-center py-12">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No claims found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No claims are available for DLC final review at the moment.'
              }
            </p>
          </div>
        )}

        {/* Claim Detail Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Claim Details
                  </h2>
                  <button
                    onClick={() => setSelectedClaim(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Claim Details Content */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  {selectedClaim.personal_info && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                          Personal Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</h4>
                          <p className="text-gray-900 dark:text-white">
                            {selectedClaim.personal_info.first_name} {selectedClaim.personal_info.last_name}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</h4>
                          <p className="text-gray-900 dark:text-white">{selectedClaim.personal_info.gender}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tribal Community</h4>
                          <p className="text-gray-900 dark:text-white">{selectedClaim.personal_info.tribal_community}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Number</h4>
                          <p className="text-gray-900 dark:text-white">{selectedClaim.personal_info.aadhaar}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Income</h4>
                          <p className="text-gray-900 dark:text-white">₹{selectedClaim.personal_info.income.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Details */}
                  {selectedClaim.statuses && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                          Status Details
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GramaSabha</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              selectedClaim.statuses.gramasabha === 'Approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : selectedClaim.statuses.gramasabha === 'Rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            }`}>
                              {selectedClaim.statuses.gramasabha}
                            </span>
                          </div>
                          {selectedClaim.statuses.sdlc && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SDLC Review</h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                selectedClaim.statuses.sdlc.review
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                              }`}>
                                {selectedClaim.statuses.sdlc.review ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          )}
                          {selectedClaim.statuses.dlc && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DLC Decision</h4>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                Final Decision Made
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* SDLC Remarks */}
                        {selectedClaim.statuses.sdlc?.remarks && selectedClaim.statuses.sdlc.remarks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDLC Remarks</h4>
                            <div className="space-y-2">
                              {selectedClaim.statuses.sdlc.remarks.map((remark, index) => (
                                <div key={index} className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{remark}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowApprovalModal(true)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      <span>Approve</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDigitalizeClaim(selectedClaim.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Zap className="w-5 h-5" />
                      <span>Digitalize</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedClaim(null)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <span>Close</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Approve Claim
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Approval Notes
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add approval notes..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedClaim && handleApproveClaim(selectedClaim.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Approve Claim
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Digitalization Modal */}
        {showDigitalizeModal && digitalizedData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Digitalized Claim Data
                </h3>
                <button
                  onClick={() => {
                    setShowDigitalizeModal(false);
                    setDigitalizedData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Digitalization Status */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-lg font-semibold text-green-800 dark:text-green-300">Digitalization Complete</span>
                  </div>
                  <p className="text-green-700 dark:text-green-400">
                    Claim has been successfully digitalized and approved by DLC
                  </p>
                </div>

                {/* Extracted Data */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Extracted Data</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Beneficiary Name:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.beneficiaryName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aadhaar Number:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.aadhaarNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Village:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.village}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Claim Area:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.claimArea} hectares</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Right Type:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.rightType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tribal Community:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.extractedData.tribalCommunity}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300">Digitalization Metadata</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Method:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.metadata.digitalizationMethod}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Score:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.metadata.confidenceScore}%</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Time:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.metadata.processingTime}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification Status:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.metadata.verificationStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Blockchain Information */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Blockchain & Security</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Blockchain Hash:</span>
                      <p className="text-gray-900 dark:text-white font-mono text-xs break-all">{digitalizedData.blockchainHash}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Digital Signature:</span>
                      <p className="text-gray-900 dark:text-white font-mono text-xs">{digitalizedData.digitalSignature}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Digitalized At:</span>
                      <p className="text-gray-900 dark:text-white">{digitalizedData.digitalizedAt.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowDigitalizeModal(false);
                      setDigitalizedData(null);
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DLCClaims;
