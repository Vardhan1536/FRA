import axios from 'axios';
import { Claim, NewClaimSubmission, DSSValidation, ClaimEscalation, Scheme, Alert, BeneficiarySchemeEligibility, SchemeEligibilityGroup, ResourceSuggestionsResponse } from '../types';

export const claimsAPI = {
  submit: async (_claimData: FormData): Promise<Claim> => {
    // Mock implementation - replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'mock-claim-1',
          beneficiary_id: 'FRA_00000001',
          title_id: 'FRA_TITLE_00000001',
          village: 'Mock Village',
          status: 'Pending',
          coordinates: [22.9734, 78.6569],
          area: 1.5,
          evidence: [],
          uploadedFiles: [],
          submissionDate: new Date(),
          applicantName: 'Mock Applicant',
          claimType: 'IFR',
          personal_info: {
            first_name: 'Mock',
            last_name: 'Applicant',
            gender: 'Male',
            tribal_community: 'Baiga',
            aadhaar: '1234-5678-9012',
            income: 50000
          },
          title_info: {
            right_type: 'IFR',
            status: 'Pending',
            claim_area_hectares: 1.5,
            polygon_coordinates: [
              [
                [78.6569, 22.9734],
                [78.6579, 22.9734],
                [78.6579, 22.9744],
                [78.6569, 22.9744],
                [78.6569, 22.9734]
              ]
            ]
          },
          admin_info: {
            village_id: 'VIL_000001',
            village: 'Mock Village',
            gp: 'GP_Mock',
            block: 'Mock Block',
            district: 'Mock District',
            state: 'Mock State',
            forest_area_hectares: 100.0,
            block_id: 'BLK_000001',
            gp_id: 'GP_000001'
          },
          asset_summary: {
            total_area_hectares: 1.5,
            asset_types: ['Forest_Patch'],
            assets_count: 1
          },
          vulnerability: {
            score: 25.0,
            category: 'Low Risk'
          },
          statuses: {
            gramasabha: 'Pending',
            sdlc: undefined,
            dlc: undefined
          }
        });
      }, 1000);
    });
  },

  submitNewClaim: async (claimData: NewClaimSubmission): Promise<Claim> => {
    try {
      console.log('Submitting new claim to API:', claimData);
      
      // Generate beneficiary_id and title_id
      const beneficiary_id = `FRA_${String(Date.now()).padStart(8, '0')}`;
      const title_id = `FRA_TITLE_${String(Date.now()).padStart(8, '0')}`;
      
      // Update claim data with generated IDs and set gramasabha status to Pending
      const updatedClaimData = {
        ...claimData,
        beneficiary_id,
        title_id,
        statuses: {
          ...claimData.statuses,
          gramasabha: 'Pending' as const
        }
      };

      const response = await axios.post('http://127.0.0.1:8000/add-beneficiary', updatedClaimData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('New claim API response:', response.data);

      // Convert API response to Claim format
      const apiClaim = response.data;
      const claim: Claim = {
        id: apiClaim.title_id,
        beneficiary_id: apiClaim.beneficiary_id,
        title_id: apiClaim.title_id,
        village: apiClaim.admin_info?.village || 'Unknown',
        status: apiClaim.statuses?.gramasabha || 'Pending',
        coordinates: apiClaim.title_info?.polygon_coordinates?.[0]?.[0] || [22.9734, 78.6569],
        area: apiClaim.title_info?.claim_area_hectares || 0,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(),
        applicantName: `${apiClaim.personal_info?.first_name || ''} ${apiClaim.personal_info?.last_name || ''}`.trim(),
        claimType: apiClaim.title_info?.right_type as 'IFR' | 'CR' | 'CFR' || 'IFR',
        personal_info: apiClaim.personal_info,
        title_info: apiClaim.title_info,
        admin_info: apiClaim.admin_info,
        asset_summary: apiClaim.asset_summary,
        vulnerability: apiClaim.vulnerability,
        statuses: apiClaim.statuses
      };

      return claim;
    } catch (error) {
      console.error('Error submitting new claim:', error);
      
      // If API call fails, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  approveClaim: async (claimId: string): Promise<void> => {
    try {
      console.log(`Approving claim ${claimId}`);
      
      // Get the claim from pending claims
      const storedClaims = localStorage.getItem('pendingClaims') || '[]';
      const claims = JSON.parse(storedClaims);
      const claimToApprove = claims.find((claim: Claim) => claim.id === claimId);
      
      if (!claimToApprove) {
        throw new Error('Claim not found in pending claims');
      }

      // Update the claim status to approved
      const approvedClaim = {
        ...claimToApprove,
        status: 'Approved',
        statuses: {
          ...claimToApprove.statuses,
          gramasabha: 'Approved' as const
        }
      };

      // Send approved claim to the API endpoint
      console.log('Sending approved claim to API:', approvedClaim);
      
      const response = await axios.post('http://127.0.0.1:8000/add-beneficiary', approvedClaim, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Approval API response:', response.data);

      // Update local storage
      const updatedClaims = claims.filter((claim: Claim) => claim.id !== claimId);
      localStorage.setItem('pendingClaims', JSON.stringify(updatedClaims));
      
    } catch (error) {
      console.error('Error approving claim:', error);
      
      // If API call fails, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  getBeneficiaries: async (role: string): Promise<Claim[]> => {
    try {
      console.log(`Fetching beneficiaries for role: ${role}`);
      
      const response = await axios.get('http://127.0.0.1:8000/get-beneficiaries', {
        params: {
          role: role
        },
        timeout: 120000, // 2 minute timeout
      });

      console.log('Beneficiaries API response:', response.data);

      // Convert API response to Claim format
      const beneficiaries = response.data;
      const claims: Claim[] = beneficiaries.map((beneficiary: any) => ({
        id: beneficiary.title_id,
        beneficiary_id: beneficiary.beneficiary_id,
        title_id: beneficiary.title_id,
        village: beneficiary.admin_info?.village || 'Unknown',
        status: beneficiary.statuses?.gramasabha || 'Pending',
        coordinates: beneficiary.title_info?.polygon_coordinates?.[0]?.[0] || [22.9734, 78.6569],
        area: beneficiary.title_info?.claim_area_hectares || 0,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(), // API doesn't provide submission date
        applicantName: `${beneficiary.personal_info?.first_name || ''} ${beneficiary.personal_info?.last_name || ''}`.trim(),
        claimType: beneficiary.title_info?.right_type as 'IFR' | 'CR' | 'CFR' || 'IFR',
        personal_info: beneficiary.personal_info,
        title_info: beneficiary.title_info,
        admin_info: beneficiary.admin_info,
        asset_summary: beneficiary.asset_summary,
        vulnerability: beneficiary.vulnerability,
        statuses: beneficiary.statuses
      }));

      // Store in local storage with role and timestamp
      const cacheData = {
        data: claims,
        timestamp: Date.now(),
        role: role
      };
      localStorage.setItem(`beneficiaries_${role}`, JSON.stringify(cacheData));
      console.log(`Cached ${claims.length} claims for role: ${role}`);

      return claims;
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      
      // Try to load from cache if API fails
      const cachedData = localStorage.getItem(`beneficiaries_${role}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} claims from cache for role: ${role} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('Cache expired, removing old cache');
            localStorage.removeItem(`beneficiaries_${role}`);
          }
        } catch (cacheError) {
          console.error('Error parsing cached data:', cacheError);
          localStorage.removeItem(`beneficiaries_${role}`);
        }
      }
      
      // If API call fails and no valid cache, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  clearBeneficiariesCache: (role?: string) => {
    if (role) {
      localStorage.removeItem(`beneficiaries_${role}`);
      console.log(`Cleared cache for role: ${role}`);
    } else {
      // Clear all role caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('beneficiaries_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all beneficiaries cache');
    }
  },

  // Helper function to get claims for any role
  getClaimsForRole: async (role: string): Promise<Claim[]> => {
    try {
      console.log(`Fetching claims for role: ${role}`);
      
      const response = await axios.get('http://127.0.0.1:8000/get-beneficiaries', {
        params: {
          role: role
        },
        timeout: 120000, // 2 minute timeout
      });

      console.log(`${role} claims API response:`, response.data);

      // Convert API response to Claim format
      const beneficiaries = response.data;
      const claims: Claim[] = beneficiaries.map((beneficiary: any) => ({
        id: beneficiary.title_id,
        beneficiary_id: beneficiary.beneficiary_id,
        title_id: beneficiary.title_id,
        village: beneficiary.admin_info?.village || 'Unknown',
        status: beneficiary.statuses?.gramasabha || 'Pending',
        coordinates: beneficiary.title_info?.polygon_coordinates?.[0]?.[0] || [22.9734, 78.6569],
        area: beneficiary.title_info?.claim_area_hectares || 0,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(),
        applicantName: `${beneficiary.personal_info?.first_name || ''} ${beneficiary.personal_info?.last_name || ''}`.trim(),
        claimType: beneficiary.title_info?.right_type as 'IFR' | 'CR' | 'CFR' || 'IFR',
        personal_info: beneficiary.personal_info,
        title_info: beneficiary.title_info,
        admin_info: beneficiary.admin_info,
        asset_summary: beneficiary.asset_summary,
        vulnerability: beneficiary.vulnerability,
        statuses: beneficiary.statuses
      }));

      // Store in local storage with role and timestamp
      const cacheData = {
        data: claims,
        timestamp: Date.now(),
        role: role
      };
      localStorage.setItem(`beneficiaries_${role}`, JSON.stringify(cacheData));
      console.log(`Cached ${claims.length} claims for role: ${role}`);

      return claims;
    } catch (error) {
      console.error(`Error fetching claims for role ${role}:`, error);
      
      // Try to load from cache if API fails
      const cachedData = localStorage.getItem(`beneficiaries_${role}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} claims from cache for role: ${role} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log(`Cache expired for role ${role}, removing old cache`);
            localStorage.removeItem(`beneficiaries_${role}`);
          }
        } catch (cacheError) {
          console.error(`Error parsing cached data for role ${role}:`, cacheError);
          localStorage.removeItem(`beneficiaries_${role}`);
        }
      }
      
      return [];
    }
  },
  
  getAll: async (): Promise<Claim[]> => {
    // No mock data - return empty array
    return [];
  },

  getClaimsForReview: async (): Promise<Claim[]> => {
    // No mock data - return empty array
    return [];
  },

  getDSSValidation: async (claimId: string): Promise<DSSValidation> => {
    // Mock DSS validation data
    const mockValidations: { [key: string]: DSSValidation } = {
      'claim-sdlc-1': {
        claimId,
        isValid: true,
        confidence: 85,
        suggestions: ['Document verification complete', 'Coordinates match satellite imagery'],
        riskFactors: [],
        recommendedAction: 'approve',
        timestamp: new Date()
      },
      'claim-sdlc-2': {
        claimId,
        isValid: false,
        confidence: 45,
        suggestions: ['Verify land ownership documents', 'Check for overlapping claims'],
        riskFactors: ['Potential boundary dispute', 'Incomplete documentation'],
        recommendedAction: 'review',
        timestamp: new Date()
      },
      'claim-sdlc-3': {
        claimId,
        isValid: true,
        confidence: 72,
        suggestions: ['Community consent verified', 'Traditional knowledge documented'],
        riskFactors: ['Large area claim'],
        recommendedAction: 'approve',
        timestamp: new Date()
      }
    };

    return mockValidations[claimId] || {
      claimId,
      isValid: false,
      confidence: 0,
      suggestions: [],
      riskFactors: [],
      recommendedAction: 'review',
      timestamp: new Date()
    };
  },

  reviewClaim: async (claimId: string, decision: 'approve' | 'reject', remarks: string): Promise<void> => {
    console.log(`Reviewing claim ${claimId} with decision: ${decision} and remarks: ${remarks}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  },

  escalateClaim: async (claimId: string, reason: string): Promise<void> => {
    console.log(`Escalating claim ${claimId} with reason: ${reason}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  },

  getStatistics: async () => {
    return {
      total: 150,
      approved: 89,
      rejected: 23,
      pending: 38,
      byType: {
        IFR: 95,
        CR: 35,
        CFR: 20
      },
      byStatus: {
        approved: 89,
        rejected: 23,
        pending: 38
      },
      recentActivity: [
        { date: '2024-01-15', action: 'Claim Approved', count: 5 },
        { date: '2024-01-14', action: 'Claim Submitted', count: 3 },
        { date: '2024-01-13', action: 'Claim Rejected', count: 2 }
      ]
    };
  },

  getVillageStatistics: async () => {
    return {
      totalVillages: 4,
      totalClaims: 150,
      approvedClaims: 89,
      rejectedClaims: 23,
      pendingClaims: 38,
      villages: [
        { village: 'Village A', totalClaims: 45, approvedClaims: 28, rejectedClaims: 8, pendingClaims: 9 },
        { village: 'Village B', totalClaims: 38, approvedClaims: 22, rejectedClaims: 6, pendingClaims: 10 },
        { village: 'Village C', totalClaims: 35, approvedClaims: 20, rejectedClaims: 5, pendingClaims: 10 },
        { village: 'Village D', totalClaims: 32, approvedClaims: 19, rejectedClaims: 4, pendingClaims: 9 }
      ]
    };
  },

  getEscalatedClaims: async (): Promise<Claim[]> => {
    // No mock data - return empty array
    return [];
  },

  getClaimEscalationDetails: async (claimId: string): Promise<ClaimEscalation> => {
    // No mock data - return empty escalation details
    return {
      claimId,
      escalatedBy: '',
      escalatedAt: new Date(),
      reason: '',
      sdlcDecision: 'Approved',
      sdlcReason: '',
      dssValidation: {
        claimId,
        isValid: false,
        confidence: 0,
        suggestions: [],
        riskFactors: [],
        recommendedAction: 'review',
        timestamp: new Date()
      },
      supportingDocuments: []
    };
  },

  acknowledgeDLCAlert: async (alertId: string, comments?: string): Promise<void> => {
    console.log(`Acknowledging DLC alert ${alertId} with comments: ${comments}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },

  exportDLCCaimsToCSV: async (claims: Claim[]): Promise<Blob> => {
    // Mock CSV export for DLC claims
    const csvContent = [
      'ID,Village,Status,Area,Applicant,Type,Submission Date,SDLC Decision,Escalation Reason',
      ...claims.map(claim => 
        `${claim.id},${claim.village},${claim.status},${claim.area},${claim.applicantName},${claim.claimType},${claim.submissionDate.toISOString()},${claim.reviewedBy || 'N/A'},${claim.reason || 'N/A'}`
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  },

  exportSchemesToCSV: async (schemes: Scheme[]): Promise<Blob> => {
    // Mock CSV export for schemes
    const csvContent = [
      'ID,Name,Type,Status,Beneficiaries,Budget,Start Date,End Date',
      ...schemes.map(scheme => 
        `${scheme.id},${scheme.name},${scheme.type},${scheme.status},${scheme.historicalBeneficiaries},${scheme.budget},${scheme.startDate.toISOString()},${scheme.endDate?.toISOString() || 'N/A'}`
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }
};

export const statsAPI = {
  getDashboardStats: async () => {
    return {
      totalClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      pendingClaims: 0,
      recentActivity: [],
      claimsByType: {
        IFR: 0,
        CR: 0,
        CFR: 0
      },
      claimsByStatus: {
        approved: 0,
        rejected: 0,
        pending: 0
      }
    };
  }
};

export const sdlcAPI = {
  getClaimsForReview: async (): Promise<Claim[]> => {
    try {
      console.log('Fetching claims for SDLC review');
      
      const response = await axios.get('http://127.0.0.1:8000/get-beneficiaries', {
        params: {
          role: 'SDLC'
        },
        timeout: 120000, // 2 minute timeout
      });

      console.log('SDLC claims API response:', response.data);

      // Convert API response to Claim format
      const beneficiaries = response.data;
      const claims: Claim[] = beneficiaries.map((beneficiary: any) => ({
        id: beneficiary.title_id,
        beneficiary_id: beneficiary.beneficiary_id,
        title_id: beneficiary.title_id,
        village: beneficiary.admin_info?.village || 'Unknown',
        status: beneficiary.statuses?.sdlc?.review ? 'Approved' : 'Pending',
        coordinates: beneficiary.title_info?.polygon_coordinates?.[0]?.[0] || [22.9734, 78.6569],
        area: beneficiary.title_info?.claim_area_hectares || 0,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(),
        applicantName: `${beneficiary.personal_info?.first_name || ''} ${beneficiary.personal_info?.last_name || ''}`.trim(),
        claimType: beneficiary.title_info?.right_type as 'IFR' | 'CR' | 'CFR' || 'IFR',
        personal_info: beneficiary.personal_info,
        title_info: beneficiary.title_info,
        admin_info: beneficiary.admin_info,
        asset_summary: beneficiary.asset_summary,
        vulnerability: beneficiary.vulnerability,
        statuses: beneficiary.statuses
      }));

      // Store in local storage with role and timestamp
      const cacheData = {
        data: claims,
        timestamp: Date.now(),
        role: 'SDLC'
      };
      localStorage.setItem('beneficiaries_SDLC', JSON.stringify(cacheData));
      console.log(`Cached ${claims.length} claims for SDLC role`);

      return claims;
    } catch (error) {
      console.error('Error fetching SDLC claims:', error);
      
      // Try to load from cache if API fails
      const cachedData = localStorage.getItem('beneficiaries_SDLC');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} SDLC claims from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('SDLC cache expired, removing old cache');
            localStorage.removeItem('beneficiaries_SDLC');
          }
        } catch (cacheError) {
          console.error('Error parsing SDLC cached data:', cacheError);
          localStorage.removeItem('beneficiaries_SDLC');
        }
      }
      
      return [];
    }
  },
  
  getDSSValidation: async (claimId: string) => ({
    claimId,
    isValid: false,
    confidence: 0,
    suggestions: [],
    riskFactors: [],
    recommendedAction: 'review' as const,
    timestamp: new Date()
  }),
  
  reviewClaim: async (claimId: string, decision: 'approve' | 'reject', remarks: string) => {
    console.log(`Reviewing claim ${claimId} with decision: ${decision} and remarks: ${remarks}`);
  },
  
  escalateClaim: async (claimId: string, reason: string) => {
    console.log(`Escalating claim ${claimId} with reason: ${reason}`);
  },
  
  getStatistics: async () => ({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    byType: { IFR: 0, CR: 0, CFR: 0 },
    byStatus: { approved: 0, rejected: 0, pending: 0 },
    recentActivity: []
  })
};

export const dlcAPI = {
  getEscalatedClaims: async (): Promise<Claim[]> => {
    try {
      console.log('Fetching claims for DLC review');
      
      const response = await axios.get('http://127.0.0.1:8000/get-beneficiaries', {
        params: {
          role: 'DLC'
        },
        timeout: 120000, // 2 minute timeout
      });

      console.log('DLC claims API response:', response.data);

      // Convert API response to Claim format
      const beneficiaries = response.data;
      const claims: Claim[] = beneficiaries.map((beneficiary: any) => ({
        id: beneficiary.title_id,
        beneficiary_id: beneficiary.beneficiary_id,
        title_id: beneficiary.title_id,
        village: beneficiary.admin_info?.village || 'Unknown',
        status: beneficiary.statuses?.dlc ? 'Approved' : 'Pending',
        coordinates: beneficiary.title_info?.polygon_coordinates?.[0]?.[0] || [22.9734, 78.6569],
        area: beneficiary.title_info?.claim_area_hectares || 0,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(),
        applicantName: `${beneficiary.personal_info?.first_name || ''} ${beneficiary.personal_info?.last_name || ''}`.trim(),
        claimType: beneficiary.title_info?.right_type as 'IFR' | 'CR' | 'CFR' || 'IFR',
        personal_info: beneficiary.personal_info,
        title_info: beneficiary.title_info,
        admin_info: beneficiary.admin_info,
        asset_summary: beneficiary.asset_summary,
        vulnerability: beneficiary.vulnerability,
        statuses: beneficiary.statuses
      }));

      // Store in local storage with role and timestamp
      const cacheData = {
        data: claims,
        timestamp: Date.now(),
        role: 'DLC'
      };
      localStorage.setItem('beneficiaries_DLC', JSON.stringify(cacheData));
      console.log(`Cached ${claims.length} claims for DLC role`);

      return claims;
    } catch (error) {
      console.error('Error fetching DLC claims:', error);
      
      // Try to load from cache if API fails
      const cachedData = localStorage.getItem('beneficiaries_DLC');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxCacheAge = 30 * 60 * 1000; // 30 minutes
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} DLC claims from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('DLC cache expired, removing old cache');
            localStorage.removeItem('beneficiaries_DLC');
          }
        } catch (cacheError) {
          console.error('Error parsing DLC cached data:', cacheError);
          localStorage.removeItem('beneficiaries_DLC');
        }
      }
      
      return [];
    }
  },
  
  getClaimEscalationDetails: async (claimId: string) => ({
    claimId,
    escalatedBy: '',
    escalatedAt: new Date(),
    reason: '',
    sdlcDecision: 'Approved' as const,
    sdlcReason: '',
    dssValidation: {
      claimId,
      isValid: false,
      confidence: 0,
      suggestions: [],
      riskFactors: [],
      recommendedAction: 'review' as const,
      timestamp: new Date()
    },
    supportingDocuments: []
  }),
  
  acknowledgeDLCAlert: async (alertId: string, comments?: string) => {
    console.log(`Acknowledging DLC alert ${alertId} with comments: ${comments}`);
  },
  
  exportDLCCaimsToCSV: async (claims: Claim[]) => {
    const csvContent = [
      'ID,Village,Status,Area,Applicant,Type,Submission Date,SDLC Decision,Escalation Reason',
      ...claims.map(claim => 
        `${claim.id},${claim.village},${claim.status},${claim.area},${claim.applicantName},${claim.claimType},${claim.submissionDate.toISOString()},${claim.reviewedBy || 'N/A'},${claim.reason || 'N/A'}`
      )
    ].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  },
  
  exportSchemesToCSV: async (schemes: Scheme[]) => {
    const csvContent = [
      'ID,Name,Type,Status,Beneficiaries,Budget,Start Date,End Date',
      ...schemes.map(scheme => 
        `${scheme.id},${scheme.name},${scheme.type},${scheme.status},${scheme.historicalBeneficiaries},${scheme.budget},${scheme.startDate.toISOString()},${scheme.endDate?.toISOString() || 'N/A'}`
      )
    ].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  },
  
  getStatistics: async () => ({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    byType: { IFR: 0, CR: 0, CFR: 0 },
    byStatus: { approved: 0, rejected: 0, pending: 0 },
    recentActivity: []
  })
};

export const alertsAPI = {
  getAll: async (role: string, forceRefresh: boolean = false): Promise<Alert[]> => {
    const cacheKey = `alerts_cache_${role}`;
    const maxCacheAge = 5 * 60 * 1000; // 5 minutes cache
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading ${parsed.data.length} alerts from cache for role: ${role} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('Alerts cache expired, fetching fresh data');
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error('Error parsing cached alerts data:', error);
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      console.log(`Fetching alerts from monitoring API for role: ${role}`);
      
      const response = await axios.get('http://127.0.0.1:8000/monitor-changes', {
        params: {
          role: role
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Monitoring API response:', response.data);
      
      // Convert API response to Alert format
      const alertsData = response.data;
      const alerts: Alert[] = Array.isArray(alertsData) ? alertsData.map((alert: any) => ({
        id: alert.id || `alert-${Date.now()}-${Math.random()}`,
        type: alert.type || 'system',
        location: alert.location || 'Unknown Location',
        coordinates: alert.coordinates || [22.9734, 78.6569],
        timestamp: new Date(alert.timestamp || Date.now()),
        description: alert.description || 'No description available',
        resolved: alert.resolved || false,
        severity: alert.severity || 'medium',
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
        comments: alert.comments,
        changeDetection: alert.changeDetection
      })) : [];
      
      // Cache the results
      const cacheData = {
        data: alerts,
        timestamp: Date.now(),
        role: role
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached ${alerts.length} alerts for role: ${role} for ${maxCacheAge / 1000 / 60} minutes`);
      
      return alerts;
    } catch (error) {
      console.error('Error fetching alerts from monitoring API:', error);
      
      // Try to load from cache if API fails
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`API failed, loading ${parsed.data.length} alerts from cache as fallback`);
          return parsed.data;
        }
      } catch (cacheError) {
        console.error('Error loading alerts from cache fallback:', cacheError);
      }
      
      // If API call fails and no valid cache, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the monitoring service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  getAlerts: async (role: string): Promise<Alert[]> => {
    // Alias for getAll for backward compatibility
    return alertsAPI.getAll(role);
  },

  acknowledge: async (alertId: string, comments?: string): Promise<void> => {
    try {
      console.log(`Acknowledging alert ${alertId} with comments: ${comments}`);
      
      const response = await axios.post(`http://127.0.0.1:8000/monitor-changes/${alertId}/acknowledge`, {
        comments: comments || '',
        acknowledgedAt: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Alert acknowledgment response:', response.data);
      
      // Update local cache for all roles (since we don't know which role's cache to update)
      const keys = Object.keys(localStorage);
      const alertCacheKeys = keys.filter(key => key.startsWith('alerts_cache_'));
      
      alertCacheKeys.forEach(cacheKey => {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            const updatedAlerts = parsed.data.map((alert: Alert) => 
              alert.id === alertId 
                ? { 
                    ...alert, 
                    resolved: true,
                    acknowledgedBy: 'Current User',
                    acknowledgedAt: new Date(),
                    comments: comments
                  }
                : alert
            );
            
            const updatedCacheData = {
              data: updatedAlerts,
              timestamp: parsed.timestamp, // Keep original timestamp
              role: parsed.role
            };
            localStorage.setItem(cacheKey, JSON.stringify(updatedCacheData));
            console.log(`Updated alerts cache ${cacheKey} after acknowledgment`);
          }
        } catch (cacheError) {
          console.error(`Error updating alerts cache ${cacheKey} after acknowledgment:`, cacheError);
        }
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      
      // If API call fails, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the monitoring service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  acknowledgeAlert: async (alertId: string, comments?: string): Promise<void> => {
    // Alias for acknowledge for backward compatibility
    return alertsAPI.acknowledge(alertId, comments);
  },

  refreshChangeDetection: async (): Promise<void> => {
    try {
      console.log('Refreshing change detection data');
      
      const response = await axios.post('http://127.0.0.1:8000/monitor-changes/refresh', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for refresh operation
      });

      console.log('Change detection refresh response:', response.data);
      
      // Clear all alerts caches to force fresh data on next load
      const keys = Object.keys(localStorage);
      const alertCacheKeys = keys.filter(key => key.startsWith('alerts_cache_'));
      
      alertCacheKeys.forEach(cacheKey => {
        localStorage.removeItem(cacheKey);
      });
      
      console.log(`Cleared ${alertCacheKeys.length} alerts caches after change detection refresh`);
    } catch (error) {
      console.error('Error refreshing change detection:', error);
      
      // If API call fails, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the monitoring service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  // Cache management utilities
  clearCache: (role?: string): void => {
    if (role) {
      const cacheKey = `alerts_cache_${role}`;
      localStorage.removeItem(cacheKey);
      console.log(`Cleared alerts cache for role: ${role}`);
    } else {
      const keys = Object.keys(localStorage);
      const alertCacheKeys = keys.filter(key => key.startsWith('alerts_cache_'));
      
      alertCacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`Cleared ${alertCacheKeys.length} alerts caches`);
    }
  },

  getCacheInfo: (role?: string): { exists: boolean; age: number; dataCount: number } => {
    if (role) {
      const cacheKey = `alerts_cache_${role}`;
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          return {
            exists: true,
            age: age,
            dataCount: parsed.data?.length || 0
          };
        }
      } catch (error) {
        console.error('Error reading cache info:', error);
      }
      return { exists: false, age: 0, dataCount: 0 };
    } else {
      // Get info for all roles
      const keys = Object.keys(localStorage);
      const alertCacheKeys = keys.filter(key => key.startsWith('alerts_cache_'));
      let totalDataCount = 0;
      let hasAnyCache = false;
      let oldestAge = 0;
      
      alertCacheKeys.forEach(key => {
        try {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            totalDataCount += parsed.data?.length || 0;
            hasAnyCache = true;
            if (age > oldestAge) {
              oldestAge = age;
            }
          }
        } catch (error) {
          console.error('Error reading cache info:', error);
        }
      });
      
      return {
        exists: hasAnyCache,
        age: oldestAge,
        dataCount: totalDataCount
      };
    }
  }
};

