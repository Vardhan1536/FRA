import React from 'react';
import { motion } from 'framer-motion';
import { Video as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      text: 'text-emerald-600',
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      text: 'text-amber-600',
      lightBg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-400 to-red-600',
      text: 'text-red-600',
      lightBg: 'bg-red-50 dark:bg-red-900/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20'
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↗️' : '↘️'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color].lightBg}`}>
          <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;