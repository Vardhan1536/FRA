import axios from 'axios';
import { Claim, Alert, DashboardStats, DSSValidation, ClaimReview, SDLCDashboardStats, Scheme, DLCDashboardStats, ClaimEscalation, DLCCaimReview, ChangeDetection, NewClaimSubmission } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const claimsAPI = {
  submit: async (_claimData: FormData): Promise<Claim> => {
    // Mock implementation - replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockClaim: Claim = {
          id: `claim-${Date.now()}`,
          village: 'Demo Village',
          status: 'Pending',
          coordinates: [22.9734, 78.6569],
          area: Math.floor(Math.random() * 100) + 10,
          evidence: ['document1.pdf', 'photo1.jpg'],
          submissionDate: new Date(),
          applicantName: 'Demo Applicant',
          claimType: 'IFR',
          qrCode: `QR-${Date.now()}`
        };
        resolve(mockClaim);
      }, 1000);
    });
  },

  submitNewClaim: async (claimData: NewClaimSubmission): Promise<Claim> => {
    try {
      // Generate unique IDs
      const beneficiaryId = `FRA_${String(Date.now()).padStart(8, '0')}`;
      const titleId = `FRA_TITLE_${String(Date.now()).padStart(8, '0')}`;
      
      // Update the claim data with generated IDs
      const updatedClaimData = {
        ...claimData,
        beneficiary_id: beneficiaryId,
        title_id: titleId,
        statuses: {
          ...claimData.statuses,
          gramasabha: 'Pending' as const
        }
      };

      console.log('Submitting new claim to API:', updatedClaimData);
      
      // Make actual API call to the backend
      const response = await axios.post('http://127.0.0.1:8000/add-beneficiary', updatedClaimData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('API response:', response.data);

      // Convert API response to Claim format
      const apiResponse = response.data;
      const claim: Claim = {
        id: apiResponse.title_id || titleId,
        beneficiary_id: apiResponse.beneficiary_id || beneficiaryId,
        title_id: apiResponse.title_id || titleId,
        village: apiResponse.admin_info?.village || updatedClaimData.admin_info.village,
        status: 'Pending',
        coordinates: [22.9734, 78.6569], // Default coordinates - could be updated from API response
        area: apiResponse.title_info?.claim_area_hectares || updatedClaimData.title_info.claim_area_hectares,
        evidence: [],
        uploadedFiles: [],
        submissionDate: new Date(),
        applicantName: `${apiResponse.personal_info?.first_name || updatedClaimData.personal_info.first_name} ${apiResponse.personal_info?.last_name || updatedClaimData.personal_info.last_name}`,
        claimType: (apiResponse.title_info?.right_type || updatedClaimData.title_info.right_type) as 'IFR' | 'CR' | 'CFR',
        personal_info: apiResponse.personal_info || updatedClaimData.personal_info,
        title_info: apiResponse.title_info || updatedClaimData.title_info,
        admin_info: apiResponse.admin_info || updatedClaimData.admin_info,
        asset_summary: apiResponse.asset_summary || updatedClaimData.asset_summary,
        vulnerability: apiResponse.vulnerability || updatedClaimData.vulnerability,
        statuses: apiResponse.statuses || updatedClaimData.statuses
      };

      return claim;
    } catch (error) {
      console.error('Error submitting new claim to API:', error);
      
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
        timeout: 30000, // 30 second timeout
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

      return claims;
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      
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
  
  getAll: async (): Promise<Claim[]> => {
    // No mock data - return empty array
    return [];
  }
};

// Helper function to convert change detection data to alerts
const convertChangeDetectionToAlerts = (changeData: ChangeDetection[]): Alert[] => {
  return changeData.map((change) => {
    // Determine severity based on change type and risk category
    let severity: 'low' | 'medium' | 'high' = 'low';
    let alertType: Alert['type'] = 'change_detection';
    
    if (change.change_type === 'Deforestation' || change.change_type === 'Encroachment') {
      severity = change.risk_category === 'High' ? 'high' : change.risk_category === 'Medium' ? 'medium' : 'low';
      alertType = change.change_type === 'Deforestation' ? 'deforestation' : 'encroachment';
    } else if (change.change_type === 'Forest_Fire') {
      severity = 'high';
      alertType = 'urgent_review';
    } else if (change.change_type === 'Reforestation') {
      severity = 'low';
      alertType = 'claim_update';
    }

    // Get center coordinates from polygon
    const centerLat = change.coordinates[0].reduce((sum, coord) => sum + coord[1], 0) / change.coordinates[0].length;
    const centerLng = change.coordinates[0].reduce((sum, coord) => sum + coord[0], 0) / change.coordinates[0].length;

    return {
      id: change.change_id,
      type: alertType,
      location: `${change.village_name}, ${change.district}, ${change.state}`,
      coordinates: [centerLat, centerLng] as [number, number],
      timestamp: new Date(change.detection_date),
      description: change.description,
      resolved: false,
      severity,
      changeDetection: change
    };
  });
};

// Helper function to get stored change detection data from localStorage for a specific role
const getStoredChangeDetectionData = (role: string): ChangeDetection[] => {
  try {
    const key = `changeDetectionData_${role}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Error reading change detection data from localStorage for role ${role}:`, error);
    return [];
  }
};

// Helper function to get user role from localStorage
const getUserRole = (): string => {
  try {
    // First try to get from localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }
    
    // Fallback: try to get from stored user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.role || 'GramaSabha';
    }
    
    // Default fallback
    return 'GramaSabha';
  } catch (error) {
    console.error('Error reading user role from localStorage:', error);
    return 'GramaSabha';
  }
};

