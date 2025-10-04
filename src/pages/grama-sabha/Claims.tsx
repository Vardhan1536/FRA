import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Plus,
  FileText,
  Upload,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Download,
  Eye,
  File,
  Building,
  Map,
  Shield,
  Check,
  AlertCircle
} from 'lucide-react';
import { Claim, NewClaimSubmission } from '../../types';
import { claimsAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useApp } from '../../contexts/AppContext';

const Claims: React.FC = () => {
  const { t } = useTranslation();
  const { updateStats } = useApp();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<NewClaimSubmission>>({
    personal_info: {
      first_name: '',
      last_name: '',
      gender: '',
      tribal_community: '',
      aadhaar: '',
      income: 0
    },
    title_info: {
      right_type: '',
      status: 'Under_Review',
      claim_area_hectares: 0,
      polygon_coordinates: []
    },
    admin_info: {
      village_id: 'VIL_000001',
      village: 'चिरमिरी',
      gp: 'GP_फतेहपुर',
      block: 'Mandla',
      district: 'Mandla',
      state: 'Madhya Pradesh',
      forest_area_hectares: 0,
      block_id: 'BLK_000001',
      gp_id: 'GP_000001'
    },
    asset_summary: {
      total_area_hectares: 0,
      asset_types: [],
      assets_count: 0
    },
    vulnerability: {
      score: 0,
      category: null
    },
    statuses: {
      gramasabha: 'Pending',
      sdlc: {
        review: false,
        remarks: []
      },
      dlc: null
    }
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Village options
  const villageOptions = [
    { id: 'VIL_000001', name: 'चिरमिरी' },
    { id: 'VIL_000002', name: 'पाकाला' },
    { id: 'VIL_000003', name: 'चंबा' }
  ];

  useEffect(() => {
    loadClaims();
    loadPendingClaims();
  }, []);

  // Function to update dashboard stats
  const updateDashboardStats = () => {
    const totalClaims = claims.length + pendingClaims.length;
    const approvedClaims = claims.filter(claim => claim.status === 'Approved').length;
    const rejectedClaims = claims.filter(claim => claim.status === 'Rejected').length;
    const pendingClaimsCount = pendingClaims.length;
    
    updateStats({
      totalClaims,
      approvedPattas: approvedClaims,
      rejectedClaims,
      pendingClaims: pendingClaimsCount
    });
  };

  // Update dashboard stats whenever claims or pendingClaims change
  useEffect(() => {
    updateDashboardStats();
  }, [claims, pendingClaims]);

  const loadClaims = async (currentRetryCount = 0) => {
    setLoading(true);
    setRetryCount(currentRetryCount);
    setIsRetrying(currentRetryCount > 0);
    setIsFromCache(false);
    
    try {
      // Get user role from localStorage or context
      const userRole = localStorage.getItem('userRole') || 'GramaSabha';
      console.log(`Loading claims for role: ${userRole} (attempt ${currentRetryCount + 1})`);
      
      // Fetch from API only
      const claimsData = await claimsAPI.getBeneficiaries(userRole);
      setClaims(claimsData);
      console.log('Loaded claims from API:', claimsData.length);
      setLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
      setIsFromCache(false);
    } catch (error) {
      console.error(`Failed to load claims from API (attempt ${currentRetryCount + 1}):`, error);
      
      // Check if we have cached data first
      const userRole = localStorage.getItem('userRole') || 'GramaSabha';
      const cachedData = localStorage.getItem(`beneficiaries_${userRole}`);
      
      if (cachedData && currentRetryCount === 0) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} claims from cache for role: ${userRole} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            setClaims(parsed.data);
            setLoading(false);
            setIsRetrying(false);
            setRetryCount(0);
            setIsFromCache(true);
            return;
          }
        } catch (cacheError) {
          console.error('Error parsing cached data:', cacheError);
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

  const loadPendingClaims = async () => {
    try {
      // Load pending claims from localStorage or API
      const stored = localStorage.getItem('pendingClaims');
      if (stored) {
        const pendingData = JSON.parse(stored);
        
        // Validate that all claims have required fields
        const validClaims = pendingData.filter((claim: any) => 
          claim && claim.id && claim.claimType && claim.applicantName
        );
        
        if (validClaims.length !== pendingData.length) {
          console.warn(`Filtered out ${pendingData.length - validClaims.length} invalid claims from localStorage`);
          // Update localStorage with only valid claims
          localStorage.setItem('pendingClaims', JSON.stringify(validClaims));
        }
        
        setPendingClaims(validClaims);
        console.log('Loaded pending claims from localStorage:', validClaims.length);
      } else {
        // If no pending claims in localStorage, create some sample data for demonstration
        const samplePendingClaims: Claim[] = [
          {
            id: 'PENDING_001',
            applicantName: 'राम सिंह',
            claimType: 'IFR',
            status: 'Pending',
            submissionDate: new Date(),
            village: 'चिरमिरी',
            coordinates: [80.27602945502146, 22.220035169973066],
            area: 1.5,
            personal_info: {
              first_name: 'राम',
              last_name: 'सिंह',
              gender: 'Male',
              tribal_community: 'Gond',
              aadhaar: '1234-5678-9012',
              income: 45000
            },
            admin_info: {
              village_id: 'VIL_000001',
              village: 'चिरमिरी',
              gp: 'GP_फतेहपुर',
              block: 'Mandla',
              district: 'Mandla',
              state: 'Madhya Pradesh',
              forest_area_hectares: 2.5,
              block_id: 'BLK_000001',
              gp_id: 'GP_000001'
            },
            title_info: {
              right_type: 'IFR',
              status: 'Under_Review',
              claim_area_hectares: 1.5,
              polygon_coordinates: [[[80.27602945502146, 22.220035169973066], [80.27605892706691, 22.22059078045775], [80.273777701138, 22.220758461552585], [80.27414972299651, 22.22005157078757], [80.27602945502146, 22.220035169973066]]]
            },
            asset_summary: {
              total_area_hectares: 1.5,
              asset_types: ['Forest_Patch', 'Water_Body'],
              assets_count: 2
            },
            vulnerability: {
              score: 25.5,
              category: 'Low Risk'
            },
            statuses: {
              gramasabha: 'Pending',
              sdlc: {
                review: false,
                remarks: []
              },
              dlc: null
            },
            uploadedFiles: [],
            evidence: ['land_deed.pdf', 'identity_proof.pdf']
          },
          {
            id: 'PENDING_002',
            applicantName: 'सीता देवी',
            claimType: 'CFR',
            status: 'Pending',
            submissionDate: new Date(),
            village: 'पाकाला',
            coordinates: [80.54635212060894, 22.79320098273347],
            area: 2.0,
            personal_info: {
              first_name: 'सीता',
              last_name: 'देवी',
              gender: 'Female',
              tribal_community: 'Baiga',
              aadhaar: '2345-6789-0123',
              income: 38000
            },
            admin_info: {
              village_id: 'VIL_000002',
              village: 'पाकाला',
              gp: 'GP_फतेहपुर',
              block: 'Mandla',
              district: 'Mandla',
              state: 'Madhya Pradesh',
              forest_area_hectares: 3.2,
              block_id: 'BLK_000001',
              gp_id: 'GP_000001'
            },
            title_info: {
              right_type: 'CFR',
              status: 'Under_Review',
              claim_area_hectares: 2.0,
              polygon_coordinates: [[[80.54635212060894, 22.79320098273347], [80.54602495210914, 22.793732930673524], [80.54504098599959, 22.793350670018256], [80.54396184629934, 22.793092738078585], [80.54635212060894, 22.79320098273347]]]
            },
            asset_summary: {
              total_area_hectares: 2.0,
              asset_types: ['Community_Forest', 'Traditional_Medicinal_Plants'],
              assets_count: 3
            },
            vulnerability: {
              score: 35.0,
              category: 'Medium Risk'
            },
            statuses: {
              gramasabha: 'Pending',
              sdlc: {
                review: false,
                remarks: []
              },
              dlc: null
            },
            uploadedFiles: [],
            evidence: ['community_consent.pdf', 'village_map.pdf']
          }
        ];
        
        setPendingClaims(samplePendingClaims);
        localStorage.setItem('pendingClaims', JSON.stringify(samplePendingClaims));
        console.log('Created sample pending claims:', samplePendingClaims.length);
      }
    } catch (error) {
      console.error('Failed to load pending claims:', error);
      setPendingClaims([]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.personal_info?.first_name || !formData.personal_info?.last_name) {
        alert('Please fill in all required personal information fields');
        return;
      }
      
      if (!formData.title_info?.right_type || !formData.title_info?.claim_area_hectares) {
        alert('Please fill in all required title information fields');
        return;
      }
      
      if (!formData.admin_info?.village || !formData.admin_info?.gp) {
        alert('Please fill in all required administrative information fields');
        return;
      }
      
      if (!formData.asset_summary?.total_area_hectares || !formData.asset_summary?.asset_types?.length) {
        alert('Please fill in all required asset summary fields');
        return;
      }

      // Ensure polygon coordinates are properly formatted
      if (formData.title_info?.polygon_coordinates && formData.title_info.polygon_coordinates.length > 0) {
        // Validate that coordinates are in the correct format
        const coords = formData.title_info.polygon_coordinates[0];
        if (!Array.isArray(coords) || coords.length < 3) {
          alert('GPS coordinates must be a valid polygon with at least 3 points');
          return;
        }
        // Check that each coordinate is a valid [lng, lat] pair
        for (const coord of coords) {
          if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            alert('GPS coordinates must be valid [longitude, latitude] pairs');
            return;
          }
        }
      }

      // Debug: Check form data before submission
      console.log('Form data before submission:', formData);
      console.log('Personal info:', formData.personal_info);
      console.log('Title info:', formData.title_info);
      console.log('Admin info:', formData.admin_info);

      // Create the submission data
      const submissionData: NewClaimSubmission = {
        beneficiary_id: '', // Will be generated by API
        title_id: '', // Will be generated by API
        personal_info: formData.personal_info!,
        title_info: formData.title_info!,
        admin_info: formData.admin_info!,
        asset_summary: formData.asset_summary!,
        vulnerability: formData.vulnerability!,
        statuses: formData.statuses!
      };
      
      console.log('Submission data created:', submissionData);

      // Submit the claim
      const newClaim = await claimsAPI.submitNewClaim(submissionData);
      console.log('Claim submitted successfully:', newClaim);
      
      // Debug: Check each field individually
      console.log('Validation check:');
      console.log('- newClaim.id:', newClaim.id);
      console.log('- newClaim.claimType:', newClaim.claimType);
      console.log('- newClaim.applicantName:', newClaim.applicantName);
      console.log('- newClaim object keys:', Object.keys(newClaim));
      
      // Validate the claim object has all required fields
      if (!newClaim.id || !newClaim.claimType || !newClaim.applicantName) {
        console.error('Invalid claim object received:', newClaim);
        console.error('Missing fields:');
        console.error('- id missing:', !newClaim.id);
        console.error('- claimType missing:', !newClaim.claimType);
        console.error('- applicantName missing:', !newClaim.applicantName);
        alert('Error: Invalid claim data received. Please try again.');
        return;
      }
      
      // Add to pending claims
      const updatedPendingClaims = [...pendingClaims, newClaim];
      setPendingClaims(updatedPendingClaims);
      localStorage.setItem('pendingClaims', JSON.stringify(updatedPendingClaims));
      console.log('Added claim to pending claims:', newClaim);
      
      // Update dashboard stats after new claim submission
      updateDashboardStats();
      
      // Reset form
      setFormData({
        personal_info: {
          first_name: '',
          last_name: '',
          gender: '',
          tribal_community: '',
          aadhaar: '',
          income: 0
        },
        title_info: {
          right_type: '',
          status: 'Under_Review',
          claim_area_hectares: 0,
          polygon_coordinates: []
        },
        admin_info: {
          village_id: 'VIL_000001',
          village: 'चिरमिरी',
          gp: 'GP_फतेहपुर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 0,
          block_id: 'BLK_000001',
          gp_id: 'GP_000001'
        },
        asset_summary: {
          total_area_hectares: 0,
          asset_types: [],
          assets_count: 0
        },
        vulnerability: {
          score: 0,
          category: null
        },
        statuses: {
          gramasabha: 'Pending',
          sdlc: {
            review: false,
            remarks: []
          },
          dlc: null
        }
      });
      setUploadedFiles([]);
      setShowNewClaimForm(false);
      
      alert('Claim submitted successfully! It will appear in the pending claims section for approval.');
    } catch (error) {
      console.error('Error submitting claim:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error submitting claim. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      console.log(`Approving claim: ${claimId}`);
      
      // Find the claim to approve
      const claimToApprove = pendingClaims.find(claim => claim.id === claimId);
      if (!claimToApprove) {
        console.error('Claim not found in pending claims');
        alert('Claim not found. Please refresh the page and try again.');
        return;
      }
      
      // Update the claim status
      const approvedClaim = {
        ...claimToApprove,
        status: 'Approved' as const,
        statuses: {
          ...claimToApprove.statuses,
          gramasabha: 'Approved' as const
        }
      };
      
      console.log('Approved claim:', approvedClaim);
      
      // Remove from pending claims
      const updatedPendingClaims = pendingClaims.filter(claim => claim.id !== claimId);
      setPendingClaims(updatedPendingClaims);
      localStorage.setItem('pendingClaims', JSON.stringify(updatedPendingClaims));
      
      // Add to main claims list
      setClaims(prevClaims => [...prevClaims, approvedClaim]);
      
      // Update the main claims cache in localStorage
      const userRole = localStorage.getItem('userRole') || 'GramaSabha';
      const cachedData = localStorage.getItem(`beneficiaries_${userRole}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const updatedCacheData = {
            ...parsed,
            data: [...parsed.data, approvedClaim]
          };
          localStorage.setItem(`beneficiaries_${userRole}`, JSON.stringify(updatedCacheData));
        } catch (error) {
          console.error('Error updating main claims cache:', error);
        }
      }
      
      console.log('Claim approved and moved to main claims list');
      
      // Update dashboard stats after approval
      updateDashboardStats();
      
      alert('Claim approved successfully! It has been moved to the main claims list.');
    } catch (error) {
      console.error('Error approving claim:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error approving claim. Please try again.';
      alert(errorMessage);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const handleAssetTypeChange = (assetType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      asset_summary: {
        ...prev.asset_summary!,
        asset_types: checked 
          ? [...(prev.asset_summary?.asset_types || []), assetType]
          : (prev.asset_summary?.asset_types || []).filter(type => type !== assetType)
      }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const currentClaims = activeTab === 'all' ? claims : pendingClaims;
  
  // Debug logging
  console.log('Claims page render - activeTab:', activeTab);
  console.log('Claims page render - claims:', claims);
  console.log('Claims page render - pendingClaims:', pendingClaims);
  console.log('Claims page render - currentClaims:', currentClaims);
  console.log('Claims page render - currentClaims type:', typeof currentClaims);
  console.log('Claims page render - currentClaims length:', Array.isArray(currentClaims) ? currentClaims.length : 'Not an array');
  
  const filteredClaims = currentClaims.filter(claim => {
    const matchesSearch = claim.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  console.log('Claims page render - filteredClaims:', filteredClaims);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('claims')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track forest rights claims
          </p>
        </div>

        <div className="flex items-center space-x-3">
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
            onClick={() => loadClaims(0)}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>{loading ? (isRetrying ? 'Retrying...' : 'Loading...') : 'Refresh'}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowNewClaimForm(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t('submit_claim')}</span>
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Claims ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pending Approval ({pendingClaims.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by applicant name or claim ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
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
      ) : !Array.isArray(currentClaims) ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Data Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Claims data is not in the expected format. Please refresh the page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Debug: currentClaims type is {typeof currentClaims}
          </p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeTab === 'pending' ? 'No pending claims' : 'No claims found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'pending' 
              ? 'No claims are currently pending approval'
              : searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No claims to display at the moment'
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Total {activeTab === 'pending' ? 'pending' : 'all'} claims: {currentClaims.length}, Filtered: {filteredClaims.length}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClaims.map((claim, index) => {
            console.log(`Rendering claim ${index}:`, claim);
            console.log(`Claim ID:`, claim.id);
            console.log(`Claim type:`, typeof claim.id);
            
            // Safety check - ensure claim has required properties
            if (!claim || typeof claim !== 'object') {
              console.error(`Invalid claim at index ${index}:`, claim);
              return null;
            }
            
            return (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(claim.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {claim.claimType || 'Unknown Type'} - {claim.id ? claim.id.slice(-6) : 'No ID'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {claim.personal_info ? `${claim.personal_info.first_name || ''} ${claim.personal_info.last_name || ''}` : (claim.applicantName || 'Unknown Applicant')}
                    </p>
                  </div>
                </div>
                <span className={getStatusBadge(claim.status || 'Unknown')}>
                  {claim.status || 'Unknown'}
                </span>
              </div>

              {/* Personal Information */}
              {claim.personal_info && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                        <span>DLC:</span>
                        <span className="font-medium text-blue-600">Active</span>
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
                    <MapPin className="w-4 h-4" />
                    <span>{claim.admin_info.village}, {claim.admin_info.block}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>GP: {claim.admin_info.gp} ({claim.admin_info.gp_id})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Map className="w-4 h-4" />
                    <span>Forest Area: {claim.admin_info.forest_area_hectares ? claim.admin_info.forest_area_hectares.toFixed(2) : 'N/A'} ha</span>
                  </div>
                </div>
              )}

              {/* Title Information */}
              {claim.title_info && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">Title Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Right Type: {claim.title_info.right_type}</div>
                    <div>Area: {claim.title_info.claim_area_hectares} ha</div>
                  </div>
                </div>
              )}

              {/* Asset Summary */}
              {claim.asset_summary && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Assets</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>Total Area: {claim.asset_summary.total_area_hectares} ha</div>
                    <div>Assets: {claim.asset_summary.assets_count} ({claim.asset_summary.asset_types.join(', ')})</div>
                  </div>
                </div>
              )}

              {/* Vulnerability Assessment */}
              {claim.vulnerability && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Vulnerability</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>Score: {claim.vulnerability.score ? claim.vulnerability.score.toFixed(2) : 'N/A'}</div>
                    {claim.vulnerability.category && <div>Category: {claim.vulnerability.category}</div>}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(claim.submissionDate).toLocaleDateString()}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {claim.uploadedFiles?.length || claim.evidence.length} documents
                  </span>
                  <div className="flex items-center space-x-2">
                    {activeTab === 'pending' && claim.status === 'Pending' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveClaim(claim.id);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </motion.button>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}

      {/* New Claim Form Modal */}
      {showNewClaimForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('submit_claim')}
              </h2>
              <button
                onClick={() => setShowNewClaimForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Form Instructions */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Form Instructions
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Fill in all required fields marked with *</li>
                    <li>• Upload supporting documents (PDF, JPG, PNG, MP3, MP4)</li>
                    <li>• Ensure all personal and administrative information is accurate</li>
                    <li>• Select appropriate asset types based on your claim</li>
                    <li>• Vulnerability assessment is optional but recommended</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personal_info?.first_name || ''}
                      onChange={(e) => handleInputChange('personal_info', 'first_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personal_info?.last_name || ''}
                      onChange={(e) => handleInputChange('personal_info', 'last_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender *
                    </label>
                    <select 
                      required 
                      value={formData.personal_info?.gender || ''}
                      onChange={(e) => handleInputChange('personal_info', 'gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tribal Community *
                    </label>
                    <select 
                      required 
                      value={formData.personal_info?.tribal_community || ''}
                      onChange={(e) => handleInputChange('personal_info', 'tribal_community', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Tribal Community</option>
                      <option value="Baiga">Baiga</option>
                      <option value="Gond">Gond</option>
                      <option value="Kol">Kol</option>
                      <option value="Bhil">Bhil</option>
                      <option value="Sahariya">Sahariya</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
                      value={formData.personal_info?.aadhaar || ''}
                      onChange={(e) => handleInputChange('personal_info', 'aadhaar', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="1234-5678-9012"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Annual Income (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.personal_info?.income || ''}
                      onChange={(e) => handleInputChange('personal_info', 'income', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              {/* Administrative Information Section */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    Administrative Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Village *
                    </label>
                    <select 
                      required 
                      value={formData.admin_info?.village_id || ''}
                      onChange={(e) => {
                        const selectedVillage = villageOptions.find(v => v.id === e.target.value);
                        if (selectedVillage) {
                          handleInputChange('admin_info', 'village_id', selectedVillage.id);
                          handleInputChange('admin_info', 'village', selectedVillage.name);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Village</option>
                      {villageOptions.map((village) => (
                        <option key={village.id} value={village.id}>
                          {village.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gram Panchayat *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      value="GP_फतेहपुर"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default Gram Panchayat</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Block *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.admin_info?.block || ''}
                      onChange={(e) => handleInputChange('admin_info', 'block', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter block name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.admin_info?.district || ''}
                      onChange={(e) => handleInputChange('admin_info', 'district', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter district name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <select 
                      required 
                      value={formData.admin_info?.state || ''}
                      onChange={(e) => handleInputChange('admin_info', 'state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select State</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Forest Area (hectares) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.admin_info?.forest_area_hectares || ''}
                      onChange={(e) => handleInputChange('admin_info', 'forest_area_hectares', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="100.00"
                    />
                  </div>
                </div>
              </div>

              {/* Title Information Section */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                    Title Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Right Type *
                    </label>
                    <select 
                      required 
                      value={formData.title_info?.right_type || ''}
                      onChange={(e) => handleInputChange('title_info', 'right_type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Right Type</option>
                      <option value="IFR">Individual Forest Rights (IFR)</option>
                      <option value="CR">Community Rights (CR)</option>
                      <option value="CFR">Community Forest Resources (CFR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Claim Area (hectares) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.title_info?.claim_area_hectares || ''}
                      onChange={(e) => handleInputChange('title_info', 'claim_area_hectares', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="1.50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GPS Coordinates (Optional)
                    </label>
                    <div className="space-y-4">
                      {/* Simple coordinate input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Longitude (X)
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="80.27602945502146"
                            value={formData.title_info?.polygon_coordinates?.[0]?.[0]?.[0] || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            onChange={(e) => {
                              const lng = parseFloat(e.target.value);
                              if (!isNaN(lng)) {
                                // Create a simple polygon with the provided longitude
                                const currentCoords = formData.title_info?.polygon_coordinates || [];
                                if (currentCoords.length > 0 && currentCoords[0].length > 0) {
                                  const lat = currentCoords[0][0][1] || 22.220035169973066;
                                  const newCoords = [[[lng, lat], [lng + 0.001, lat], [lng + 0.001, lat + 0.001], [lng, lat + 0.001], [lng, lat]]];
                                  handleInputChange('title_info', 'polygon_coordinates', newCoords);
                                } else {
                                  const lat = 22.220035169973066;
                                  const newCoords = [[[lng, lat], [lng + 0.001, lat], [lng + 0.001, lat + 0.001], [lng, lat + 0.001], [lng, lat]]];
                                  handleInputChange('title_info', 'polygon_coordinates', newCoords);
                                }
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Latitude (Y)
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="22.220035169973066"
                            value={formData.title_info?.polygon_coordinates?.[0]?.[0]?.[1] || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            onChange={(e) => {
                              const lat = parseFloat(e.target.value);
                              if (!isNaN(lat)) {
                                // Create a simple polygon with the provided latitude
                                const currentCoords = formData.title_info?.polygon_coordinates || [];
                                if (currentCoords.length > 0 && currentCoords[0].length > 0) {
                                  const lng = currentCoords[0][0][0] || 80.27602945502146;
                                  const newCoords = [[[lng, lat], [lng + 0.001, lat], [lng + 0.001, lat + 0.001], [lng, lat + 0.001], [lng, lat]]];
                                  handleInputChange('title_info', 'polygon_coordinates', newCoords);
                                } else {
                                  const lng = 80.27602945502146;
                                  const newCoords = [[[lng, lat], [lng + 0.001, lat], [lng + 0.001, lat + 0.001], [lng, lat + 0.001], [lng, lat]]];
                                  handleInputChange('title_info', 'polygon_coordinates', newCoords);
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Advanced JSON input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Advanced: Full Polygon Coordinates (JSON)
                        </label>
                        <textarea
                          value={JSON.stringify(formData.title_info?.polygon_coordinates || [])}
                          onChange={(e) => {
                            try {
                              const coords = JSON.parse(e.target.value);
                              handleInputChange('title_info', 'polygon_coordinates', coords);
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          rows={3}
                          placeholder="Enter polygon coordinates in JSON format..."
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Set example coordinates for चिरमिरी
                            const exampleCoords = [[[80.27602945502146, 22.220035169973066], [80.27605892706691, 22.22059078045775], [80.273777701138, 22.220758461552585], [80.27414972299651, 22.22005157078757], [80.27431556696547, 22.218964613970122], [80.27552253865323, 22.21868529244753], [80.27602945502146, 22.220035169973066]]];
                            handleInputChange('title_info', 'polygon_coordinates', exampleCoords);
                          }}
                          className="text-xs px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                        >
                          चिरमिरी Example
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Set example coordinates for पाकाला
                            const exampleCoords = [[[80.54635212060894, 22.79320098273347], [80.54602495210914, 22.793732930673524], [80.54504098599959, 22.793350670018256], [80.54396184629934, 22.793092738078585], [80.54531552764372, 22.79101500280458], [80.54601006158536, 22.791188448636703], [80.54635212060894, 22.79320098273347]]];
                            handleInputChange('title_info', 'polygon_coordinates', exampleCoords);
                          }}
                          className="text-xs px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                        >
                          पाकाला Example
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Set example coordinates for चंबा
                            const exampleCoords = [[[80.53635212060894, 22.75320098273347], [80.53602495210914, 22.753732930673524], [80.53504098599959, 22.753350670018256], [80.53396184629934, 22.753092738078585], [80.53531552764372, 22.75101500280458], [80.53601006158536, 22.751188448636703], [80.53635212060894, 22.75320098273347]]];
                            handleInputChange('title_info', 'polygon_coordinates', exampleCoords);
                          }}
                          className="text-xs px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                        >
                          चंबा Example
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('title_info', 'polygon_coordinates', []);
                          }}
                          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p className="mb-1">• Use simple Longitude/Latitude inputs for basic coordinates</p>
                        <p className="mb-1">• Use Advanced JSON input for complex polygon shapes</p>
                        <p>• Click village examples to use predefined coordinates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Summary Section */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                    Asset Summary
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Area (hectares) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.asset_summary?.total_area_hectares || ''}
                      onChange={(e) => handleInputChange('asset_summary', 'total_area_hectares', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="2.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Assets *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.asset_summary?.assets_count || ''}
                      onChange={(e) => handleInputChange('asset_summary', 'assets_count', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Asset Types *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Water_Body', 'Forest_Patch', 'Agricultural_Land', 'Community_Forest', 'Water_Source', 'Traditional_Medicinal_Plants'].map((assetType) => (
                        <label key={assetType} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={formData.asset_summary?.asset_types?.includes(assetType) || false}
                            onChange={(e) => handleAssetTypeChange(assetType, e.target.checked)}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {assetType.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vulnerability Assessment Section */}
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    Vulnerability Assessment (Optional)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vulnerability Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.vulnerability?.score || ''}
                      onChange={(e) => handleInputChange('vulnerability', 'score', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="25.50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Risk Category
                    </label>
                    <select 
                      value={formData.vulnerability?.category || ''}
                      onChange={(e) => handleInputChange('vulnerability', 'category', e.target.value || null)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Risk Category</option>
                      <option value="Low Risk">Low Risk</option>
                      <option value="Medium Risk">Medium Risk</option>
                      <option value="High Risk">High Risk</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('upload_documents')} *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drop files here or click to upload supporting documents
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Supports: PDF, JPG, PNG, MP3, MP4 (max 10MB each)
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Required documents: Land deed, Identity proof, Community consent (if applicable)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.mp3,.mp4,.wav"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                  
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowNewClaimForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                    submitting 
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>{submitting ? 'Submitting...' : t('submit')}</span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Claim Details - {selectedClaim.id}
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </h3>
                  <span className={getStatusBadge(selectedClaim.status)}>
                    {selectedClaim.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Submission Date
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedClaim.submissionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              {selectedClaim.personal_info && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Income</h4>
                      <p className="text-gray-900 dark:text-white">₹{selectedClaim.personal_info.income.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Administrative Information */}
              {selectedClaim.admin_info && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                      Administrative Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Village</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.village}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gram Panchayat</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.gp} ({selectedClaim.admin_info.gp_id})</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Block</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.block}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.district}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.state}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forest Area</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.admin_info.forest_area_hectares ? selectedClaim.admin_info.forest_area_hectares.toFixed(2) : 'N/A'} hectares</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title Information */}
              {selectedClaim.title_info && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                      Title Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Right Type</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.title_info.right_type}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Claim Area</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.title_info.claim_area_hectares} hectares</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title Status</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.title_info.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset Summary */}
              {selectedClaim.asset_summary && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                      Asset Summary
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Area</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.asset_summary.total_area_hectares} hectares</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assets Count</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.asset_summary.assets_count}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Types</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.asset_summary.asset_types.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vulnerability Assessment */}
              {selectedClaim.vulnerability && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                      Vulnerability Assessment
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vulnerability Score</h4>
                      <p className="text-gray-900 dark:text-white">{selectedClaim.vulnerability.score ? selectedClaim.vulnerability.score.toFixed(2) : 'N/A'}</p>
                    </div>
                    {selectedClaim.vulnerability.category && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h4>
                        <p className="text-gray-900 dark:text-white">{selectedClaim.vulnerability.category}</p>
                      </div>
                    )}
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
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DLC</h4>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            Active
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

              {/* Uploaded Files */}
              {(selectedClaim.uploadedFiles && selectedClaim.uploadedFiles.length > 0) && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                      Uploaded Documents
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedClaim.uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {file.type} • {file.size ? (file.size / 1024).toFixed(1) : '0.0'} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Files (Legacy) */}
              {selectedClaim.evidence && selectedClaim.evidence.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                      Evidence Documents
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedClaim.evidence.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{file}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedClaim.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                    Rejection Reason
                  </h3>
                  <p className="text-red-700 dark:text-red-400">
                    {selectedClaim.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Claims;