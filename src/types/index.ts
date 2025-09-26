export interface User {
  role: 'GramaSabha' | 'SDLC' | 'DLC';
  village: string;
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
  qrCode?: string;
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
  type: 'encroachment' | 'deforestation' | 'claim_update' | 'system';
  location: string;
  coordinates: [number, number];
  timestamp: Date;
  description: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high';
  acknowledgedBy?: string;
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