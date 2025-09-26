import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Sun, 
  Moon, 
  Globe, 
  Bell, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, language, setLanguage, offlineMode, dashboardStats } = useApp();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('welcome')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('empowering_tribes')}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Offline indicator */}
            <div className="flex items-center space-x-2">
              {offlineMode ? (
                <WifiOff className="w-5 h-5 text-red-500" />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {offlineMode ? 'Offline' : 'Online'}
              </span>
            </div>

            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <button 
                onClick={() => navigate('/grama-sabha/alerts')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                {dashboardStats.activeAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {dashboardStats.activeAlerts}
                  </span>
                )}
              </button>
            </motion.div>

            {/* Language toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={toggleLanguage}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-sm text-gray-600 dark:text-gray-400 uppercase">
                {language}
              </span>
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6 text-gray-600" />
              ) : (
                <Sun className="w-6 h-6 text-gray-300" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;