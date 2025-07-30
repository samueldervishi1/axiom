import { useState, useEffect } from 'react';

const RATE_LIMIT_KEY = 'page_visit_tracker';
const MAX_REQUESTS_PER_MINUTE = 50; // Maximum requests per minute (increased)
const MAX_REQUESTS_PER_HOUR = 300; // Maximum requests per hour (increased)
const BLOCK_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds (reduced)

export const useRateLimit = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const getCurrentTimestamp = () => Date.now();

  const getStoredData = () => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            requests: [],
            blockedUntil: null,
            totalRequests: 0,
          };
    } catch (error) {
      console.error('Error reading rate limit data:', error);
      return {
        requests: [],
        blockedUntil: null,
        totalRequests: 0,
      };
    }
  };

  const saveData = (data) => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  };

  const cleanOldRequests = (requests, currentTime) => {
    const oneHourAgo = currentTime - 60 * 60 * 1000;
    return requests.filter((timestamp) => timestamp > oneHourAgo);
  };

  const checkRateLimit = () => {
    const currentTime = getCurrentTimestamp();
    const data = getStoredData();

    // Check if user is currently blocked
    if (data.blockedUntil && currentTime < data.blockedUntil) {
      // Check if this is an old 10-minute block that should be converted to 2-minute
      const blockDuration =
        data.blockedUntil -
        (data.blockStartTime || data.blockedUntil - 10 * 60 * 1000);
      if (blockDuration > BLOCK_DURATION) {
        // This is an old longer block, convert it to new duration
        const newBlockEnd = currentTime + BLOCK_DURATION;
        const newData = {
          ...data,
          blockedUntil: newBlockEnd,
          blockStartTime: currentTime,
        };
        saveData(newData);
        setIsBlocked(true);
        setBlockEndTime(newBlockEnd);
        setRemainingTime(Math.ceil(BLOCK_DURATION / 1000));
        console.log('Converted old block to new 2-minute duration');
        return false; // Blocked
      }

      setIsBlocked(true);
      setBlockEndTime(data.blockedUntil);
      setRemainingTime(Math.ceil((data.blockedUntil - currentTime) / 1000));
      return false; // Blocked
    }

    // Clean old requests (older than 1 hour)
    const cleanRequests = cleanOldRequests(data.requests, currentTime);

    // Check requests in the last minute
    const oneMinuteAgo = currentTime - 60 * 1000;
    const recentRequests = cleanRequests.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    // Check if user exceeds rate limits
    const exceedsMinuteLimit = recentRequests.length >= MAX_REQUESTS_PER_MINUTE;
    const exceedsHourLimit = cleanRequests.length >= MAX_REQUESTS_PER_HOUR;

    if (exceedsMinuteLimit || exceedsHourLimit) {
      // Block the user
      const blockedUntil = currentTime + BLOCK_DURATION;
      const newData = {
        requests: cleanRequests,
        blockedUntil: blockedUntil,
        totalRequests: data.totalRequests + 1,
      };

      saveData(newData);
      setIsBlocked(true);
      setBlockEndTime(blockedUntil);
      setRemainingTime(Math.ceil(BLOCK_DURATION / 1000));

      console.warn('Rate limit exceeded. User blocked for 2 minutes.');
      return false; // Blocked
    }

    // Add current request and save
    const newRequests = [...cleanRequests, currentTime];
    const newData = {
      requests: newRequests,
      blockedUntil: null,
      totalRequests: data.totalRequests + 1,
    };

    saveData(newData);
    setIsBlocked(false);
    setBlockEndTime(null);
    setRemainingTime(0);

    return true; // Allowed
  };

  const getRemainingBlockTime = () => {
    if (!blockEndTime) return 0;
    const remaining = Math.max(
      0,
      Math.ceil((blockEndTime - getCurrentTimestamp()) / 1000)
    );
    return remaining;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetRateLimit = () => {
    localStorage.removeItem(RATE_LIMIT_KEY);
    localStorage.removeItem('page_visits'); // Also clear page visits
    setIsBlocked(false);
    setBlockEndTime(null);
    setRemainingTime(0);
  };

  const forceUnblock = () => {
    // Force immediate unblock - useful for migrating from old block duration
    resetRateLimit();
    console.log('Rate limit forcefully reset');
  };

  const getRequestStats = () => {
    const data = getStoredData();
    const currentTime = getCurrentTimestamp();
    const cleanRequests = cleanOldRequests(data.requests, currentTime);
    const oneMinuteAgo = currentTime - 60 * 1000;
    const recentRequests = cleanRequests.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    return {
      requestsLastMinute: recentRequests.length,
      requestsLastHour: cleanRequests.length,
      totalRequests: data.totalRequests,
      maxPerMinute: MAX_REQUESTS_PER_MINUTE,
      maxPerHour: MAX_REQUESTS_PER_HOUR,
    };
  };

  // Update remaining time every second when blocked
  useEffect(() => {
    let interval;

    if (isBlocked && blockEndTime) {
      interval = setInterval(() => {
        const remaining = getRemainingBlockTime();
        setRemainingTime(remaining);

        if (remaining <= 0) {
          setIsBlocked(false);
          setBlockEndTime(null);
          setRemainingTime(0);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockEndTime]);

  // Check rate limit on component mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  return {
    isBlocked,
    remainingTime,
    formattedRemainingTime: formatTime(remainingTime),
    checkRateLimit,
    resetRateLimit,
    forceUnblock,
    getRequestStats,
    blockEndTime,
  };
};