export const legalAssistanceAPI = {
  getLegalAssistance: async (query: string, role: string): Promise<string> => {
    const cacheKey = `legal_assistance_${role}_${btoa(query)}`;
    const maxCacheAge = 60 * 60 * 1000; // 1 hour cache for legal assistance
    
    // Check cache first
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        
        if (cacheAge < maxCacheAge) {
          console.log(`Loading legal assistance from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
          return parsed.response;
        } else {
          console.log('Legal assistance cache expired, fetching fresh data');
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error parsing cached legal assistance data:', error);
      localStorage.removeItem(cacheKey);
    }

    try {
      console.log(`Getting legal assistance for query: ${query}, role: ${role}`);
      
      const response = await axios.post('http://127.0.0.1:8000/legal-assistance', {
        query: query,
        role: role
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Legal assistance API response:', response.data);
      
      const responseText = response.data.response || response.data.message || 'Legal assistance response received';
      
      // Cache the response
      const cacheData = {
        response: responseText,
        query: query,
        role: role,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached legal assistance response for ${maxCacheAge / 1000 / 60} minutes`);
      
      return responseText;
    } catch (error) {
      console.error('Error getting legal assistance:', error);
      
      // Try to load from cache if API fails
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`API failed, loading legal assistance from cache as fallback`);
          return parsed.response;
        }
      } catch (cacheError) {
        console.error('Error loading legal assistance from cache fallback:', cacheError);
      }
      
      // If API call fails and no valid cache, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the legal assistance service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  // Cache management utilities
  clearCache: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('legal_assistance_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared legal assistance cache');
  },

  getCacheInfo: (): { count: number; totalSize: number } => {
    const keys = Object.keys(localStorage);
    const legalKeys = keys.filter(key => key.startsWith('legal_assistance_'));
    let totalSize = 0;
    
    legalKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });
    
    return {
      count: legalKeys.length,
      totalSize: totalSize
    };
  }
};

