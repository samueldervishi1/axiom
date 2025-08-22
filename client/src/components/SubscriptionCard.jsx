import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCrown, FaGem, FaRocket, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import styles from '../styles/subscriptionCard.module.css';
import { IoDiamondSharp } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL;

const SubscriptionCard = ({ currentSubscription }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}subscription/plans`, {
          withCredentials: true,
        });
        setPlans(response.data);
      } catch (error) {
        console.warn('Failed to fetch subscription plans:', error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgrade = () => {
    navigate('/plan');
  };

  const getSubscriptionContent = () => {
    if (loading) {
      return {
        icon: <FaRocket className={styles.planIcon} />,
        title: 'Loading...',
        description: 'Fetching subscription information...',
        buttonText: 'Please wait',
        buttonClass: styles.upgradeButton,
      };
    }

    const isActive = currentSubscription?.subscriptionStatus === 'active';
    const planType = currentSubscription?.planType || 'free';
    const role = currentSubscription?.role;

    const ultimatePlan = plans.find((plan) => plan.planType === 'ultimate');
    const proPlan = plans.find((plan) => plan.planType === 'pro');

    if (isActive && (planType === 'ultimate' || role === 'ultimate_account')) {
      return {
        icon: <FaGem className={styles.planIcon} />,
        title: ultimatePlan?.name || 'Ultimate Plan',
        description:
          ultimatePlan?.description ||
          'You have access to all premium features.',
        buttonText: 'Manage Plan',
        buttonClass: styles.manageButton,
      };
    } else if (isActive && (planType === 'pro' || role === 'pro_account')) {
      return {
        icon: <FaCrown className={styles.planIcon} />,
        title: 'Upgrade Available',
        description: ultimatePlan
          ? `Upgrade to ${ultimatePlan.name} for $${ultimatePlan.price}/${ultimatePlan.billingInterval.replace('ly', '')}`
          : 'Unlock all features with Ultimate plan.',
        buttonText: `Upgrade to ${ultimatePlan?.planType?.charAt(0).toUpperCase() + ultimatePlan?.planType?.slice(1) || 'Ultimate'}`,
        buttonClass: styles.upgradeButton,
      };
    } else {
      const recommendedPlan = proPlan || plans[0];
      return {
        icon: <IoDiamondSharp className={styles.planIcon} />,
        title: 'Unlock Premium',
        description: recommendedPlan
          ? `Start with ${recommendedPlan.name} for just $${recommendedPlan.price}/${recommendedPlan.billingInterval.replace('ly', '')}`
          : 'Get advanced AI features and priority support.',
        buttonText: 'View Plans',
        buttonClass: styles.upgradeButton,
      };
    }
  };

  const content = getSubscriptionContent();

  return (
    <div className={styles.subscriptionContainer}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>{content.icon}</div>
        <h4 className={styles.title}>{content.title}</h4>
      </div>

      <p className={styles.description}>{content.description}</p>

      <button
        className={`${styles.actionButton} ${content.buttonClass}`}
        onClick={handleUpgrade}
        disabled={loading}
      >
        <span>{content.buttonText}</span>
        <FaArrowRight className={styles.arrowIcon} />
      </button>
    </div>
  );
};

export default SubscriptionCard;
