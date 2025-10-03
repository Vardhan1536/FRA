// Cache testing utility for development
import { cacheManager, alertsAPI, legalAssistanceAPI } from './api';

export const testCacheSystem = () => {
  console.log('🧪 Testing Cache System...');
  
  // Test cache stats
  const stats = cacheManager.getCacheStats();
  console.log('📊 Cache Statistics:', stats);
  
  // Test alerts cache
  const alertsCacheInfo = alertsAPI.getCacheInfo();
  console.log('🚨 Alerts Cache Info:', alertsCacheInfo);
  
  // Test legal assistance cache
  const legalCacheInfo = legalAssistanceAPI.getCacheInfo();
  console.log('⚖️ Legal Assistance Cache Info:', legalCacheInfo);
  
  // Test cache clearing
  console.log('🧹 Testing cache clearing...');
  cacheManager.clearExpiredCaches();
  
  // Test force refresh
  console.log('🔄 Testing force refresh...');
  cacheManager.forceRefreshAll();
  
  console.log('✅ Cache system test completed!');
};

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testCacheSystem = testCacheSystem;
  (window as any).cacheManager = cacheManager;
  (window as any).alertsAPI = alertsAPI;
  (window as any).legalAssistanceAPI = legalAssistanceAPI;
}