// Global cache management utilities
export const cacheManager = {
  // Clear all application caches
  clearAllCaches: (): void => {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => 
      key.startsWith('alerts_cache_') ||
      key.startsWith('beneficiaries_') ||
      key.startsWith('legal_assistance_') ||
      key.startsWith('scheme_eligibility_') ||
      key.startsWith('resource_suggestions_') ||
      key.startsWith('pendingClaims')
    );
    
    appKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${appKeys.length} application caches`);
  },

  // Get cache statistics
  getCacheStats: (): {
    alerts: { [role: string]: { exists: boolean; age: number; dataCount: number } };
    beneficiaries: { [role: string]: { exists: boolean; age: number; dataCount: number } };
    legalAssistance: { count: number; totalSize: number };
    schemeEligibility: { [role: string]: { exists: boolean; age: number; dataCount: number } };
    resourceSuggestions: { [role: string]: { exists: boolean; age: number; dataCount: number } };
    totalSize: number;
  } => {
    // Get alerts cache info for all roles
    const alertsInfo: { [role: string]: { exists: boolean; age: number; dataCount: number } } = {};
    const localStorageKeys = Object.keys(localStorage);
    const alertCacheKeys = localStorageKeys.filter(key => key.startsWith('alerts_cache_'));
    
    alertCacheKeys.forEach(key => {
      const role = key.replace('alerts_cache_', '');
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          alertsInfo[role] = {
            exists: true,
            age: age,
            dataCount: parsed.data?.length || 0
          };
        } else {
          alertsInfo[role] = { exists: false, age: 0, dataCount: 0 };
        }
      } catch (error) {
        alertsInfo[role] = { exists: false, age: 0, dataCount: 0 };
      }
    });
    
    // Get beneficiaries cache info for all roles
    const beneficiariesInfo: { [role: string]: { exists: boolean; age: number; dataCount: number } } = {};
    const beneficiaryKeys = localStorageKeys.filter(key => key.startsWith('beneficiaries_'));
    
    beneficiaryKeys.forEach(key => {
      const role = key.replace('beneficiaries_', '');
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          beneficiariesInfo[role] = {
            exists: true,
            age: age,
            dataCount: parsed.data?.length || 0
          };
        } else {
          beneficiariesInfo[role] = { exists: false, age: 0, dataCount: 0 };
        }
      } catch (error) {
        beneficiariesInfo[role] = { exists: false, age: 0, dataCount: 0 };
      }
    });
    
    const legalInfo = legalAssistanceAPI.getCacheInfo();
    
    // Get resource suggestions cache info for all roles
    const resourceSuggestionsInfo: { [role: string]: { exists: boolean; age: number; dataCount: number } } = {};
    const resourceKeys = localStorageKeys.filter(key => key.startsWith('resource_suggestions_'));
    
    resourceKeys.forEach(key => {
      const role = key.replace('resource_suggestions_', '');
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          resourceSuggestionsInfo[role] = {
            exists: true,
            age: age,
            dataCount: Object.keys(parsed.data || {}).length
          };
        } else {
          resourceSuggestionsInfo[role] = { exists: false, age: 0, dataCount: 0 };
        }
      } catch (error) {
        resourceSuggestionsInfo[role] = { exists: false, age: 0, dataCount: 0 };
      }
    });
    
    // Get scheme eligibility cache info for all roles
    const schemeEligibilityInfo: { [role: string]: { exists: boolean; age: number; dataCount: number } } = {};
    const schemeKeys = localStorageKeys.filter(key => key.startsWith('scheme_eligibility_'));
    
    schemeKeys.forEach(key => {
      const role = key.replace('scheme_eligibility_', '');
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          schemeEligibilityInfo[role] = {
            exists: true,
            age: age,
            dataCount: parsed.data?.length || 0
          };
        } else {
          schemeEligibilityInfo[role] = { exists: false, age: 0, dataCount: 0 };
        }
      } catch (error) {
        schemeEligibilityInfo[role] = { exists: false, age: 0, dataCount: 0 };
      }
    });
    
    // Calculate total cache size
    let totalSize = 0;
    localStorageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });
    
    return {
      alerts: alertsInfo,
      beneficiaries: beneficiariesInfo,
      legalAssistance: legalInfo,
      schemeEligibility: schemeEligibilityInfo,
      resourceSuggestions: resourceSuggestionsInfo,
      totalSize: totalSize
    };
  },

  // Clear expired caches
  clearExpiredCaches: (): void => {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => 
      key.startsWith('alerts_cache_') ||
      key.startsWith('beneficiaries_') ||
      key.startsWith('legal_assistance_') ||
      key.startsWith('scheme_eligibility_')
    );
    
    let clearedCount = 0;
    const now = Date.now();
    
    appKeys.forEach(key => {
      try {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cacheAge = now - parsed.timestamp;
          
          // Different expiration times for different cache types
          let maxAge = 30 * 60 * 1000; // 30 minutes default
          if (key.startsWith('alerts_cache_')) {
            maxAge = 5 * 60 * 1000; // 5 minutes for alerts
          } else if (key.startsWith('legal_assistance_')) {
            maxAge = 60 * 60 * 1000; // 1 hour for legal assistance
          } else if (key.startsWith('scheme_eligibility_')) {
            maxAge = 30 * 60 * 1000; // 30 minutes for scheme eligibility
          }
          
          if (cacheAge > maxAge) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      } catch (error) {
        // If parsing fails, remove the corrupted cache
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} expired caches`);
  },

  // Force refresh all caches
  forceRefreshAll: async (): Promise<void> => {
    console.log('Force refreshing all caches...');
    
    // Clear all caches first
    cacheManager.clearAllCaches();
    
    // The next API calls will automatically fetch fresh data
    console.log('All caches cleared. Fresh data will be fetched on next API call.');
  }
};

