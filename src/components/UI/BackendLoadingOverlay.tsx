import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBackendLoading } from '../../contexts/BackendLoadingContext';
import { useAuth } from '../../contexts/AuthContext';

const BackendLoadingOverlay: React.FC = () => {
  const { isBackendLoading, currentMessageIndex, loadingMessages } = useBackendLoading();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToLogin = async () => {
    await logout();
    navigate('/');
  };

  if (!isBackendLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      
      {/* Loading content */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading message */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading Backend Services
          </h3>
          
          <div className="min-h-[3rem] flex items-center justify-center">
            <p 
              key={currentMessageIndex}
              className="text-gray-600 dark:text-gray-300 text-center animate-fade-in"
            >
              {loadingMessages[currentMessageIndex]}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {loadingMessages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentMessageIndex
                    ? 'bg-emerald-600 scale-125'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This may take a few moments...
          </p>
          
          {/* Back to Login button */}
          <button
            onClick={handleBackToLogin}
            className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendLoadingOverlay;