// Helper function to store change detection data in localStorage for a specific role
const storeChangeDetectionData = (data: ChangeDetection[], role: string): void => {
  try {
    const key = `changeDetectionData_${role}`;
    const timestampKey = `changeDetectionLastFetch_${role}`;
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(timestampKey, new Date().toISOString());
  } catch (error) {
    console.error(`Error storing change detection data to localStorage for role ${role}:`, error);
  }
};

export const alertsAPI = {
  getAll: async (): Promise<Alert[]> => {
    try {
      // Get user role from localStorage or context
      const userRole = getUserRole();
      console.log(`[${new Date().toISOString()}] Fetching alerts for user role:`, userRole);

      // Check if we have recent data in localStorage for this specific role (less than 1 hour old)
      const lastFetchKey = `changeDetectionLastFetch_${userRole}`;
      const lastFetch = localStorage.getItem(lastFetchKey);
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      let changeDetectionData: ChangeDetection[] = [];

      const callId = Math.random().toString(36).substr(2, 9);
      
      if (!lastFetch || new Date(lastFetch) < oneHourAgo) {
        // Fetch fresh data from API for this specific role
        console.log(`[${callId}] Fetching fresh change detection data from API for role: ${userRole}...`);

        const response = await axios.get('http://127.0.0.1:8000/monitor-changes', {
          params: {
            role: userRole
          }
        });
        console.log(`[${callId}] API response for ${userRole}:`, response.data);
        changeDetectionData = response.data;

        // Store in localStorage for this specific role
        storeChangeDetectionData(changeDetectionData, userRole);
      } else {
        // Use stored data for this specific role
        console.log(`[${callId}] Using cached change detection data from localStorage for role: ${userRole}...`);
        changeDetectionData = getStoredChangeDetectionData(userRole);
      }
      
      // Convert change detection data to alerts
      const changeDetectionAlerts = convertChangeDetectionToAlerts(changeDetectionData);
      
      // Combine with static alerts
      const staticAlerts: Alert[] = [
        {
          id: 'alert-system-1',
          type: 'system',
          location: 'System Status',
          coordinates: [22.9734, 78.6569],
          timestamp: new Date(),
          description: 'System monitoring active - Change detection API connected',
          resolved: false,
          severity: 'low'
        }
      ];
      
      return [...changeDetectionAlerts, ...staticAlerts];
      
    } catch (error) {
      console.error('Error fetching change detection data:', error);

      // Get user role for error handling
      const userRole = getUserRole();
      console.error(`Error fetching change detection data for role ${userRole}:`, error);

      // Fallback to stored data for this specific role if API fails
      const storedData = getStoredChangeDetectionData(userRole);
      if (storedData.length > 0) {
        console.log(`Using fallback stored change detection data for role: ${userRole}...`);
        const fallbackAlerts = convertChangeDetectionToAlerts(storedData);
        return [
          ...fallbackAlerts,
          {
            id: `alert-system-error-${userRole}`,
            type: 'system',
            location: 'System Status',
            coordinates: [22.9734, 78.6569],
            timestamp: new Date(),
            description: `Warning: Unable to fetch latest change detection data for ${userRole}. Showing cached data.`,
            resolved: false,
            severity: 'medium'
          }
        ];
      }
      
      // Final fallback to static alerts
      return [
        {
          id: `alert-system-error-2-${userRole}`,
          type: 'system',
          location: 'System Status',
          coordinates: [22.9734, 78.6569],
          timestamp: new Date(),
          description: `Error: Unable to load change detection data for ${userRole}. Please check API connection.`,
          resolved: false,
          severity: 'high'
        }
      ];
    }
  },
  
  acknowledge: async (alertId: string): Promise<void> => {
    console.log(`Acknowledging alert ${alertId}`);
    
    // Update localStorage to mark alert as acknowledged
    try {
      const stored = localStorage.getItem('acknowledgedAlerts') || '[]';
      const acknowledged = JSON.parse(stored);
      if (!acknowledged.includes(alertId)) {
        acknowledged.push(alertId);
        localStorage.setItem('acknowledgedAlerts', JSON.stringify(acknowledged));
      }
    } catch (error) {
      console.error('Error updating acknowledged alerts:', error);
    }
  },
  
  // New method to refresh change detection data
  refreshChangeDetection: async (): Promise<ChangeDetection[]> => {
    // Get user role from localStorage or context
    const userRole = getUserRole();
    
    try {
      console.log(`Refreshing change detection data for role: ${userRole}`);
      
      const response = await axios.get('http://127.0.0.1:8000/monitor-changes', {
        params: {
          role: userRole
        }
      });
      const data = response.data;
      console.log(`Refreshed data for ${userRole}:`, data);
      
      // Store in localStorage for this specific role
      storeChangeDetectionData(data, userRole);
      return data;
    } catch (error) {
      console.error(`Error refreshing change detection data for role ${userRole}:`, error);
      throw error;
    }
  }
};

