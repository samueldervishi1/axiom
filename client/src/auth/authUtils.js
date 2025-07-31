import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

class TokenManager {
  constructor() {
    this.refreshInProgress = false;
    this.setupResponseInterceptors();
    this.startTokenRefreshTimer();
  }

  setupResponseInterceptors() {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !this.refreshInProgress) {
          const refreshed = await this.attemptTokenRefresh();
          if (refreshed) {
            return axios.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  startTokenRefreshTimer() {
    setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 300000);
  }

  async checkAndRefreshToken() {
    if (this.refreshInProgress) {
      return false;
    }

    try {
      const response = await axios.get(`${API_URL}auth/me`, {
        withCredentials: true,
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        return await this.attemptTokenRefresh();
      }
      console.warn('Token check failed:', error);
      return false;
    }
  }

  async attemptTokenRefresh() {
    if (this.refreshInProgress) {
      return false;
    }

    this.refreshInProgress = true;

    try {
      const response = await axios.post(
        `${API_URL}auth/refresh`,
        {},
        {
          withCredentials: true,
        }
      );

      this.refreshInProgress = false;

      if (response.status === 200) {
        console.log('Token refreshed successfully');
        this.dispatchTokenRefreshedEvent();
        return true;
      } else {
        console.warn('Token refresh failed');
        this.dispatchTokenExpiredEvent();
        return false;
      }
    } catch (error) {
      this.refreshInProgress = false;
      console.error('Token refresh error:', error);
      this.dispatchTokenExpiredEvent();
      return false;
    }
  }

  dispatchTokenRefreshedEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tokenRefreshed', {
          detail: { timestamp: new Date() },
        })
      );
    }
  }

  dispatchTokenExpiredEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tokenExpired', {
          detail: { timestamp: new Date() },
        })
      );
    }
  }

  onTokenRefreshed(callback) {
    if (typeof window !== 'undefined') {
      window.addEventListener('tokenRefreshed', callback);
    }
  }

  onTokenExpired(callback) {
    if (typeof window !== 'undefined') {
      window.addEventListener('tokenExpired', callback);
    }
  }

  async logout() {
    try {
      await axios.post(
        `${API_URL}auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

const tokenManager = new TokenManager();

tokenManager.onTokenExpired(() => {
  console.warn('Session expired. Please login again.');
});

tokenManager.onTokenRefreshed(() => {
  console.log('Session extended successfully');
});

export const getUserInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}auth/me`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

export const getUserIdFromServer = async () => {
  const userInfo = await getUserInfo();
  return userInfo?.userId ?? null;
};

export const getUsernameFromServer = async () => {
  const userInfo = await getUserInfo();
  return userInfo?.username ?? null;
};

export const getCompleteUserProfile = async (username) => {
  if (!username) {
    console.error('Username is required to fetch complete profile');
    return null;
  }

  try {
    const response = await axios.get(`${API_URL}users/lookup/${username}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get complete user profile:', error);
    return null;
  }
};

export const isUserDeactivated = async (username) => {
  const profile = await getCompleteUserProfile(username);
  if (!profile) return false;

  return profile.deactivated === true || profile.deactivated === 'true';
};

export const reactivateAccount = async (
  userId,
  password,
  confirmReactivation
) => {
  try {
    const response = await axios.put(
      `${API_URL}profile/${userId}/reactivate`,
      {
        password,
        confirmReactivation,
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error('Failed to reactivate account:', error);
    throw error;
  }
};

export { tokenManager };
