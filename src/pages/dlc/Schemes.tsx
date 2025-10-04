import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  FileText,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Bell
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { schemeEligibilityAPI, notificationsAPI } from '../../utils/api';
import { BeneficiarySchemeEligibility, SchemeEligibilityGroup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface SchemeEligibilityCardProps {
  schemeGroup: SchemeEligibilityGroup;
  onViewDetails: (schemeGroup: SchemeEligibilityGroup) => void;
  onNotifyEligible: (schemeName: string) => void;
  isNotifying?: boolean;
  notifiedSchemes: Set<string>;
}

const SchemeEligibilityCard: React.FC<SchemeEligibilityCardProps> = ({ schemeGroup, onViewDetails, onNotifyEligible, isNotifying, notifiedSchemes }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalBeneficiaries = schemeGroup.eligible_beneficiaries.length + schemeGroup.ineligible_beneficiaries.length;
  const eligibilityRate = totalBeneficiaries > 0 ? (schemeGroup.eligible_beneficiaries.length / totalBeneficiaries) * 100 : 0;

  const getEligibilityColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEligibilityBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (rate >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {schemeGroup.scheme_name}
          </h3>
          <div className="flex items-center space-x-4 mb-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEligibilityBgColor(eligibilityRate)} ${getEligibilityColor(eligibilityRate)}`}>
              {eligibilityRate.toFixed(1)}% Eligible
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {totalBeneficiaries} Total Beneficiaries
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
          {schemeGroup.eligible_beneficiaries.length > 0 && (
            <motion.button
              whileHover={{ scale: notifiedSchemes.has(schemeGroup.scheme_name) ? 1 : 1.05 }}
              whileTap={{ scale: notifiedSchemes.has(schemeGroup.scheme_name) ? 1 : 0.95 }}
              onClick={() => onNotifyEligible(schemeGroup.scheme_name)}
              disabled={isNotifying || notifiedSchemes.has(schemeGroup.scheme_name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:cursor-not-allowed ${
                notifiedSchemes.has(schemeGroup.scheme_name)
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : isNotifying
                  ? 'bg-blue-600 text-white opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {notifiedSchemes.has(schemeGroup.scheme_name) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Bell className={`w-4 h-4 ${isNotifying ? 'animate-pulse' : ''}`} />
              )}
              <span>
                {notifiedSchemes.has(schemeGroup.scheme_name)
                  ? 'Notified'
                  : isNotifying
                  ? 'Notifying...'
                  : 'Notify Eligible'}
              </span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewDetails(schemeGroup)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Eligible:</span>
          <span className="font-semibold text-green-600">{schemeGroup.eligible_beneficiaries.length}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Ineligible:</span>
          <span className="font-semibold text-red-600">{schemeGroup.ineligible_beneficiaries.length}</span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Eligible Beneficiaries */}
          {schemeGroup.eligible_beneficiaries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                Eligible Beneficiaries ({schemeGroup.eligible_beneficiaries.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {schemeGroup.eligible_beneficiaries.slice(0, 10).map((beneficiaryId, index) => (
                  <span key={index} className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">
                    {beneficiaryId}
                  </span>
                ))}
                {schemeGroup.eligible_beneficiaries.length > 10 && (
                  <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                    +{schemeGroup.eligible_beneficiaries.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ineligible Beneficiaries with Reasons */}
          {schemeGroup.ineligible_beneficiaries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                Ineligible Beneficiaries ({schemeGroup.ineligible_beneficiaries.length})
              </h4>
              <div className="space-y-2">
                {schemeGroup.ineligible_beneficiaries.slice(0, 5).map((beneficiary, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="font-medium text-red-800 dark:text-red-200 text-sm mb-1">
                      {beneficiary.beneficiary_id}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-300">
                      <strong>Reasons:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {beneficiary.reasons.map((reason, reasonIndex) => (
                          <li key={reasonIndex}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                {schemeGroup.ineligible_beneficiaries.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    +{schemeGroup.ineligible_beneficiaries.length - 5} more ineligible beneficiaries
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

const Schemes: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [schemeData, setSchemeData] = useState<BeneficiarySchemeEligibility[]>([]);
  const [groupedSchemes, setGroupedSchemes] = useState<SchemeEligibilityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<SchemeEligibilityGroup | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [notifyingScheme, setNotifyingScheme] = useState<string | null>(null);
  const [notifiedSchemes, setNotifiedSchemes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSchemeEligibility();
  }, []);

  const loadSchemeEligibility = async (forceRefresh: boolean = false) => {
    if (!currentUser?.role) return;
    
    setLoading(true);
    try {
      const data = await schemeEligibilityAPI.getSchemeEligibility(currentUser.role, forceRefresh);
      setSchemeData(data);
      
      // Group data by scheme name
      const grouped = schemeEligibilityAPI.groupByScheme(data);
      setGroupedSchemes(grouped);
      
      // Calculate statistics
      const eligibilityStats = schemeEligibilityAPI.getEligibilityStats(data);
      setStats(eligibilityStats);
    } catch (error) {
      console.error('Failed to load scheme eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyEligible = async (schemeName: string) => {
    if (!currentUser?.role) return;
    
    setNotifyingScheme(schemeName);
    
    // Simulate API call with delay
    setTimeout(() => {
      // Mark scheme as notified
      setNotifiedSchemes(prev => new Set(prev).add(schemeName));
      setNotifyingScheme(null);
      
      // Find the scheme to get eligible count
      const schemeGroup = groupedSchemes.find(s => s.scheme_name === schemeName);
      const eligibleCount = schemeGroup?.eligible_beneficiaries.length || 0;
      
      // Show success message
      alert(`Successfully notified ${eligibleCount} eligible beneficiaries for ${schemeName}`);
    }, 1500); // 1.5 second delay to simulate API call
  };

  const handleViewDetails = (schemeGroup: SchemeEligibilityGroup) => {
    setSelectedScheme(schemeGroup);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedScheme(null);
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV content
      const csvContent = [
        'Scheme Name,Beneficiary ID,Eligibility,Reasons',
        ...schemeData.flatMap(beneficiary => 
          beneficiary.schemes_eligibility.map(scheme => 
            `${scheme.scheme_name},${scheme.beneficiary_id},${scheme.eligibility ? 'Eligible' : 'Ineligible'},"${scheme.reasons.join('; ')}"`
          )
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scheme-eligibility.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const filteredSchemes = groupedSchemes.filter(scheme => {
    const matchesSearch = scheme.scheme_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesEligibility = true;
    if (eligibilityFilter === 'high') {
      const total = scheme.eligible_beneficiaries.length + scheme.ineligible_beneficiaries.length;
      const rate = total > 0 ? (scheme.eligible_beneficiaries.length / total) * 100 : 0;
      matchesEligibility = rate >= 80;
    } else if (eligibilityFilter === 'medium') {
      const total = scheme.eligible_beneficiaries.length + scheme.ineligible_beneficiaries.length;
      const rate = total > 0 ? (scheme.eligible_beneficiaries.length / total) * 100 : 0;
      matchesEligibility = rate >= 60 && rate < 80;
    } else if (eligibilityFilter === 'low') {
      const total = scheme.eligible_beneficiaries.length + scheme.ineligible_beneficiaries.length;
      const rate = total > 0 ? (scheme.eligible_beneficiaries.length / total) * 100 : 0;
      matchesEligibility = rate < 60;
    }
    
    return matchesSearch && matchesEligibility;
  });

  // Chart data
  const barChartData = {
    labels: groupedSchemes.map(s => s.scheme_name.length > 30 ? s.scheme_name.substring(0, 30) + '...' : s.scheme_name),
    datasets: [
      {
        label: 'Eligible',
        data: groupedSchemes.map(s => s.eligible_beneficiaries.length),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Ineligible',
        data: groupedSchemes.map(s => s.ineligible_beneficiaries.length),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  const pieChartData = {
    labels: ['Eligible', 'Ineligible'],
    datasets: [
      {
        data: [
          groupedSchemes.reduce((sum, s) => sum + s.eligible_beneficiaries.length, 0),
          groupedSchemes.reduce((sum, s) => sum + s.ineligible_beneficiaries.length, 0)
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
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

  if (!currentUser?.role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to view scheme eligibility data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Scheme Eligibility Analysis</h1>
          <p className="text-emerald-100 text-lg">
            Track beneficiary eligibility across all FRA schemes and government programs
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <Building className="w-96 h-96" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Schemes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSchemes}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Beneficiaries
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBeneficiaries}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Overall Eligibility Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.overallEligibilityRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cache Status
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {schemeEligibilityAPI.getCacheInfo(currentUser.role).exists ? 'Cached' : 'Fresh'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts Section */}
      {groupedSchemes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Eligibility by Scheme
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
              Overall Eligibility Distribution
            </h3>
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Schemes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scheme Eligibility Details
          </h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schemes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Eligibility Rates</option>
              <option value="high">High (≥80%)</option>
              <option value="medium">Medium (60-79%)</option>
              <option value="low">Low (&lt;60%)</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadSchemeEligibility(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No schemes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || eligibilityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No scheme eligibility data available'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSchemes.map((schemeGroup) => (
              <SchemeEligibilityCard
                key={schemeGroup.scheme_name}
                schemeGroup={schemeGroup}
                onViewDetails={handleViewDetails}
                onNotifyEligible={handleNotifyEligible}
                isNotifying={notifyingScheme === schemeGroup.scheme_name}
                notifiedSchemes={notifiedSchemes}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Scheme Details Modal */}
      {selectedScheme && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedScheme.scheme_name}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Eligible Beneficiaries */}
                <div>
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Eligible Beneficiaries ({selectedScheme.eligible_beneficiaries.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedScheme.eligible_beneficiaries.map((beneficiaryId, index) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {beneficiaryId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ineligible Beneficiaries */}
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    Ineligible Beneficiaries ({selectedScheme.ineligible_beneficiaries.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {selectedScheme.ineligible_beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                          {beneficiary.beneficiary_id}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-300">
                          <strong>Reasons for Ineligibility:</strong>
                          <ul className="mt-1 list-disc list-inside space-y-1">
                            {beneficiary.reasons.map((reason, reasonIndex) => (
                              <li key={reasonIndex}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Schemes;