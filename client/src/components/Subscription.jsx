import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import styles from '../styles/subscription.module.css';
import {
  FaCrown,
  FaGem,
  FaTimes,
  FaSpinner,
  FaBrain,
  FaInfinity,
} from 'react-icons/fa';
import { RiGeminiLine } from 'react-icons/ri';
import { LuMessagesSquare } from 'react-icons/lu';
import { LuBrain } from 'react-icons/lu';
import { VscTelescope, VscCodeOss } from 'react-icons/vsc';
import { GoTasklist } from 'react-icons/go';
import { IoCodeSlashOutline } from 'react-icons/io5';
import { MdOutlineImageSearch, MdUploadFile } from 'react-icons/md';
import {
  LiaNewspaperSolid,
  LiaTasksSolid,
  LiaBrainSolid,
} from 'react-icons/lia';
import { PiBrainLight, PiImagesLight, PiMemoryThin } from 'react-icons/pi';
import { SiOpenaigym } from 'react-icons/si';

const API_URL = import.meta.env.VITE_API_URL;

const getPlanFeatures = (plan) => {
  if (!plan) return [];

  const features = [];

  switch (plan.planType?.toLowerCase()) {
    case 'free':
      features.push(
        { text: 'Access to Sage Advanced', icon: <LiaBrainSolid /> },
        { text: 'Limited file uploads', icon: <MdUploadFile /> },
        { text: 'Limited memory and context', icon: <PiMemoryThin /> }
      );
      break;
    case 'pro':
      features.push(
        {
          text: 'Sage Supreme with advanced reasoning',
          icon: <RiGeminiLine />,
        },
        { text: 'Sage Pro', icon: <FaGem /> },
        { text: 'Expanded messaging and uploads', icon: <LuMessagesSquare /> },
        {
          text: 'Expanded and faster image creation',
          icon: <MdOutlineImageSearch />,
        },
        { text: 'Expanded memory and context', icon: <PiBrainLight /> },
        {
          text: 'Expanded deep research and agent mode',
          icon: <VscTelescope />,
        },
        { text: 'Projects, tasks', icon: <GoTasklist /> },
        { text: 'Codex agent', icon: <IoCodeSlashOutline /> }
      );
      break;
    case 'ultimate':
      features.push(
        { text: 'Sage Ultimate Pro with pro reasoning', icon: <SiOpenaigym /> },
        { text: 'Sage Ultimate model', icon: <FaGem /> },
        { text: 'Unlimited messages and uploads', icon: <FaInfinity /> },
        {
          text: 'Unlimited and faster image creation',
          icon: <PiImagesLight />,
        },
        { text: 'Maximum memory and context', icon: <LuBrain /> },
        {
          text: 'Maximum deep research and agent mode',
          icon: <VscTelescope />,
        },
        {
          text: 'Expanded projects, tasks, and custom GPTs',
          icon: <LiaTasksSolid />,
        },
        { text: 'Expanded Codex agent', icon: <VscCodeOss /> },
        {
          text: 'Research preview of new features',
          icon: <LiaNewspaperSolid />,
        }
      );
      break;
    default:
      features.push(
        { text: 'Access to Sage Advanced', icon: <FaBrain /> },
        { text: 'Basic functionality' }
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
      // Refresh the page after successful cancellation
      window.location.reload();
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

      <div className={styles.plansSection}>
        <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
        {plans.length > 0 ? (
          <div className={styles.plansGrid}>
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>FREE</h3>
                <div className={styles.planPrice}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>0</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <div className={styles.planDescription}>
                Perfect for getting started with basic AI assistance
              </div>
              <div className={styles.planFeatures}>
                {getPlanFeatures({ planType: 'free' }).map((feature, index) => (
                  <div key={index} className={styles.feature}>
                    {feature.icon && (
                      <span className={styles.featureIcon}>{feature.icon}</span>
                    )}
                    {feature.text || feature}
                  </div>
                ))}
              </div>
              <button
                disabled={true}
                className={`${styles.subscribeBtn} ${styles.currentBtn}`}
              >
                Current Plan
              </button>
            </div>
            {plans.map((plan) => {
              const isCurrentPlan =
                subscriptionStatus?.planType === plan.planType &&
                subscriptionStatus?.subscriptionStatus === 'active';
              return (
                <div
                  key={plan.id}
                  className={`${styles.planCard} ${plan.planType === 'ultimate' ? styles.featured : ''}`}
                >
                  {plan.planType === 'ultimate' && (
                    <div className={styles.featuredBadge}>
                      <FaCrown /> Most Popular
                    </div>
                  )}
                  <div className={styles.planHeader}>
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
                        {feature.icon && (
                          <span className={styles.featureIcon}>
                            {feature.icon}
                          </span>
                        )}
                        {feature.text || feature}
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
