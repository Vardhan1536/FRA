export interface User {
  role: 'GramaSabha' | 'SDLC' | 'DLC';
  village: string;
  district?: string; // Required for SDLC role
  language: string;
  uid: string;
  email: string;
  displayName: string;
}

export interface Claim {
  id: string;
  village: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  coordinates: [number, number];
  area: number;
  evidence: string[];
  submissionDate: Date;
  applicantName: string;
  claimType: 'IFR' | 'CR' | 'CFR';
  rejectionReason?: string;
  reason?: string; // For SDLC approval/rejection reasons
  qrCode?: string;
  dssValidation?: boolean; // DSS validation status
  dssSuggestion?: string; // DSS recommendation
  reviewedBy?: string; // SDLC reviewer
  reviewedAt?: Date; // Review timestamp
}

export interface Layer {
  name: string;
  color: string;
  data: any;
  visible: boolean;
  type: 'potential' | 'granted' | 'pending' | 'rejected' | 'encroachment' | 'scheme' | 'demographic';
}

export interface Alert {
  id: string;
  type: 'encroachment' | 'deforestation' | 'claim_update' | 'system' | 'dss_flag' | 'urgent_review' | 'anomaly';
  location: string;
  coordinates: [number, number];
  timestamp: Date;
  description: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  comments?: string; // Optional comments when acknowledging
}

export interface DashboardStats {
  totalClaims: number;
  approvedPattas: number;
  pendingClaims: number;
  rejectedClaims: number;
  totalArea: number;
  activeAlerts: number;
}

export interface MapFilter {
  state: string;
  district: string;
  village: string;
  tribalGroup: string;
}

// SDLC-specific interfaces
export interface DSSValidation {
  claimId: string;
  isValid: boolean;
  confidence: number; // 0-100
  suggestions: string[];
  riskFactors: string[];
  recommendedAction: 'approve' | 'reject' | 'review';
  timestamp: Date;
}

export interface ClaimReview {
  claimId: string;
  reviewerId: string;
  action: 'approve' | 'reject';
  reason: string;
  dssValidation: DSSValidation;
  timestamp: Date;
}

export interface SDLCDashboardStats {
  totalClaims: number;
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  dssFlagged: number;
  urgentAlerts: number;
  schemeEligibility: {
    eligible: number;
    ineligible: number;
    pending: number;
  };
}