export const schemeEligibilityAPI = {
  getSchemeEligibility: async (role: string, forceRefresh: boolean = false): Promise<BeneficiarySchemeEligibility[]> => {
    const cacheKey = `scheme_eligibility_${role}`;
    const maxCacheAge = 30 * 60 * 1000; // 30 minutes cache
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading scheme eligibility from cache for role: ${role} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('Scheme eligibility cache expired, fetching fresh data');
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error('Error parsing cached scheme eligibility data:', error);
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      console.log(`Fetching scheme eligibility for role: ${role}`);
      
      const response = await axios.get('http://127.0.0.1:8000/get-scheme-eligibility', {
        params: {
          role: role
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Scheme eligibility API response:', response.data);
      
      // Cache the results
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        role: role
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached scheme eligibility data for role: ${role} for ${maxCacheAge / 1000 / 60} minutes`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching scheme eligibility:', error);
      
      // Try to load from cache if API fails
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`API failed, loading scheme eligibility from cache as fallback for role: ${role}`);
          return parsed.data;
        }
      } catch (cacheError) {
        console.error('Error loading scheme eligibility from cache fallback:', cacheError);
      }
      
      // If API call fails and no valid cache, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the scheme eligibility service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  // Group scheme eligibility data by scheme name
  groupByScheme: (data: BeneficiarySchemeEligibility[]): SchemeEligibilityGroup[] => {
    const schemeMap = new Map<string, SchemeEligibilityGroup>();
    
    data.forEach(beneficiary => {
      beneficiary.schemes_eligibility.forEach(scheme => {
        if (!schemeMap.has(scheme.scheme_name)) {
          schemeMap.set(scheme.scheme_name, {
            scheme_name: scheme.scheme_name,
            eligible_beneficiaries: [],
            ineligible_beneficiaries: []
          });
        }
        
        const schemeGroup = schemeMap.get(scheme.scheme_name)!;
        
        if (scheme.eligibility) {
          schemeGroup.eligible_beneficiaries.push(scheme.beneficiary_id);
        } else {
          schemeGroup.ineligible_beneficiaries.push({
            beneficiary_id: scheme.beneficiary_id,
            reasons: scheme.reasons
          });
        }
      });
    });
    
    return Array.from(schemeMap.values());
  },

  // Get statistics for scheme eligibility
  getEligibilityStats: (data: BeneficiarySchemeEligibility[]): {
    totalBeneficiaries: number;
    totalSchemes: number;
    overallEligibilityRate: number;
    schemeStats: { [schemeName: string]: { eligible: number; ineligible: number; rate: number } };
  } => {
    const schemeStats: { [schemeName: string]: { eligible: number; ineligible: number; rate: number } } = {};
    const schemeNames = new Set<string>();
    let totalEligible = 0;
    let totalChecks = 0;
    
    data.forEach(beneficiary => {
      beneficiary.schemes_eligibility.forEach(scheme => {
        schemeNames.add(scheme.scheme_name);
        
        if (!schemeStats[scheme.scheme_name]) {
          schemeStats[scheme.scheme_name] = { eligible: 0, ineligible: 0, rate: 0 };
        }
        
        if (scheme.eligibility) {
          schemeStats[scheme.scheme_name].eligible++;
          totalEligible++;
        } else {
          schemeStats[scheme.scheme_name].ineligible++;
        }
        totalChecks++;
      });
    });
    
    // Calculate rates
    Object.keys(schemeStats).forEach(schemeName => {
      const stats = schemeStats[schemeName];
      const total = stats.eligible + stats.ineligible;
      stats.rate = total > 0 ? (stats.eligible / total) * 100 : 0;
    });
    
    return {
      totalBeneficiaries: data.length,
      totalSchemes: schemeNames.size,
      overallEligibilityRate: totalChecks > 0 ? (totalEligible / totalChecks) * 100 : 0,
      schemeStats
    };
  },

  // Cache management utilities
  clearCache: (role?: string): void => {
    if (role) {
      localStorage.removeItem(`scheme_eligibility_${role}`);
      console.log(`Cleared scheme eligibility cache for role: ${role}`);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('scheme_eligibility_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all scheme eligibility caches');
    }
  },

  getCacheInfo: (role?: string): { exists: boolean; age: number; dataCount: number } => {
    const cacheKey = role ? `scheme_eligibility_${role}` : 'scheme_eligibility_all';
    
    if (role) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          return {
            exists: true,
            age: age,
            dataCount: parsed.data?.length || 0
          };
        }
      } catch (error) {
        console.error('Error reading scheme eligibility cache info:', error);
      }
    } else {
      // Get info for all roles
      const keys = Object.keys(localStorage);
      const schemeKeys = keys.filter(key => key.startsWith('scheme_eligibility_'));
      let totalDataCount = 0;
      let hasAnyCache = false;
      let oldestAge = 0;
      
      schemeKeys.forEach(key => {
        try {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            totalDataCount += parsed.data?.length || 0;
            hasAnyCache = true;
            if (age > oldestAge) {
              oldestAge = age;
            }
          }
        } catch (error) {
          console.error('Error reading scheme eligibility cache info:', error);
        }
      });
      
      return {
        exists: hasAnyCache,
        age: oldestAge,
        dataCount: totalDataCount
      };
    }
    
    return { exists: false, age: 0, dataCount: 0 };
  }
};

export const notificationsAPI = {
  notifyEligibleBeneficiaries: async (schemeName: string, role: string): Promise<{ success: boolean; message: string; notifiedCount: number }> => {
    try {
      console.log(`Notifying eligible beneficiaries for scheme: ${schemeName}, role: ${role}`);
      
      const response = await axios.post('http://127.0.0.1:8000/notify-eligible-beneficiaries', {
        scheme_name: schemeName,
        role: role
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Notify beneficiaries API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error notifying eligible beneficiaries:', error);
      
      // If API call fails, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the notification service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }
};

export const resourceSuggestionsAPI = {
  getResourceSuggestions: async (role: string, forceRefresh: boolean = false): Promise<ResourceSuggestionsResponse> => {
    const cacheKey = `resource_suggestions_${role}`;
    const maxCacheAge = 30 * 60 * 1000; // 30 minutes cache
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          
          if (cacheAge < maxCacheAge) {
            console.log(`Loading resource suggestions from cache for role: ${role} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            return parsed.data;
          } else {
            console.log('Resource suggestions cache expired, fetching fresh data');
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error('Error parsing cached resource suggestions data:', error);
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      console.log(`Fetching resource suggestions for role: ${role}`);
      
      const response = await axios.get('http://127.0.0.1:8000/suggest-resources', {
        params: {
          role: role
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Resource suggestions API response:', response.data);
      
      // Cache the results
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        role: role
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached resource suggestions data for role: ${role} for ${maxCacheAge / 1000 / 60} minutes`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching resource suggestions:', error);
      
      // Try to load from cache if API fails
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`API failed, loading resource suggestions from cache as fallback for role: ${role}`);
          return parsed.data;
        }
      } catch (cacheError) {
        console.error('Error loading resource suggestions from cache fallback:', cacheError);
      }
      
      // If API call fails and no valid cache, show user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the resource suggestions service. Please check your internet connection and try again.');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred. Please try again.');
        }
      } else {
        // Non-Axios error
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  // Cache management utilities
  clearCache: (role?: string): void => {
    if (role) {
      localStorage.removeItem(`resource_suggestions_${role}`);
      console.log(`Cleared resource suggestions cache for role: ${role}`);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('resource_suggestions_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all resource suggestions caches');
    }
  },

  getCacheInfo: (role?: string): { exists: boolean; age: number; dataCount: number } => {
    const cacheKey = role ? `resource_suggestions_${role}` : 'resource_suggestions_all';
    
    if (role) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const age = Date.now() - parsed.timestamp;
          return {
            exists: true,
            age: age,
            dataCount: Object.keys(parsed.data || {}).length
          };
        }
      } catch (error) {
        console.error('Error reading resource suggestions cache info:', error);
      }
    } else {
      // Get info for all roles
      const keys = Object.keys(localStorage);
      const resourceKeys = keys.filter(key => key.startsWith('resource_suggestions_'));
      let totalDataCount = 0;
      let hasAnyCache = false;
      let oldestAge = 0;
      
      resourceKeys.forEach(key => {
        try {
          const cachedData = localStorage.getItem(key);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            totalDataCount += Object.keys(parsed.data || {}).length;
            hasAnyCache = true;
            if (age > oldestAge) {
              oldestAge = age;
            }
          }
        } catch (error) {
          console.error('Error reading resource suggestions cache info:', error);
        }
      });
      
      return {
        exists: hasAnyCache,
        age: oldestAge,
        dataCount: totalDataCount
      };
    }
    
    return { exists: false, age: 0, dataCount: 0 };
  }
};