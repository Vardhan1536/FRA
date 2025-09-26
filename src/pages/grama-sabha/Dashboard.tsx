import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import StatCard from '../../components/UI/StatCard';
import { useApp } from '../../contexts/AppContext';
import { statsAPI } from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { dashboardStats, updateStats } = useApp();
  const [, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const stats = await statsAPI.getDashboardStats();
        updateStats(stats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [updateStats]);

  const barChartData = {
    labels: [t('total_claims'), t('approved_pattas'), t('pending_claims'), t('rejected_claims')],
    datasets: [
      {
        label: 'Claims Status',
        data: [
          dashboardStats.totalClaims,
          dashboardStats.approvedPattas,
          dashboardStats.pendingClaims,
          dashboardStats.rejectedClaims
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  const pieChartData = {
    labels: [t('approved_pattas'), t('pending_claims'), t('rejected_claims')],
    datasets: [
      {
        data: [
          dashboardStats.approvedPattas,
          dashboardStats.pendingClaims,
          dashboardStats.rejectedClaims
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-emerald-100 text-lg">
            {t('empowering_tribes')}
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
          value={dashboardStats.totalClaims}
          icon={FileText}
          color="blue"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title={t('approved_pattas')}
          value={dashboardStats.approvedPattas}
          icon={CheckCircle}
          color="emerald"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title={t('pending_claims')}
          value={dashboardStats.pendingClaims}
          icon={Clock}
          color="amber"
          trend={{ value: 3.1, isPositive: false }}
        />
        <StatCard
          title={t('rejected_claims')}
          value={dashboardStats.rejectedClaims}
          icon={XCircle}
          color="red"
          trend={{ value: 2.4, isPositive: false }}
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
            Status Distribution
          </h3>
          <div className="flex justify-center">
            <div className="w-80 h-80">
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/grama-sabha/claims')}
            className="flex items-center space-x-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <FileText className="w-6 h-6 text-emerald-600" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {t('submit_claim')}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/grama-sabha/map')}
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-blue-700 dark:text-blue-300">
              View Map
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/grama-sabha/alerts')}
            className="flex items-center space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <span className="font-medium text-amber-700 dark:text-amber-300">
              {dashboardStats.activeAlerts} {t('active_alerts')}
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            { type: 'claim_approved', message: 'IFR claim for Plot #145 approved', time: '2 hours ago' },
            { type: 'encroachment', message: 'Encroachment detected in Sector 7', time: '4 hours ago' },
            { type: 'claim_submitted', message: 'New CR claim submitted by Ram Singh', time: '6 hours ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;