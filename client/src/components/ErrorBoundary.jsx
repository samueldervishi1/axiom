import { Component } from 'react';
import PropTypes from 'prop-types';
import '../styles/errorBoundary.css';

// Constants
const MAX_RELOAD_ATTEMPTS = 3;
const SUPPORT_EMAIL = 'support@ch.com';
const STORAGE_KEY = 'reloadAttempts';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    reloadAttempts: this.getStoredAttempts(),
    errorMessage: null,
  };

  getStoredAttempts() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch (error) {
      throw new Error(
        `Failed to read from localStorage: ${error?.message || 'Unknown error'}`
      );
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred',
    };
  }

  componentDidCatch(error) {
    throw new Error(
      `Error captured in ErrorBoundary: ${error?.message || 'Unknown error'}`
    );
  }

  /**
   * Handles page reload and tracks attempts
   * @returns {void}
   */
  handleReload = () => {
    try {
      const newAttempts = this.state.reloadAttempts + 1;
      localStorage.setItem(STORAGE_KEY, String(newAttempts));

      if (newAttempts >= MAX_RELOAD_ATTEMPTS) {
        this.setState({ reloadAttempts: 0 });
        localStorage.removeItem(STORAGE_KEY);
      } else {
        window.location.reload();
      }
    } catch (error) {
      throw new Error(
        `Failed to handle reload: ${error?.message || 'Unknown error'}`
      );
    }
  };

  render() {
    const { hasError, reloadAttempts, errorMessage } = this.state;
    const { children } = this.props;

    if (!hasError) return children;

    return (
      <div className='error-boundary-container' role='alert'>
        <h1 className='error-heading'>Oops! Something went wrong.</h1>
        {errorMessage && <p className='error-details'>{errorMessage}</p>}
        <p className='error-message'>
          We're sorry for the inconvenience. Please try reloading the page.
        </p>
        <button
          className='reload-button'
          onClick={this.handleReload}
          disabled={reloadAttempts >= MAX_RELOAD_ATTEMPTS}
        >
          {reloadAttempts >= MAX_RELOAD_ATTEMPTS
            ? 'Too many reload attempts'
            : 'Reload Page'}
        </button>
        {reloadAttempts >= MAX_RELOAD_ATTEMPTS && (
          <div className='contact-admin'>
            <p>
              Please contact our support team for assistance at
              <a href={`mailto:${SUPPORT_EMAIL}`} className='support-link'>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
};

export default ErrorBoundary;
