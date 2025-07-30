class TokenManager {
    constructor() {
        this.refreshInProgress = false;
        this.baseURL = '/axiom/api/core/v16-loom';
        this.setupResponseInterceptors();
        this.startTokenRefreshTimer();
    }

    setupResponseInterceptors() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            
            if (response.status === 401 && !this.refreshInProgress) {
                const refreshed = await this.attemptTokenRefresh();
                if (refreshed) {
                    return originalFetch(...args);
                }
            }
            
            return response;
        };
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
            const response = await fetch(`${this.baseURL}/auth/me`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return await this.attemptTokenRefresh();
            }

            return true;
        } catch (error) {
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
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.refreshInProgress = false;

            if (response.ok) {
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
        window.dispatchEvent(new CustomEvent('tokenRefreshed', {
            detail: { timestamp: new Date() }
        }));
    }

    dispatchTokenExpiredEvent() {
        window.dispatchEvent(new CustomEvent('tokenExpired', {
            detail: { timestamp: new Date() }
        }));
    }

    onTokenRefreshed(callback) {
        window.addEventListener('tokenRefreshed', callback);
    }

    onTokenExpired(callback) {
        window.addEventListener('tokenExpired', callback);
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }
}

const tokenManager = new TokenManager();

tokenManager.onTokenExpired(() => {
    console.warn('Session expired. Please login again.');
    window.location.href = '/login';
});

tokenManager.onTokenRefreshed(() => {
    console.log('Session extended successfully');
});

window.tokenManager = tokenManager;