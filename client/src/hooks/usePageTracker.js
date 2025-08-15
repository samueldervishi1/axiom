import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTracker = (checkRateLimit) => {
  const location = useLocation();

  const trackPageVisit = useCallback(() => {
    // Track various types of page visits
    const visitData = {
      path: location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      type: getVisitType(),
    };

    // Store the visit
    storeVisit(visitData);

    // Check rate limit
    if (checkRateLimit) {
      checkRateLimit();
    }
  }, [location.pathname, checkRateLimit]);

  const getVisitType = () => {
    // Detect if this is a refresh vs navigation
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      return navEntry.type; // 'navigate', 'reload', 'back_forward'
    }
    return 'unknown';
  };

  const storeVisit = (visitData) => {
    try {
      const key = 'page_visits';
      const stored = localStorage.getItem(key);
      const visits = stored ? JSON.parse(stored) : [];

      // Keep only last 100 visits to prevent storage bloat
      const updatedVisits = [...visits, visitData].slice(-100);

      localStorage.setItem(key, JSON.stringify(updatedVisits));
    } catch (error) {
      this.reportError(
        new Error(
          `Failed to store page visit: ${error?.message || 'Unknown error'}`
        )
      );
    }
  };

  const getVisitStats = () => {
    try {
      const key = 'page_visits';
      const stored = localStorage.getItem(key);
      const visits = stored ? JSON.parse(stored) : [];

      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;

      const recentVisits = visits.filter((v) => v.timestamp > fiveMinutesAgo);
      const hourlyVisits = visits.filter((v) => v.timestamp > oneHourAgo);

      const refreshCount = recentVisits.filter(
        (v) => v.type === 'reload'
      ).length;
      const navigationCount = recentVisits.filter(
        (v) => v.type === 'navigate'
      ).length;

      return {
        totalVisits: visits.length,
        recentVisits: recentVisits.length,
        hourlyVisits: hourlyVisits.length,
        refreshCount,
        navigationCount,
        suspiciousActivity: refreshCount > 10 || recentVisits.length > 20,
      };
    } catch (error) {
      console.error('Error getting visit stats:', error);
      return {
        totalVisits: 0,
        recentVisits: 0,
        hourlyVisits: 0,
        refreshCount: 0,
        navigationCount: 0,
        suspiciousActivity: false,
      };
    }
  };

  // Track page visits on route changes
  useEffect(() => {
    trackPageVisit();
  }, [trackPageVisit]);

  // Track browser events that might indicate suspicious activity
  useEffect(() => {
    let refreshCount = 0;
    let lastRefreshTime = 0;

    const handleBeforeUnload = () => {
      const now = Date.now();
      if (now - lastRefreshTime < 1000) {
        // Less than 1 second between refreshes
        refreshCount++;
        if (refreshCount > 5) {
          // Store suspicious activity flag
          localStorage.setItem('suspicious_refresh_detected', 'true');
        }
      }
      lastRefreshTime = now;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again - could be a refresh or tab switch
        trackPageVisit();
      }
    };

    const handleFocus = () => {
      // Window gained focus - track as potential suspicious activity if too frequent
      trackPageVisit();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [trackPageVisit]);

  return {
    trackPageVisit,
    getVisitStats,
  };
};
