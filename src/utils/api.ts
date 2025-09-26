import axios from 'axios';
import { Claim, Alert, DashboardStats } from '../types';

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