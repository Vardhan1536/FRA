import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Home, 
  Map, 
  AlertTriangle, 
  Settings, 
  FileText, 
  LogOut,
  X,
  Building,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { t } = useTranslation();
  const { logout, currentUser } = useAuth();
  const { theme } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (currentUser?.role === 'SDLC') {
      return [
        { path: '/sdlc/dashboard', icon: Home, label: t('sdlc_dashboard') },
        { path: '/sdlc/claims', icon: FileText, label: t('claims') },
        { path: '/sdlc/schemes', icon: Building, label: 'Schemes' },
        { path: '/sdlc/resource-suggestions', icon: Lightbulb, label: 'Resource Suggestions' },
        { path: '/sdlc/alerts', icon: AlertTriangle, label: t('alerts') },
        { path: '/sdlc/settings', icon: Settings, label: t('settings') }
      ];
    } else if (currentUser?.role === 'DLC') {
      return [
        { path: '/dlc/dashboard', icon: Home, label: 'DLC Dashboard' },
        { path: '/dlc/claims', icon: FileText, label: t('claims') },
        { path: '/dlc/schemes', icon: Building, label: 'Schemes' },
        { path: '/dlc/resource-suggestions', icon: Lightbulb, label: 'Resource Suggestions' },
        { path: '/dlc/alerts', icon: AlertTriangle, label: t('alerts') },
        { path: '/dlc/settings', icon: Settings, label: t('settings') }
      ];
    } else {
      // Default Grama Sabha navigation
      return [
        { path: '/grama-sabha/dashboard', icon: Home, label: t('dashboard') },
        { path: '/grama-sabha/map', icon: Map, label: t('map') },
        { path: '/grama-sabha/claims', icon: FileText, label: t('claims') },
        { path: '/grama-sabha/schemes', icon: Building, label: 'Schemes' },
        { path: '/grama-sabha/resource-suggestions', icon: Lightbulb, label: 'Resource Suggestions' },
        { path: '/grama-sabha/alerts', icon: AlertTriangle, label: t('alerts') },
        { path: '/grama-sabha/settings', icon: Settings, label: t('settings') }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`h-full w-70 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white shadow-2xl ${
        isOpen ? 'block' : 'hidden lg:block'
      } ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : ''}`}>
        {/* Header */}
        <div className="p-6 border-b border-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">FRA Atlas</h1>
                <p className="text-sm text-emerald-300">
                  {currentUser?.role === 'SDLC' ? t('sdlc_role') : 
                   currentUser?.role === 'DLC' ? 'DLC Portal' : 
                   t('gramasabha_role')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-emerald-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser?.displayName}</p>
              <p className="text-xs text-emerald-300">
                {currentUser?.district ? `${currentUser.district}, ${currentUser.village}` : currentUser?.village}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={toggleSidebar}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-emerald-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-emerald-100 hover:bg-emerald-700 hover:text-white rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;