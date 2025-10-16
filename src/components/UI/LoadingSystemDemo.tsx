import React, { useState, useEffect } from 'react';

// Demo component to test the loading system
const LoadingSystemDemo: React.FC = () => {
  const [isBackendLoading, setIsBackendLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const loadingMessages = [
    "Please wait till the backend loads completely",
    "Startup is taking place",
    "API is being checked",
    "Beneficiary details are being fetched",
    "Alerts are being verified",
    "Chat bot for legal assistance is getting ready",
    "Atlas is getting ready to display",
    "Backend will be loaded shortly"
  ];

  // Rotate messages every 30 seconds
  useEffect(() => {
    if (!isBackendLoading) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isBackendLoading, loadingMessages.length]);

  // Simulate backend loading for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBackendLoading(false);
    }, 15000); // 15 seconds demo

    return () => clearTimeout(timer);
  }, []);

  if (!isBackendLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ✅ Backend Loading Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            The loading system is working correctly.
          </p>
          <button
            onClick={() => setIsBackendLoading(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Test Again
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This may take a few moments...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSystemDemo;
