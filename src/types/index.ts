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
  beneficiary_id?: string;
  title_id?: string;
  village: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  coordinates: [number, number];
  area: number;
  evidence: string[];
  uploadedFiles?: UploadedFile[];
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
  
  // Personal Information
  personal_info?: {
    first_name: string;
    last_name: string;
    gender: string;
    tribal_community: string;
    aadhaar: string;
    income: number;
  };
  
  // Title Information
  title_info?: {
    right_type: string;
    status: string;
    claim_area_hectares: number;
    polygon_coordinates: number[][][];
  };
  
  // Administrative Information
  admin_info?: {
    village_id?: string;
    village: string;
    gp: string;
    block: string;
    district: string;
    state: string;
    forest_area_hectares: number;
    block_id?: string;
    gp_id?: string;
  };
  
  // Asset Summary
  asset_summary?: {
    total_area_hectares: number;
    asset_types: string[];
    assets_count: number;
  };
  
  // Vulnerability Assessment
  vulnerability?: {
    score: number;
    category: string | null;
  };

  // Status tracking for different levels
  statuses?: {
    gramasabha: 'Pending' | 'Approved' | 'Rejected';
    sdlc?: {
      review: boolean;
      remarks: string[];
    };
    dlc?: any;
  };
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
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
  type: 'encroachment' | 'deforestation' | 'claim_update' | 'system' | 'dss_flag' | 'urgent_review' | 'anomaly' | 'change_detection' | 'fraudulent_claims';
  location: string;
  coordinates: [number, number];
  timestamp: Date;
  description: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  comments?: string; // Optional comments when acknowledging
  changeDetection?: ChangeDetection; // Optional change detection data
}

export interface ChangeDetection {
  change_id: string;
  change_type: 'Reforestation' | 'Deforestation' | 'Water_Level_Change' | 'No_Change' | 'Encroachment' | 'Forest_Fire' | 'Land_Use_Change';
  detection_date: string;
  area_change_hectares: number;
  confidence_score: number;
  beneficiary_id: string;
  asset_id: string;
  title_id: string;
  village_id: string;
  village_name: string;
  gp_name: string;
  block_name: string;
  district: string;
  state: string;
  coordinates: number[][][];
  risk_category: 'Low' | 'Medium' | 'High';
  description: string;
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

// DLC-specific interfaces
export interface Scheme {
  id: string;
  name: string;
  type: 'New' | 'Old';
  eligibilityCriteria: string[];
  nonEligibilityCriteria: string[];
  historicalBeneficiaries: number;
  allocatedRegions: string[];
  description: string;
  startDate: Date;
  endDate?: Date;
  budget: number;
  status: 'Active' | 'Inactive' | 'Completed';
}

export interface DLCDashboardStats {
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  pendingClaims: number;
  escalatedClaims: number;
  districtAlerts: number;
  schemeCoverage: {
    totalSchemes: number;
    activeSchemes: number;
    beneficiaries: number;
    coveragePercentage: number;
  };
  regionalBreakdown: {
    village: string;
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    pendingClaims: number;
  }[];
}

export interface ClaimEscalation {
  claimId: string;
  escalatedBy: string; // SDLC officer
  escalatedAt: Date;
  reason: string;
  sdlcDecision: 'Approved' | 'Rejected';
  sdlcReason: string;
  dssValidation: DSSValidation;
  supportingDocuments: string[];
}

export interface DLCCaimReview {
  claimId: string;
  reviewerId: string;
  action: 'approve' | 'reject';
  reason: string;
  escalationData: ClaimEscalation;
  timestamp: Date;
  finalDecision: boolean; // Only DLC can make final decisions
}

// New claim submission interface
export interface NewClaimSubmission {
  beneficiary_id: string;
  title_id: string;
  personal_info: {
    first_name: string;
    last_name: string;
    gender: string;
    tribal_community: string;
    aadhaar: string;
    income: number;
  };
  title_info: {
    right_type: string;
    status: string;
    claim_area_hectares: number;
    polygon_coordinates: number[][][];
  };
  admin_info: {
    village_id: string;
    village: string;
    gp: string;
    block: string;
    district: string;
    state: string;
    forest_area_hectares: number;
    block_id: string;
    gp_id: string;
  };
  asset_summary: {
    total_area_hectares: number;
    asset_types: string[];
    assets_count: number;
  };
  vulnerability: {
    score: number;
    category: string | null;
  };
  statuses: {
    gramasabha: 'Pending' | 'Approved' | 'Rejected';
    sdlc?: {
      review: boolean;
      remarks: string[];
    };
    dlc?: any;
  };
}