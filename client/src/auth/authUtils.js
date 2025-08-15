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
      await axios.get(`${API_URL}auth/me`, {
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
        this.dispatchTokenRefreshedEvent();
        return true;
      } else {
        console.warn('Token refresh failed');
        this.dispatchTokenExpiredEvent();
        return false;
      }
    } catch (error) {
      this.refreshInProgress = false;
      this.dispatchTokenExpiredEvent();
      throw new Error(
        `Token refresh failed: ${error?.message || 'Unknown error'}`
      );
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
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error(`Logout failed: ${error?.message || 'Unknown error'}`);
    }
  }
}

const tokenManager = new TokenManager();

tokenManager.onTokenExpired(() => {
  console.warn('Session expired. Please login again.');
});

tokenManager.onTokenRefreshed(() => {
  //do nothing
});

export const getUserInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}auth/me`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to get user info: ${error?.message || 'Unknown error'}`
    );
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
    throw new Error('Username is required to fetch complete profile');
  }

  try {
    const response = await axios.get(`${API_URL}users/lookup/${username}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to get complete user profile: ${error?.message || 'Unknown error'}`
    );
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
    throw new Error(
      `Failed to reactivate account: ${error?.message || 'Unknown error'}`
    );
  }
};

export { tokenManager };
