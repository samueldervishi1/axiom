import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import axios from 'axios';
import { isUserDeactivated } from './authUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post(`${API_URL}auth/refresh`, null, {
        withCredentials: true,
      });

      if (response.status === 200) {
        console.log('Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}auth/logout`, null, {
        withCredentials: true,
      });
    } catch (e) {
      console.error('Logout failed', e);
    }
    setIsAuthenticated(false);
    setIsDeactivated(false);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('lastAuthCheck');
  }, []);

  // Removed duplicate interceptor - TokenManager in authUtils.js handles 401 responses

  // Fixed: Moved checkSession out of useEffect to prevent recreating it
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}auth/me`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
        localStorage.setItem('lastAuthCheck', Date.now());

        if (response.data) {
          if (response.data.userId) {
            setUserId(response.data.userId);
          }

          if (response.data.username) {
            setUsername(response.data.username);

            try {
              const deactivated = await isUserDeactivated(
                response.data.username
              );
              setIsDeactivated(deactivated);

              if (deactivated) {
                const currentPath = window.location.pathname;
                if (currentPath !== '/account-deactivated') {
                  window.location.href = '/account-deactivated';
                }
              } else {
                console.log('User account is active');
              }
            } catch (profileError) {
              console.error(
                'Error checking deactivation status:',
                profileError
              );
              setIsDeactivated(false);
            }
          } else {
            console.error('No username found in response');
            setIsDeactivated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
        setIsDeactivated(false);
        setUsername(null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Session expired, attempting token refresh');

        const refreshSuccess = await refreshToken();

        if (refreshSuccess) {
          console.log('Token refreshed successfully, rechecking session');
          try {
            const retryResponse = await axios.get(`${API_URL}auth/me`, {
              withCredentials: true,
            });

            if (retryResponse.status === 200 && retryResponse.data) {
              setIsAuthenticated(true);
              localStorage.setItem('lastAuthCheck', Date.now());

              if (retryResponse.data.userId) {
                setUserId(retryResponse.data.userId);
              }

              if (retryResponse.data.username) {
                setUsername(retryResponse.data.username);

                try {
                  const deactivated = await isUserDeactivated(
                    retryResponse.data.username
                  );
                  setIsDeactivated(deactivated);
                } catch (profileError) {
                  console.error(
                    'Error checking deactivation status:',
                    profileError
                  );
                  setIsDeactivated(false);
                }
              }
            } else {
              setIsAuthenticated(false);
              setIsDeactivated(false);
              setUsername(null);
            }
          } catch (retryError) {
            console.error('Session recheck failed after refresh:', retryError);
            setIsAuthenticated(false);
            setIsDeactivated(false);
            setUsername(null);
          }
        } else {
          console.log('Token refresh failed, user not authenticated');
          setIsAuthenticated(false);
          setIsDeactivated(false);
          setUsername(null);
        }
      } else {
        console.error('Session check failed:', error);
        setIsAuthenticated(false);
        setIsDeactivated(false);
        setUsername(null);
      }
    } finally {
      setIsLoading(false);
      setIsInitialCheck(false); // Fixed: Set this after the first check
    }
  }, [refreshToken]);

  // Fixed: Simplified useEffect with proper dependencies
  useEffect(() => {
    checkSession();

    const intervalId = setInterval(
      () => {
        if (isAuthenticated) {
          checkSession();
        }
      },
      15 * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, [checkSession, isAuthenticated]);

  const login = useCallback((skipSessionCheck = false) => {
    setIsAuthenticated(true);
    if (skipSessionCheck) {
      setIsInitialCheck(false);
    }
    localStorage.setItem('lastAuthCheck', Date.now());
  }, []);

  const markReactivated = useCallback(() => {
    setIsDeactivated(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      isDeactivated,
      userId,
      username,
      login,
      logout,
      refreshToken,
      markReactivated,
    }),
    [
      isAuthenticated,
      isLoading,
      isDeactivated,
      userId,
      username,
      login,
      logout,
      refreshToken,
      markReactivated,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
