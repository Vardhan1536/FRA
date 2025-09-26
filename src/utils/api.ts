import axios from 'axios';
import { Claim, Alert, DashboardStats, DSSValidation, ClaimReview, SDLCDashboardStats, Scheme, DLCDashboardStats, ClaimEscalation, DLCCaimReview } from '../types';

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