export const statsAPI = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return {
      totalClaims: 156,
      approvedPattas: 89,
      pendingClaims: 45,
      rejectedClaims: 22,
      totalArea: 2845.6,
      activeAlerts: 7
    };
  }
};

// SDLC-specific API functions
export const sdlcAPI = {
  getSDLCDashboardStats: async (): Promise<SDLCDashboardStats> => {
    return {
      totalClaims: 234,
      pendingReview: 67,
      approvedToday: 12,
      rejectedToday: 3,
      dssFlagged: 8,
      urgentAlerts: 5,
      schemeEligibility: {
        eligible: 145,
        ineligible: 23,
        pending: 66
      }
    };
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
        suggestions: ['Document verification complete', 'Coordinates match satellite imagery', 'No encroachment detected'],
        riskFactors: [],
        recommendedAction: 'approve',
        timestamp: new Date()
      },
      'claim-sdlc-2': {
        claimId,
        isValid: false,
        confidence: 45,
        suggestions: ['Verify land ownership documents', 'Check for overlapping claims', 'Review boundary coordinates'],
        riskFactors: ['Potential boundary dispute', 'Incomplete documentation', 'Historical claim conflicts'],
        recommendedAction: 'review',
        timestamp: new Date()
      },
      'claim-sdlc-3': {
        claimId,
        isValid: true,
        confidence: 72,
        suggestions: ['Verify GPS coordinates', 'Check forest department records', 'Validate community consent'],
        riskFactors: ['Coordinate accuracy concerns'],
        recommendedAction: 'approve',
        timestamp: new Date()
      }
    };

    return mockValidations[claimId] || {
      claimId,
      isValid: false,
      confidence: 0,
      suggestions: ['Unable to process claim'],
      riskFactors: ['System error'],
      recommendedAction: 'review',
      timestamp: new Date()
    };
  },

  reviewClaim: async (review: ClaimReview): Promise<void> => {
    // Mock API call for claim review
    console.log('Reviewing claim:', review);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  },

  getSDLCAlerts: async (): Promise<Alert[]> => {
    return [
      {
        id: 'alert-sdlc-1',
        type: 'urgent_review',
        location: 'Village A',
        coordinates: [22.9734, 78.6569],
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        description: 'Urgent: High-value claim requires immediate review',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'alert-sdlc-2',
        type: 'dss_flag',
        location: 'Village B',
        coordinates: [22.9834, 78.6669],
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        description: 'DSS flagged potential boundary dispute in claim #SDLC-002',
        resolved: false,
        severity: 'medium'
      },
      {
        id: 'alert-sdlc-3',
        type: 'anomaly',
        location: 'Village C',
        coordinates: [22.9934, 78.6769],
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        description: 'Unusual pattern detected in multiple claims from same area',
        resolved: true,
        severity: 'low',
        acknowledgedBy: 'SDLC User',
        acknowledgedAt: new Date(Date.now() - 43200000) // 12 hours ago
      }
    ];
  },

  acknowledgeAlert: async (alertId: string, comments?: string): Promise<void> => {
    console.log(`Acknowledging alert ${alertId} with comments: ${comments}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },

  exportClaimsToCSV: async (claims: Claim[]): Promise<Blob> => {
    // Mock CSV export
    const csvContent = [
      'ID,Village,Status,Area,Applicant,Type,Submission Date',
      ...claims.map(claim => 
        `${claim.id},${claim.village},${claim.status},${claim.area},${claim.applicantName},${claim.claimType},${claim.submissionDate.toISOString()}`
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }
};

// DLC-specific API functions
export const dlcAPI = {
  getDLCDashboardStats: async (): Promise<DLCDashboardStats> => {
    return {
      totalClaims: 456,
      approvedClaims: 234,
      rejectedClaims: 89,
      pendingClaims: 78,
      escalatedClaims: 55,
      districtAlerts: 12,
      schemeCoverage: {
        totalSchemes: 15,
        activeSchemes: 12,
        beneficiaries: 1245,
        coveragePercentage: 78.5
      },
      regionalBreakdown: [
        { village: 'Village A', totalClaims: 45, approvedClaims: 28, rejectedClaims: 12, pendingClaims: 5 },
        { village: 'Village B', totalClaims: 38, approvedClaims: 22, rejectedClaims: 8, pendingClaims: 8 },
        { village: 'Village C', totalClaims: 52, approvedClaims: 31, rejectedClaims: 15, pendingClaims: 6 },
        { village: 'Village D', totalClaims: 41, approvedClaims: 25, rejectedClaims: 10, pendingClaims: 6 }
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
      sdlcDecision: 'Pending',
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
