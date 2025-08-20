import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import styles from '../styles/subscription.module.css';
import {
  FaCrown,
  FaGem,
  FaRocket,
  FaCheck,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

const getPlanIcon = (planType) => {
  switch (planType?.toLowerCase()) {
    case 'pro':
      return <FaCrown className={styles.planIconElement} />;
    case 'ultimate':
      return <FaGem className={styles.planIconElement} />;
    default:
      return <FaRocket className={styles.planIconElement} />;
  }
};

const getPlanFeatures = (plan) => {
  if (!plan) return [];

  const features = [];

  if (plan.maxRequestsPerDay) {
    if (plan.maxRequestsPerDay === 5000) {
      features.push('Unlimited daily requests');
    } else {
      features.push(
        `${plan.maxRequestsPerDay.toLocaleString()} daily requests`
      );
    }
  }

  if (plan.premiumModelsAccess) {
    features.push('Premium AI models access');
  }

  switch (plan.planType?.toLowerCase()) {
    case 'pro':
      features.push(
        'Priority support',
        'Advanced analytics',
        'Enhanced productivity tools',
        'Custom integrations'
      );
      break;
    case 'ultimate':
      features.push(
        'All Pro features included',
        'Dedicated support team',
        'White-label options',
        'Custom branding',
        'API access',
        'Advanced reporting'
      );
      break;
    default:
      features.push(
        'Standard support',
        'Core functionality',
        'Community access'
      );
  }

  return features;
};

const SubscriptionTest = () => {
  const { isAuthenticated, username } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}subscription/plans`, {
        withCredentials: true,
      });
      setPlans(response.data);
    } catch (err) {
      setError('Failed to fetch subscription plans: ' + err.message);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}subscription/status`, {
        withCredentials: true,
      });
      setSubscriptionStatus(response.data);
    } catch (err) {
      setError('Failed to fetch subscription status: ' + err.message);
    }
  };

  const createCheckoutSession = async (planType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}subscription/create-checkout-session`,
        {
          planType: planType,
          successUrl: `${window.location.origin}/plan?success=true`,
          cancelUrl: `${window.location.origin}/plan?canceled=true`,
        },
        { withCredentials: true }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError('Failed to create checkout session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}subscription/cancel`,
        {},
        {
          withCredentials: true,
        }
      );

      await fetchSubscriptionStatus();
      alert('Subscription cancelled successfully!');
    } catch (err) {
      setError('Failed to cancel subscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
      fetchSubscriptionStatus();
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.notLoggedIn}>
          <h2>Access Subscription Management</h2>
          <p>Please log in to manage your subscription plans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Subscription Management</h1>
        <p className={styles.subtitle}>
          Welcome back, {username}! Manage your subscription plan below.
        </p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <FaTimes className={styles.alertIcon} />
          {error}
        </div>
      )}

      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <h2>Your Current Plan</h2>
          <button
            onClick={fetchSubscriptionStatus}
            disabled={loading}
            className={styles.refreshBtn}
            title='Refresh Status'
          >
            {loading ? <FaSpinner className={styles.spinning} /> : 'Refresh'}
          </button>
        </div>
        <div className={styles.statusContent}>
          {subscriptionStatus ? (
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Status</span>
                <span
                  className={`${styles.statusValue} ${styles[subscriptionStatus.subscriptionStatus || 'inactive']}`}
                >
                  {subscriptionStatus.subscriptionStatus === 'active' ? (
                    <>
                      <FaCheck className={styles.statusIcon} /> Active
                    </>
                  ) : (
                    <>
                      <FaTimes className={styles.statusIcon} /> Inactive
                    </>
                  )}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Plan Type</span>
                <span className={styles.statusValue}>
                  {getPlanIcon(subscriptionStatus.planType || 'free')}
                  {(subscriptionStatus.planType || 'free').toUpperCase()}
                </span>
              </div>
              {subscriptionStatus.subscriptionEndDate && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>End Date</span>
                  <span className={styles.statusValue}>
                    {new Date(
                      subscriptionStatus.subscriptionEndDate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.loadingStatus}>
              <FaSpinner className={styles.spinning} />
              Loading subscription status...
            </div>
          )}
        </div>
      </div>

      <div className={styles.plansSection}>
        <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
        {plans.length > 0 ? (
          <div className={styles.plansGrid}>
            {plans.map((plan) => {
              const isCurrentPlan =
                subscriptionStatus?.planType === plan.planType &&
                subscriptionStatus?.subscriptionStatus === 'active';
              return (
                <div
                  key={plan.id}
                  className={`${styles.planCard} ${isCurrentPlan ? styles.currentPlan : ''} ${plan.planType === 'ultimate' ? styles.featured : ''}`}
                >
                  {plan.planType === 'ultimate' && (
                    <div className={styles.featuredBadge}>
                      <FaCrown /> Most Popular
                    </div>
                  )}
                  <div className={styles.planHeader}>
                    <div className={styles.planIcon}>
                      {getPlanIcon(plan.planType)}
                    </div>
                    <h3 className={styles.planName}>
                      {plan.name || plan.planType.toUpperCase()}
                    </h3>
                    <div className={styles.planPrice}>
                      <span className={styles.currency}>$</span>
                      <span className={styles.amount}>
                        {plan.price || 'Free'}
                      </span>
                      <span className={styles.period}>
                        /
                        {plan.billingInterval
                          ? plan.billingInterval.replace('ly', '')
                          : 'month'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.planDescription}>
                    {plan.description}
                  </div>
                  <div className={styles.planFeatures}>
                    {getPlanFeatures(plan).map((feature, index) => (
                      <div key={index} className={styles.feature}>
                        <FaCheck className={styles.featureIcon} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => createCheckoutSession(plan.planType)}
                    disabled={loading || isCurrentPlan}
                    className={`${styles.subscribeBtn} ${isCurrentPlan ? styles.currentBtn : ''} ${plan.planType === 'ultimate' ? styles.featuredBtn : ''}`}
                  >
                    {loading ? (
                      <FaSpinner className={styles.spinning} />
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      `Upgrade to ${plan.name || plan.planType}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noPlans}>
            <p>No subscription plans available at the moment.</p>
            <small>Please check back later or contact support.</small>
          </div>
        )}
      </div>

      {subscriptionStatus?.subscriptionStatus === 'active' && (
        <div className={styles.cancelSection}>
          <div className={styles.cancelCard}>
            <h3 className={styles.cancelTitle}>Cancel Subscription</h3>
            <p className={styles.cancelDescription}>
              You can cancel your subscription at any time. You'll continue to
              have access to premium features until the end of your current
              billing period.
            </p>
            <button
              onClick={cancelSubscription}
              disabled={loading}
              className={styles.cancelBtn}
            >
              {loading ? (
                <>
                  <FaSpinner className={styles.spinning} /> Processing...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <FaSpinner className={styles.spinning} />
            <p>Processing your request...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTest;
