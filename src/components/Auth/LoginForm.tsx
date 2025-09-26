import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default credentials for different roles
  const defaultCredentials = [
    { email: 'sdlc@fra.gov.in', password: 'sdlc123', role: 'SDLC', description: 'SDLC Officer' },
    { email: 'dlc@fra.gov.in', password: 'dlc123', role: 'DLC', description: 'DLC Officer' },
    { email: 'gramasabha@fra.gov.in', password: 'gs123', role: 'GramaSabha', description: 'Grama Sabha Officer' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if credentials match any default credentials
      const matchedCredential = defaultCredentials.find(
        cred => cred.email === email && cred.password === password
      );

      if (matchedCredential) {
        await authLogin(email, password);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate based on role
        switch (matchedCredential.role) {
          case 'SDLC':
            navigate('/sdlc/dashboard');
            break;
          case 'DLC':
            navigate('/dlc/dashboard');
            break;
          default:
            navigate('/grama-sabha/dashboard');
        }
      } else {
        throw new Error('Invalid credentials');
      }
    } catch {
      setError('Invalid email or password. Please use one of the provided demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (credential: typeof defaultCredentials[0]) => {
    setEmail(credential.email);
    setPassword(credential.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('welcome')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('gramasabha_role')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="text-white" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{t('login')}</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
            Demo Credentials - Click to auto-fill:
          </p>
          {defaultCredentials.map((credential, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickLogin(credential)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {credential.description}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {credential.email} / {credential.password}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  credential.role === 'SDLC' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' :
                  credential.role === 'DLC' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                }`}>
                  {credential.role}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;