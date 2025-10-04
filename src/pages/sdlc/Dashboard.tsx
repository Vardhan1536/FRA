import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  Download,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatCard from '../../components/UI/StatCard';
import ClaimCard from '../../components/SDLC/ClaimCard';
import ClaimReviewModal from '../../components/SDLC/ClaimReviewModal';
import { sdlcAPI } from '../../utils/api';
import { Claim, SDLCDashboardStats } from '../../types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SDLCDashboardStats>({
    totalClaims: 0,
    pendingReview: 0,
    approvedToday: 0,
    rejectedToday: 0,
    dssFlagged: 0,
    urgentAlerts: 0,
    schemeEligibility: { eligible: 0, ineligible: 0, pending: 0 }
  });
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, claimsData] = await Promise.all([
        sdlcAPI.getSDLCDashboardStats(),
        sdlcAPI.getClaimsForReview()
      ]);
      setStats(statsData);
      setClaims(claimsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReview = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (claimId: string, action: 'approve' | 'reject', reason: string) => {
    try {
      await sdlcAPI.reviewClaim({
        claimId,
        reviewerId: 'current-user',
        action,
        reason,
        dssValidation: {} as any, // This would be populated from the modal
        timestamp: new Date()
      });
      
      // Update local state
      setClaims(prev => prev.map(claim => 
        claim.id === claimId 
          ? { 
              ...claim, 
              status: action === 'approve' ? 'Approved' : 'Rejected',
              reason,
              reviewedBy: 'Current User',
              reviewedAt: new Date()
            }
          : claim
      ));
      
      // Refresh stats
      loadDashboardData();
    } catch (error) {
      console.error('Failed to review claim:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await sdlcAPI.exportClaimsToCSV(claims);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sdlc-claims.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status.toLowerCase() === statusFilter;
    const matchesVillage = villageFilter === 'all' || claim.village === villageFilter;
    
    return matchesSearch && matchesStatus && matchesVillage;
  });

  const barChartData = {
    labels: [t('pending_review'), t('approved_today'), t('rejected_today'), t('dss_flagged')],
    datasets: [
      {
        label: 'Claims Status',
        data: [
          stats.pendingReview,
          stats.approvedToday,
          stats.rejectedToday,
          stats.dssFlagged
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  const pieChartData = {
    labels: [t('eligible'), t('ineligible'), t('pending')],
    datasets: [
      {
        data: [
          stats.schemeEligibility.eligible,
          stats.schemeEligibility.ineligible,
          stats.schemeEligibility.pending
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const MapComponent = () => {
    const map = useMap();
    
    useEffect(() => {
      if (claims.length > 0) {
        const bounds = L.latLngBounds(claims.map(claim => claim.coordinates));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, [claims, map]);

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">{t('sdlc_dashboard')}</h1>
          <p className="text-emerald-100 text-lg">
            {t('claim_validation')} & {t('dss_monitoring')}
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
            alt="Forest background"
            className="w-96 h-96 object-cover"
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_claims')}
          value={stats.totalClaims}
          icon={FileText}
          color="blue"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title={t('pending_review')}
          value={stats.pendingReview}
          icon={Clock}
          color="amber"
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatCard
          title={t('approved_today')}
          value={stats.approvedToday}
          icon={CheckCircle}
          color="emerald"
          trend={{ value: 15.3, isPositive: true }}
        />
        <StatCard
          title={t('dss_flagged')}
          value={stats.dssFlagged}
          icon={AlertTriangle}
          color="purple"
          trend={{ value: 3.1, isPositive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Claims Overview
          </h3>
          <Bar data={barChartData} options={chartOptions} />
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('scheme_eligibility')}
          </h3>
          <div className="flex justify-center">
            <div className="w-80 h-80">
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* WebGIS Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MapPin className="w-6 h-6 mr-2" />
            {t('webgis_map')}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Pending
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Approved
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              Rejected
            </span>
          </div>
        </div>
        <div className="h-96 rounded-lg overflow-hidden map-container">
          <iframe
  src="/mandla_landcover_interactive_map (1).html"
  title="Landcover Interactive Map"
  className="w-full aspect-video rounded-xl border border-cyan-400/20 bg-white"
/>
        </div>
      </motion.div>

      {/* Claims List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('claim_validation')}
          </h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_claims')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">{t('all_statuses')}</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('export_csv')}</span>
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onReview={handleClaimReview}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Claim Review Modal */}
      <ClaimReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        claim={selectedClaim}
        onReview={handleReviewSubmit}
      />
    </div>
  );
};

export default Dashboard;
