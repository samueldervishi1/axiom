import React, { useState, useCallback, memo, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/home.module.css';
import CreatePost from './CreatePost';
import { getUsernameFromServer } from '../auth/authUtils';
import axios from 'axios';
import backgroundImage from '../assets/background.jpg';

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

  const handlePostRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const username = await getUsernameFromServer();
        console.log('Username:', username);
        if (username) {
          const profileResponse = await axios.get(
            `${API_URL}users/lookup/${username}`,
            {
              withCredentials: true,
            }
          );
          console.log('Profile data:', profileResponse.data);
          setProfile(profileResponse.data);
        }
      } catch (err) {
        console.error('Failed to get user profile', err);
        console.error('Error details:', err.response?.data);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className={styles.home_container}>
      {/* Left Sidebar - User Profile */}
      <div className={styles.left_sidebar}>
        <div className={styles.profile_card}>
          {/* Banner section - top portion only */}
          <div className={styles.profile_banner}>
            <img
              src={backgroundImage}
              alt='Profile Banner'
              className={styles.banner_image}
            />
          </div>

          {/* Profile content section below banner */}
          <div className={styles.profile_content}>
            <div className={styles.profile_avatar}>
              {isLoadingProfile
                ? '?'
                : profile?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={styles.profile_info}>
              <Link to='/profile' className={styles.profile_name_link}>
                <h3 className={styles.profile_name}>
                  {isLoadingProfile
                    ? 'Loading...'
                    : profile?.fullName || profile?.displayName || 'User'}
                </h3>
              </Link>
              {!isLoadingProfile && (profile?.bio || profile?.profession) && (
                <p className={styles.profile_subtitle}>
                  {profile?.bio && profile?.profession
                    ? `${profile.bio} - ${profile.profession}`
                    : profile?.bio || profile?.profession}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Posts */}
      <div className={styles.main_content}>
        <CreatePost onPostCreated={handlePostRefresh} />
        <Suspense fallback={<LoadingFallback />}>
          <PostList key={refreshTrigger} onPostRefresh={handlePostRefresh} />
        </Suspense>
      </div>

      {/* Right Sidebar - Info and Links */}
      <div className={styles.right_sidebar}>
        <div className={styles.info_card}>
          <h4>Trending Topics</h4>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation.
          </p>
        </div>

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
            <a href='/settings?section=privacy' className={styles.footer_link}>
              Privacy
            </a>
          </div>
          <div className={styles.copyright}>
            <p>&copy; 2025 Axiom. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Home);
