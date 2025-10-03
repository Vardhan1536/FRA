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
  
  getAll: async (): Promise<Claim[]> => {
    // Mock data with comprehensive eligibility check agent structure
    return [
      {
        id: 'FRA_TITLE_00000001',
        beneficiary_id: 'FRA_00000001',
        title_id: 'FRA_TITLE_00000001',
        village: 'पाकाला',
        status: 'Approved',
        coordinates: [22.7932, 80.5463],
        area: 1.38,
        evidence: ['land_deed.pdf', 'identity_proof.pdf', 'community_consent.pdf'],
        uploadedFiles: [
          {
            id: 'file-001',
            name: 'Land Deed Document.pdf',
            type: 'application/pdf',
            size: 245760,
            url: '/documents/land_deed.pdf',
            uploadedAt: new Date('2024-01-10')
          },
          {
            id: 'file-002',
            name: 'Identity Proof.jpg',
            type: 'image/jpeg',
            size: 156789,
            url: '/documents/identity_proof.jpg',
            uploadedAt: new Date('2024-01-10')
          },
          {
            id: 'file-003',
            name: 'Community Consent Audio.mp3',
            type: 'audio/mpeg',
            size: 892345,
            url: '/documents/community_consent.mp3',
            uploadedAt: new Date('2024-01-11')
          }
        ],
        submissionDate: new Date('2024-01-15'),
        applicantName: 'आदित्य जैन',
        claimType: 'CR',
        personal_info: {
          first_name: 'आदित्य',
          last_name: 'जैन',
          gender: 'Male',
          tribal_community: 'Baiga',
          aadhaar: '1011-6435-4300',
          income: 43679
        },
        title_info: {
          right_type: 'CR',
          status: 'Approved',
          claim_area_hectares: 1.38,
          polygon_coordinates: [
            [
              [80.54635212060894, 22.79320098273347],
              [80.54602495210914, 22.793732930673524],
              [80.54504098599959, 22.793350670018256],
              [80.54396184629934, 22.793092738078585],
              [80.54531552764372, 22.79101500280458],
              [80.54601006158536, 22.791188448636703],
              [80.54635212060894, 22.79320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'पाकाला',
          gp: 'GP_फतेहपुर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 111.91888777522814
        },
        asset_summary: {
          total_area_hectares: 2.17,
          asset_types: ['Water_Body', 'Forest_Patch'],
          assets_count: 4
        },
        vulnerability: {
          score: 27.404633333333333,
          category: null
        }
      },
      {
        id: 'FRA_TITLE_00000002',
        beneficiary_id: 'FRA_00000002',
        title_id: 'FRA_TITLE_00000002',
        village: 'चिरमिरी',
        status: 'Pending',
        coordinates: [22.7834, 80.5363],
        area: 2.45,
        evidence: ['forest_rights_application.pdf', 'ancestral_proof.pdf', 'village_map.pdf'],
        uploadedFiles: [
          {
            id: 'file-004',
            name: 'Forest Rights Application.pdf',
            type: 'application/pdf',
            size: 345678,
            url: '/documents/forest_rights_application.pdf',
            uploadedAt: new Date('2024-01-18')
          },
          {
            id: 'file-005',
            name: 'Ancestral Proof Document.pdf',
            type: 'application/pdf',
            size: 234567,
            url: '/documents/ancestral_proof.pdf',
            uploadedAt: new Date('2024-01-18')
          },
          {
            id: 'file-006',
            name: 'Village Map.jpg',
            type: 'image/jpeg',
            size: 567890,
            url: '/documents/village_map.jpg',
            uploadedAt: new Date('2024-01-19')
          }
        ],
        submissionDate: new Date('2024-01-20'),
        applicantName: 'सीता देवी',
        claimType: 'IFR',
        personal_info: {
          first_name: 'सीता',
          last_name: 'देवी',
          gender: 'Female',
          tribal_community: 'Gond',
          aadhaar: '1011-6435-4301',
          income: 38945
        },
        title_info: {
          right_type: 'IFR',
          status: 'Pending',
          claim_area_hectares: 2.45,
          polygon_coordinates: [
            [
              [80.53635212060894, 22.78320098273347],
              [80.53602495210914, 22.783732930673524],
              [80.53504098599959, 22.783350670018256],
              [80.53396184629934, 22.783092738078585],
              [80.53531552764372, 22.78101500280458],
              [80.53601006158536, 22.781188448636703],
              [80.53635212060894, 22.78320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'चिरमिरी',
          gp: 'GP_चिरमिरी',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 98.65432109876543
        },
        asset_summary: {
          total_area_hectares: 2.45,
          asset_types: ['Forest_Patch', 'Agricultural_Land'],
          assets_count: 3
        },
        vulnerability: {
          score: 34.567890123456789,
          category: 'Medium Risk'
        }
      },
      {
        id: 'FRA_TITLE_00000003',
        beneficiary_id: 'FRA_00000003',
        title_id: 'FRA_TITLE_00000003',
        village: 'बैजनाथपुर',
        status: 'Rejected',
        coordinates: [22.7734, 80.5263],
        area: 1.85,
        evidence: ['community_forest_rights.pdf', 'traditional_knowledge.pdf'],
        uploadedFiles: [
          {
            id: 'file-007',
            name: 'Community Forest Rights.pdf',
            type: 'application/pdf',
            size: 456789,
            url: '/documents/community_forest_rights.pdf',
            uploadedAt: new Date('2024-01-22')
          },
          {
            id: 'file-008',
            name: 'Traditional Knowledge Documentation.pdf',
            type: 'application/pdf',
            size: 678901,
            url: '/documents/traditional_knowledge.pdf',
            uploadedAt: new Date('2024-01-22')
          }
        ],
        submissionDate: new Date('2024-01-25'),
        applicantName: 'गोपाल यादव',
        claimType: 'CFR',
        rejectionReason: 'Insufficient documentation for community forest rights claim. Missing community consent and boundary verification documents.',
        personal_info: {
          first_name: 'गोपाल',
          last_name: 'यादव',
          gender: 'Male',
          tribal_community: 'Kol',
          aadhaar: '1011-6435-4302',
          income: 52341
        },
        title_info: {
          right_type: 'CFR',
          status: 'Rejected',
          claim_area_hectares: 1.85,
          polygon_coordinates: [
            [
              [80.52635212060894, 22.77320098273347],
              [80.52602495210914, 22.773732930673524],
              [80.52504098599959, 22.773350670018256],
              [80.52396184629934, 22.773092738078585],
              [80.52531552764372, 22.77101500280458],
              [80.52601006158536, 22.771188448636703],
              [80.52635212060894, 22.77320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'बैजनाथपुर',
          gp: 'GP_बैजनाथपुर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 76.54321098765432
        },
        asset_summary: {
          total_area_hectares: 1.85,
          asset_types: ['Community_Forest', 'Water_Source'],
          assets_count: 2
        },
        vulnerability: {
          score: 42.123456789012345,
          category: 'High Risk'
        }
      }
    ];
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
    // Mock data for claims requiring SDLC review
    return [
      {
        id: 'FRA_TITLE_00000004',
        beneficiary_id: 'FRA_00000004',
        title_id: 'FRA_TITLE_00000004',
        village: 'फतेहपुर',
        status: 'Pending',
        coordinates: [22.7634, 80.5163],
        area: 3.25,
        evidence: ['forest_rights_application.pdf', 'satellite_image.jpg', 'community_audio.mp3'],
        uploadedFiles: [
          {
            id: 'file-009',
            name: 'Forest Rights Application.pdf',
            type: 'application/pdf',
            size: 567890,
            url: '/documents/forest_rights_application_sdlc.pdf',
            uploadedAt: new Date('2024-01-28')
          },
          {
            id: 'file-010',
            name: 'Satellite Image.jpg',
            type: 'image/jpeg',
            size: 1234567,
            url: '/documents/satellite_image.jpg',
            uploadedAt: new Date('2024-01-28')
          },
          {
            id: 'file-011',
            name: 'Community Consent Audio.mp3',
            type: 'audio/mpeg',
            size: 1123456,
            url: '/documents/community_audio.mp3',
            uploadedAt: new Date('2024-01-29')
          }
        ],
        submissionDate: new Date('2024-01-30'),
        applicantName: 'राम सिंह',
        claimType: 'IFR',
        dssValidation: true,
        dssSuggestion: 'High confidence - recommend approval',
        reviewedBy: undefined,
        reviewedAt: undefined,
        personal_info: {
          first_name: 'राम',
          last_name: 'सिंह',
          gender: 'Male',
          tribal_community: 'Baiga',
          aadhaar: '1011-6435-4303',
          income: 47892
        },
        title_info: {
          right_type: 'IFR',
          status: 'Pending',
          claim_area_hectares: 3.25,
          polygon_coordinates: [
            [
              [80.51635212060894, 22.76320098273347],
              [80.51602495210914, 22.763732930673524],
              [80.51504098599959, 22.763350670018256],
              [80.51396184629934, 22.763092738078585],
              [80.51531552764372, 22.76101500280458],
              [80.51601006158536, 22.761188448636703],
              [80.51635212060894, 22.76320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'फतेहपुर',
          gp: 'GP_फतेहपुर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 134.56789012345678
        },
        asset_summary: {
          total_area_hectares: 3.25,
          asset_types: ['Forest_Patch', 'Water_Body', 'Agricultural_Land'],
          assets_count: 5
        },
        vulnerability: {
          score: 19.876543210987654,
          category: 'Low Risk'
        }
      },
      {
        id: 'FRA_TITLE_00000005',
        beneficiary_id: 'FRA_00000005',
        title_id: 'FRA_TITLE_00000005',
        village: 'बिरसा नगर',
        status: 'Pending',
        coordinates: [22.7534, 80.5063],
        area: 1.95,
        evidence: ['community_rights.pdf', 'boundary_map.pdf'],
        uploadedFiles: [
          {
            id: 'file-012',
            name: 'Community Rights Document.pdf',
            type: 'application/pdf',
            size: 678901,
            url: '/documents/community_rights.pdf',
            uploadedAt: new Date('2024-02-01')
          },
          {
            id: 'file-013',
            name: 'Boundary Map.jpg',
            type: 'image/jpeg',
            size: 987654,
            url: '/documents/boundary_map.jpg',
            uploadedAt: new Date('2024-02-01')
          }
        ],
        submissionDate: new Date('2024-02-02'),
        applicantName: 'सीता देवी',
        claimType: 'CR',
        dssValidation: false,
        dssSuggestion: 'Risk factors detected - requires manual review',
        reviewedBy: undefined,
        reviewedAt: undefined,
        personal_info: {
          first_name: 'सीता',
          last_name: 'देवी',
          gender: 'Female',
          tribal_community: 'Gond',
          aadhaar: '1011-6435-4304',
          income: 41234
        },
        title_info: {
          right_type: 'CR',
          status: 'Pending',
          claim_area_hectares: 1.95,
          polygon_coordinates: [
            [
              [80.50635212060894, 22.75320098273347],
              [80.50602495210914, 22.753732930673524],
              [80.50504098599959, 22.753350670018256],
              [80.50396184629934, 22.753092738078585],
              [80.50531552764372, 22.75101500280458],
              [80.50601006158536, 22.751188448636703],
              [80.50635212060894, 22.75320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'बिरसा नगर',
          gp: 'GP_बिरसा_नगर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 89.12345678901234
        },
        asset_summary: {
          total_area_hectares: 1.95,
          asset_types: ['Community_Forest', 'Water_Source'],
          assets_count: 3
        },
        vulnerability: {
          score: 52.345678901234567,
          category: 'High Risk'
        }
      },
      {
        id: 'FRA_TITLE_00000006',
        beneficiary_id: 'FRA_00000006',
        title_id: 'FRA_TITLE_00000006',
        village: 'कुंडलपुर',
        status: 'Pending',
        coordinates: [22.7434, 80.4963],
        area: 4.12,
        evidence: ['community_forest_rights.pdf', 'traditional_knowledge.pdf', 'village_consent_video.mp4'],
        uploadedFiles: [
          {
            id: 'file-014',
            name: 'Community Forest Rights.pdf',
            type: 'application/pdf',
            size: 789012,
            url: '/documents/community_forest_rights_sdlc.pdf',
            uploadedAt: new Date('2024-02-05')
          },
          {
            id: 'file-015',
            name: 'Traditional Knowledge Documentation.pdf',
            type: 'application/pdf',
            size: 890123,
            url: '/documents/traditional_knowledge_sdlc.pdf',
            uploadedAt: new Date('2024-02-05')
          },
          {
            id: 'file-016',
            name: 'Village Consent Video.mp4',
            type: 'video/mp4',
            size: 23456789,
            url: '/documents/village_consent_video.mp4',
            uploadedAt: new Date('2024-02-06')
          }
        ],
        submissionDate: new Date('2024-02-07'),
        applicantName: 'गोपाल यादव',
        claimType: 'CFR',
        dssValidation: true,
        dssSuggestion: 'Medium confidence - verify coordinates',
        reviewedBy: undefined,
        reviewedAt: undefined,
        personal_info: {
          first_name: 'गोपाल',
          last_name: 'यादव',
          gender: 'Male',
          tribal_community: 'Kol',
          aadhaar: '1011-6435-4305',
          income: 55678
        },
        title_info: {
          right_type: 'CFR',
          status: 'Pending',
          claim_area_hectares: 4.12,
          polygon_coordinates: [
            [
              [80.49635212060894, 22.74320098273347],
              [80.49602495210914, 22.743732930673524],
              [80.49504098599959, 22.743350670018256],
              [80.49396184629934, 22.743092738078585],
              [80.49531552764372, 22.74101500280458],
              [80.49601006158536, 22.741188448636703],
              [80.49635212060894, 22.74320098273347]
            ]
          ]
        },
        admin_info: {
          village: 'कुंडलपुर',
          gp: 'GP_कुंडलपुर',
          block: 'Mandla',
          district: 'Mandla',
          state: 'Madhya Pradesh',
          forest_area_hectares: 156.78901234567890
        },
        asset_summary: {
          total_area_hectares: 4.12,
          asset_types: ['Community_Forest', 'Water_Body', 'Traditional_Medicinal_Plants'],
          assets_count: 6
        },
        vulnerability: {
          score: 28.901234567890123,
          category: null
        }
      }
    ];
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
    // Mock data for claims escalated by SDLC to DLC for final decision
    return [
      {
        id: 'claim-dlc-1',
        village: 'Village A',
        status: 'Pending',
        coordinates: [22.9734, 78.6569],
        area: 45.2,
        evidence: ['doc1.pdf', 'photo1.jpg', 'audio1.mp3'],
        submissionDate: new Date('2024-01-15'),
        applicantName: 'Ram Singh',
        claimType: 'IFR',
        qrCode: 'QR-DLC-001',
        dssValidation: true,
        dssSuggestion: 'High confidence - recommend approval',
        reviewedBy: 'SDLC Officer',
        reviewedAt: new Date('2024-01-20'),
        reason: 'Escalated for final approval - high-value claim'
      },
      {
        id: 'claim-dlc-2',
        village: 'Village B',
        status: 'Pending',
        coordinates: [22.9834, 78.6669],
        area: 32.8,
        evidence: ['doc2.pdf', 'photo2.jpg'],
        submissionDate: new Date('2024-01-20'),
        applicantName: 'Sita Devi',
        claimType: 'CR',
        qrCode: 'QR-DLC-002',
        dssValidation: false,
        dssSuggestion: 'Risk factors detected - requires manual review',
        reviewedBy: 'SDLC Officer',
        reviewedAt: new Date('2024-01-22'),
        reason: 'Escalated for final decision - boundary dispute'
      },
      {
        id: 'claim-dlc-3',
        village: 'Village C',
        status: 'Pending',
        coordinates: [22.9934, 78.6769],
        area: 28.5,
        evidence: ['doc3.pdf', 'photo3.jpg', 'video1.mp4'],
        submissionDate: new Date('2024-01-22'),
        applicantName: 'Gopal Yadav',
        claimType: 'CFR',
        qrCode: 'QR-DLC-003',
        dssValidation: true,
        dssSuggestion: 'Medium confidence - verify coordinates',
        reviewedBy: 'SDLC Officer',
        reviewedAt: new Date('2024-01-25'),
        reason: 'Escalated for final approval - community forest rights'
      }
    ];
  },

  getClaimEscalationDetails: async (claimId: string): Promise<ClaimEscalation> => {
    // Mock escalation details
    const mockEscalations: { [key: string]: ClaimEscalation } = {
      'claim-dlc-1': {
        claimId,
        escalatedBy: 'SDLC Officer John Doe',
        escalatedAt: new Date('2024-01-20'),
        reason: 'High-value claim requiring district-level approval',
        sdlcDecision: 'Approved',
        sdlcReason: 'All documentation verified, DSS validation positive',
        dssValidation: {
          claimId,
          isValid: true,
          confidence: 85,
          suggestions: ['Document verification complete', 'Coordinates match satellite imagery'],
          riskFactors: [],
          recommendedAction: 'approve',
          timestamp: new Date()
        },
        supportingDocuments: ['land_deed.pdf', 'satellite_image.jpg', 'community_consent.pdf']
      },
      'claim-dlc-2': {
        claimId,
        escalatedBy: 'SDLC Officer Jane Smith',
        escalatedAt: new Date('2024-01-22'),
        reason: 'Boundary dispute requires district-level resolution',
        sdlcDecision: 'Approved',
        sdlcReason: 'SDLC recommends approval pending DLC final decision',
        dssValidation: {
          claimId,
          isValid: false,
          confidence: 45,
          suggestions: ['Verify land ownership documents', 'Check for overlapping claims'],
          riskFactors: ['Potential boundary dispute', 'Incomplete documentation'],
          recommendedAction: 'review',
          timestamp: new Date()
        },
        supportingDocuments: ['boundary_map.pdf', 'dispute_resolution.pdf']
      },
      'claim-dlc-3': {
        claimId,
        escalatedBy: 'SDLC Officer Mike Johnson',
        escalatedAt: new Date('2024-01-25'),
        reason: 'Community forest rights claim requiring district approval',
        sdlcDecision: 'Approved',
        sdlcReason: 'Community consent verified, DSS validation positive',
        dssValidation: {
          claimId,
          isValid: true,
          confidence: 72,
          suggestions: ['Verify GPS coordinates', 'Check forest department records'],
          riskFactors: ['Coordinate accuracy concerns'],
          recommendedAction: 'approve',
          timestamp: new Date()
        },
        supportingDocuments: ['community_consent.pdf', 'forest_dept_clearance.pdf']
      }
    };

    return mockEscalations[claimId] || {
      claimId,
      escalatedBy: 'Unknown',
      escalatedAt: new Date(),
      reason: 'No escalation data available',
      sdlcDecision: 'Approved',
      sdlcReason: 'No reason provided',
      dssValidation: {
        claimId,
        isValid: false,
        confidence: 0,
        suggestions: ['Unable to process claim'],
        riskFactors: ['System error'],
        recommendedAction: 'review',
        timestamp: new Date()
      },
      supportingDocuments: []
    };
  },

  finalizeClaimDecision: async (review: DLCCaimReview): Promise<void> => {
    // Mock API call for final claim decision
    console.log('Finalizing claim decision:', review);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  },

  getSchemes: async (): Promise<Scheme[]> => {
    return [
      {
        id: 'scheme-1',
        name: 'Forest Rights Recognition Scheme',
        type: 'New',
        eligibilityCriteria: [
          'Traditional forest dwellers',
          'Residing in forest area for 75+ years',
          'Community forest rights',
          'Individual forest rights'
        ],
        nonEligibilityCriteria: [
          'Non-forest dwellers',
          'Commercial entities',
          'Government employees',
          'Land already under government control'
        ],
        historicalBeneficiaries: 245,
        allocatedRegions: ['Village A', 'Village B', 'Village C'],
        description: 'Comprehensive scheme for recognizing forest rights of traditional dwellers',
        startDate: new Date('2024-01-01'),
        budget: 5000000,
        status: 'Active'
      },
      {
        id: 'scheme-2',
        name: 'Community Forest Management',
        type: 'Old',
        eligibilityCriteria: [
          'Forest-dependent communities',
          'Traditional knowledge holders',
          'Community-based organizations',
          'Sustainable forest management practices'
        ],
        nonEligibilityCriteria: [
          'Individual commercial interests',
          'Non-forest dependent communities',
          'Government agencies',
          'Private companies'
        ],
        historicalBeneficiaries: 189,
        allocatedRegions: ['Village A', 'Village D'],
        description: 'Long-standing scheme for community-based forest management',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 3000000,
        status: 'Active'
      },
      {
        id: 'scheme-3',
        name: 'Tribal Development Initiative',
        type: 'New',
        eligibilityCriteria: [
          'Scheduled tribes',
          'Traditional forest dwellers',
          'Marginalized communities',
          'Women-headed households'
        ],
        nonEligibilityCriteria: [
          'Non-tribal communities',
          'Urban residents',
          'Government employees',
          'Commercial entities'
        ],
        historicalBeneficiaries: 156,
        allocatedRegions: ['Village B', 'Village C', 'Village D'],
        description: 'New initiative for tribal development and forest rights',
        startDate: new Date('2024-06-01'),
        budget: 7500000,
        status: 'Active'
      }
    ];
  },

  getDLCAerts: async (): Promise<Alert[]> => {
    return [
      {
        id: 'alert-dlc-1',
        type: 'urgent_review',
        location: 'District Level',
        coordinates: [22.9734, 78.6569],
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        description: 'Urgent: High-value claim requires immediate DLC review',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'alert-dlc-2',
        type: 'deforestation',
        location: 'Village A',
        coordinates: [22.9834, 78.6669],
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        description: 'Deforestation alert: Unauthorized tree cutting detected',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'alert-dlc-3',
        type: 'fraudulent_claims',
        location: 'Village B',
        coordinates: [22.9934, 78.6769],
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        description: 'DSS flagged potential fraudulent claims in Village B',
        resolved: false,
        severity: 'medium'
      },
      {
        id: 'alert-dlc-4',
        type: 'system',
        location: 'District Office',
        coordinates: [22.9734, 78.6569],
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        description: 'System maintenance scheduled for tonight',
        resolved: true,
        severity: 'low',
        acknowledgedBy: 'DLC Officer',
        acknowledgedAt: new Date(Date.now() - 43200000) // 12 hours ago
      }
    ];
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