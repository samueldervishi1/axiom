import React, { useState, useCallback, memo, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/home.module.css';
import CreatePost from './CreatePost';
import ConnectSidebar from './ConnectSidebar';
import SubscriptionCard from './SubscriptionCard';
import { getUsernameFromServer, getUserIdFromServer } from '../auth/authUtils';
import axios from 'axios';
import backgroundImage from '../assets/background.jpg';
import { FaCrown, FaGem } from 'react-icons/fa';

const PostList = React.lazy(() => import('./PostList'));

const API_URL = import.meta.env.VITE_API_URL;
const LoadingFallback = memo(() => (
  <div className={styles.loading_container}>Loading...</div>
));
LoadingFallback.displayName = 'LoadingFallback';

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const handlePostRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [username, userId] = await Promise.all([
          getUsernameFromServer(),
          getUserIdFromServer(),
        ]);

        if (username) {
          const profileResponse = await axios.get(
            `${API_URL}users/lookup/${username}`,
            {
              withCredentials: true,
            }
          );
          setProfile(profileResponse.data);
        }

        try {
          const subscriptionResponse = await axios.get(
            `${API_URL}subscription/status`,
            {
              withCredentials: true,
            }
          );
          setSubscriptionStatus(subscriptionResponse.data);
        } catch (err) {
          console.warn('Failed to fetch subscription status:', err);
          setSubscriptionStatus(null);
        }

        if (userId) {
          try {
            const imageResponse = await axios.get(
              `${API_URL}profile/${userId}/image`,
              {
                responseType: 'blob',
                withCredentials: true,
              }
            );

            if (imageResponse.status === 200 && imageResponse.data.size > 0) {
              const imageUrl = URL.createObjectURL(imageResponse.data);
              setProfileImageUrl(imageUrl);
            }
          } catch (err) {
            setProfileImageUrl(null);
            console.warn('Failed to fetch profile image:', err);
          }
        }
      } catch (err) {
        throw new Error(
          `Failed to get user profile: ${err?.message || 'Unknown error'}`
        );
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (profileImageUrl) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  }, [profileImageUrl]);

  return (
    <div className={styles.home_container}>
      <div className={styles.left_sidebar}>
        <div className={styles.profile_card}>
          <div className={styles.profile_banner}>
            <img
              src={backgroundImage}
              alt='Profile Banner'
              className={styles.banner_image}
            />
          </div>

          <div className={styles.profile_content}>
            <div className={styles.profile_avatar}>
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt='Profile'
                  className={styles.profile_avatar_image}
                />
              ) : isLoadingProfile ? (
                '?'
              ) : (
                profile?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div className={styles.profile_info}>
              <Link to='/profile' className={styles.profile_name_link}>
                <div className={styles.profile_name_container}>
                  <h3 className={styles.profile_name}>
                    {isLoadingProfile
                      ? 'Loading...'
                      : profile?.fullName || profile?.displayName || 'User'}
                  </h3>
                  {subscriptionStatus?.subscriptionStatus === 'active' &&
                    (subscriptionStatus?.planType === 'pro' ||
                      subscriptionStatus?.planType === 'ultimate' ||
                      subscriptionStatus?.role === 'pro_account' ||
                      subscriptionStatus?.role === 'ultimate_account') && (
                      <div className={styles.premium_badge}>
                        {subscriptionStatus?.planType === 'ultimate' ||
                        subscriptionStatus?.role === 'ultimate_account' ? (
                          <FaGem
                            className={styles.premium_icon}
                            title='Ultimate Member'
                          />
                        ) : (
                          <FaCrown
                            className={styles.premium_icon}
                            title='Pro Member'
                          />
                        )}
                      </div>
                    )}
                </div>
              </Link>
              {!isLoadingProfile && (profile?.bio || profile?.title) && (
                <p className={styles.profile_subtitle}>
                  {profile?.bio && profile?.title
                    ? `${profile.bio} - ${profile.title}`
                    : profile?.bio || profile?.title}
                </p>
              )}
            </div>
          </div>
        </div>
        <SubscriptionCard currentSubscription={subscriptionStatus} />
      </div>

      <div className={styles.main_content}>
        <CreatePost onPostCreated={handlePostRefresh} />
        <Suspense fallback={<LoadingFallback />}>
          <PostList key={refreshTrigger} onPostRefresh={handlePostRefresh} />
        </Suspense>
      </div>
      <div className={styles.right_sidebar}>
        <ConnectSidebar />
        <div className={styles.footer_links}>
          <div className={styles.link_group}>
            <a href='/settings?section=about' className={styles.footer_link}>
              About
            </a>
            <a href='/settings?section=models' className={styles.footer_link}>
              Models
            </a>
            <a href='/settings?section=help' className={styles.footer_link}>
              Help
            </a>
            <a href='/settings?section=terms' className={styles.footer_link}>
              Terms
            </a>
            <a href='/settings?section=terms' className={styles.footer_link}>
              Privacy
            </a>
          </div>
          <div className={styles.copyright}>
            <p>
              &copy; 2025 Axiom. All rights reserved.{' '}
              <span style={{ color: 'gray', fontSize: '0.8em' }}>
                v6.0.0-rc.25
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Home);
