import axios from 'axios';
import { Claim, Alert, DashboardStats, DSSValidation, ClaimReview, SDLCDashboardStats } from '../types';

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
  submit: async (claimData: FormData): Promise<Claim> => {
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
  
  getAll: async (): Promise<Claim[]> => {
    // Mock data
    return [
      {
        id: 'claim-1',
        village: 'Demo Village',
        status: 'Approved',
        coordinates: [22.9734, 78.6569],
        area: 45.2,
        evidence: ['doc1.pdf', 'photo1.jpg'],
        submissionDate: new Date('2024-01-15'),
        applicantName: 'Ram Singh',
        claimType: 'IFR',
        qrCode: 'QR-001'
      },
      {
        id: 'claim-2',
        village: 'Demo Village',
        status: 'Pending',
        coordinates: [22.9834, 78.6669],
        area: 32.8,
        evidence: ['doc2.pdf', 'photo2.jpg'],
        submissionDate: new Date('2024-01-20'),
        applicantName: 'Sita Devi',
        claimType: 'CR',
        qrCode: 'QR-002'
      }
    ];
  }
};

export const alertsAPI = {
  getAll: async (): Promise<Alert[]> => {
    return [
      {
        id: 'alert-1',
        type: 'encroachment',
        location: 'Sector 7, Demo Village',
        coordinates: [22.9734, 78.6569],
        timestamp: new Date(),
        description: 'Unauthorized construction detected in forest area',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'alert-2',
        type: 'claim_update',
        location: 'Demo Village Office',
        coordinates: [22.9734, 78.6569],
        timestamp: new Date(Date.now() - 86400000),
        description: 'New claim approved for IFR-001',
        resolved: true,
        severity: 'medium'
      }
    ];
  },
  
  acknowledge: async (alertId: string): Promise<void> => {
    console.log(`Acknowledging alert ${alertId}`);
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
        id: 'claim-sdlc-1',
        village: 'Village A',
        status: 'Pending',
        coordinates: [22.9734, 78.6569],
        area: 45.2,
        evidence: ['doc1.pdf', 'photo1.jpg', 'audio1.mp3'],
        submissionDate: new Date('2024-01-15'),
        applicantName: 'Ram Singh',
        claimType: 'IFR',
        qrCode: 'QR-SDLC-001',
        dssValidation: true,
        dssSuggestion: 'High confidence - recommend approval',
        reviewedBy: undefined,
        reviewedAt: undefined
      },
      {
        id: 'claim-sdlc-2',
        village: 'Village B',
        status: 'Pending',
        coordinates: [22.9834, 78.6669],
        area: 32.8,
        evidence: ['doc2.pdf', 'photo2.jpg'],
        submissionDate: new Date('2024-01-20'),
        applicantName: 'Sita Devi',
        claimType: 'CR',
        qrCode: 'QR-SDLC-002',
        dssValidation: false,
        dssSuggestion: 'Risk factors detected - requires manual review',
        reviewedBy: undefined,
        reviewedAt: undefined
      },
      {
        id: 'claim-sdlc-3',
        village: 'Village C',
        status: 'Pending',
        coordinates: [22.9934, 78.6769],
        area: 28.5,
        evidence: ['doc3.pdf', 'photo3.jpg', 'video1.mp4'],
        submissionDate: new Date('2024-01-22'),
        applicantName: 'Gopal Yadav',
        claimType: 'CFR',
        qrCode: 'QR-SDLC-003',
        dssValidation: true,
        dssSuggestion: 'Medium confidence - verify coordinates',
        reviewedBy: undefined,
        reviewedAt: undefined
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