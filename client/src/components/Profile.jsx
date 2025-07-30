import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FaCog,
  FaGithub,
  FaInstagram,
  FaLink,
  FaRegBookmark,
  FaRegCommentAlt,
  FaRegEyeSlash,
  FaRegThumbsUp,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from '../styles/profile.module.css';
import profileAvatar from '../assets/user.webp';
import backgroundImage from '../assets/background.jpg';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [, setLikedPosts] = useState([]);
  const [likedPostsContent, setLikedPostsContent] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Helper function to generate color variations
  const generateColorVariations = (hexColor) => {
    if (!hexColor) return {};

    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return {
      primary: hexColor,
      light: `rgba(${r}, ${g}, ${b}, 0.1)`,
      medium: `rgba(${r}, ${g}, ${b}, 0.3)`,
      gradient: `linear-gradient(135deg, ${hexColor}40, ${hexColor}10)`,
      shadow: `0 4px 20px rgba(${r}, ${g}, ${b}, 0.3)`,
      border: `2px solid ${hexColor}40`,
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const username = await getUsernameFromServer();
        const userId = await getUserIdFromServer();

        const [profileResponse, userPostsResponse, likedResponse] =
          await Promise.all([
            axios.get(`${API_URL}users/lookup/${username}`, {
              withCredentials: true,
            }),
            axios.get(`${API_URL}posts/user/${userId}`, {
              withCredentials: true,
            }),
            axios.get(`${API_URL}posts/likes/user/${userId}`, {
              withCredentials: true,
            }),
          ]);

        setProfile(profileResponse.data);
        setUserPosts(userPostsResponse.data.filter((post) => !post.deleted));
        setLikedPosts(likedResponse.data);

        if (likedResponse.data && likedResponse.data.likedPosts) {
          const likedPostsFiltered = likedResponse.data.likedPosts.filter(
            (post) => !post.deleted
          );
          setLikedPostsContent(likedPostsFiltered);
        } else {
          setLikedPostsContent([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLinkIcon = (link) => {
    try {
      const url = new URL(link);
      const hostname = url.hostname.replace(/^www\./, '');

      if (hostname === 'github.com') {
        return <FaGithub className={styles.socialIcon} />;
      } else if (hostname === 'instagram.com') {
        return <FaInstagram className={styles.socialIcon} />;
      } else {
        return <FaLink className={styles.socialIcon} />;
      }
    } catch (error) {
      console.error('Error getting link icon:', error);
      return <FaLink className={styles.socialIcon} />;
    }
  };

  const getFollowersCount = () => {
    return profile?.followers?.length || 0;
  };

  const getFollowingCount = () => {
    return profile?.following?.length || 0;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <p>Could not load profile. Please try again later.</p>
      </div>
    );
  }

  const colorVariations = generateColorVariations(profile.profileColorHex);

  // const dynamicStyles = {
  //   profileContainer: {
  //     background: colorVariations.gradient,
  //     minHeight: '100vh',
  //     borderRadius: '30px',
  //     marginTop: '10px',
  //     marginBottom: '10px',
  //   },
  //   activeTab: {
  //     borderBottom: `3px solid ${colorVariations.primary}`,
  //     color: colorVariations.primary,
  //   },
  //   avatar: {
  //     border: colorVariations.border,
  //     boxShadow: colorVariations.shadow,
  //   },
  //   aboutCard: {
  //     background: colorVariations.light,
  //     border: `1px solid ${colorVariations.primary}20`,
  //   },
  //   bannerOverlay: {
  //     background: `linear-gradient(45deg, ${colorVariations.primary}60, transparent)`,
  //   },
  //   username: {
  //     color: colorVariations.primary,
  //     fontWeight: 'bold',
  //   },
  //   statHighlight: {
  //     color: colorVariations.primary,
  //   },
  //   postCard: {
  //     borderLeft: `4px solid ${colorVariations.primary}`,
  //     background: colorVariations.light,
  //   },
  // };

  const dynamicStyles = {
    profileContainer: {
      background: `
      ${colorVariations.gradient},
      linear-gradient(135deg, 
        rgba(255, 255, 255, 0.05) 0%,
        transparent 50%,
        rgba(255, 255, 255, 0.05) 100%
      ),
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)
    `,
      minHeight: '100vh',
      borderRadius: '12px',
      marginTop: '10px',
      marginBottom: '10px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: `
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px) scale(1.002)',
        boxShadow: `
        0 32px 64px -12px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15)
      `,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
        radial-gradient(circle at 20% 50%, ${colorVariations.primary}30 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, ${colorVariations.primary}20 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, ${colorVariations.primary}25 0%, transparent 50%)
      `,
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: -1,
      },
    },

    activeTab: {
      borderBottom: `3px solid ${colorVariations.primary}`,
      color: colorVariations.primary,
      boxShadow: `0 4px 8px ${colorVariations.primary}20`,
      transition: 'all 0.2s ease',
    },

    avatar: {
      border: colorVariations.border,
      boxShadow: `
      ${colorVariations.shadow},
      0 0 20px ${colorVariations.primary}30
    `,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: `
        ${colorVariations.shadow},
        0 0 30px ${colorVariations.primary}50
      `,
      },
    },

    aboutCard: {
      background: `
      ${colorVariations.light},
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)
    `,
      border: `1px solid ${colorVariations.primary}20`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '15px',
      transition: 'all 0.3s ease',
      '&:hover': {
        border: `1px solid ${colorVariations.primary}40`,
        transform: 'translateY(-2px)',
        boxShadow: `0 10px 25px rgba(0, 0, 0, 0.1)`,
      },
    },

    bannerOverlay: {
      background: `
      linear-gradient(45deg, ${colorVariations.primary}60, transparent),
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)
    `,
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    },

    username: {
      color: colorVariations.primary,
      fontWeight: 'bold',
      textShadow: `0 2px 4px ${colorVariations.primary}20`,
      transition: 'all 0.2s ease',
    },

    statHighlight: {
      color: colorVariations.primary,
      textShadow: `0 1px 2px ${colorVariations.primary}30`,
      transition: 'all 0.2s ease',
    },

    postCard: {
      borderLeft: `4px solid ${colorVariations.primary}`,
      background: `
      ${colorVariations.light},
      linear-gradient(90deg, ${colorVariations.primary}05 0%, transparent 100%)
    `,
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderLeft: `6px solid ${colorVariations.primary}`,
        transform: 'translateX(4px)',
        boxShadow: `0 8px 25px rgba(0, 0, 0, 0.1)`,
      },
    },
  };

  return (
    <div
      className={styles.profileContainer}
      style={dynamicStyles.profileContainer}
    >
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <img
                src={profileAvatar}
                alt=''
                className={styles.avatar}
                style={dynamicStyles.avatar}
              />
              <div className={styles.nameSection}>
                <h1 className={styles.displayName}>{profile.displayName}</h1>
                <div className={styles.usernameRow}>
                  <h2
                    className={styles.username}
                    style={dynamicStyles.username}
                  >
                    u/{profile.username}
                  </h2>
                  <span
                    className={styles.karmaDisplay}
                    style={dynamicStyles.statHighlight}
                  >
                    • {profile.karma} karma
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.navigationTabs}>
            <button
              className={`${styles.tab} ${
                activeTab === 'overview' ? styles.activeTab : ''
              }`}
              style={activeTab === 'overview' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('overview')}
            >
              OVERVIEW
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === 'posts' ? styles.activeTab : ''
              }`}
              style={activeTab === 'posts' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('posts')}
            >
              POSTS
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === 'comments' ? styles.activeTab : ''
              }`}
              style={activeTab === 'comments' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('comments')}
            >
              <FaRegCommentAlt /> COMMENTS
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === 'saved' ? styles.activeTab : ''
              }`}
              style={activeTab === 'saved' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('saved')}
            >
              <FaRegBookmark /> SAVED
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === 'hidden' ? styles.activeTab : ''
              }`}
              style={activeTab === 'hidden' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('hidden')}
            >
              <FaRegEyeSlash /> HIDDEN
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === 'upvoted' ? styles.activeTab : ''
              }`}
              style={activeTab === 'upvoted' ? dynamicStyles.activeTab : {}}
              onClick={() => setActiveTab('upvoted')}
            >
              <FaRegThumbsUp /> UPVOTED
            </button>
          </div>

          <div className={styles.contentArea}>
            {activeTab === 'posts' && userPosts.length > 0 ? (
              <div className={styles.postsGrid}>
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className={styles.postCard}
                    style={dynamicStyles.postCard}
                  >
                    <p>{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt=''
                        className={styles.postImage}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : activeTab === 'upvoted' && likedPostsContent.length > 0 ? (
              <div className={styles.postsGrid}>
                {likedPostsContent.map((post) => (
                  <div
                    key={post.id}
                    className={styles.postCard}
                    style={dynamicStyles.postCard}
                  >
                    <p>{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt=''
                        className={styles.postImage}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No {activeTab} to show yet</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.aboutCard} style={dynamicStyles.aboutCard}>
            <div
              className={styles.bannerImage}
              style={{
                backgroundImage: `url(${backgroundImage})`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  ...dynamicStyles.bannerOverlay,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            </div>

            <div className={styles.aboutContent}>
              <div className={styles.userHeader}>
                <h3
                  className={styles.headerUsername}
                  style={dynamicStyles.username}
                >
                  {profile.username}
                </h3>
                {profile.bio && (
                  <>
                    <span className={styles.separator}>-</span>
                    <p className={styles.headerBio}>{profile.bio}</p>
                  </>
                )}
                <div className={styles.followStats}>
                  <div className={styles.followItem}>
                    <span
                      className={styles.followCount}
                      style={dynamicStyles.statHighlight}
                    >
                      <a
                        href={`/list/followers/${profile.username}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {getFollowersCount()}
                      </a>
                    </span>
                    <span className={styles.followLabel}>
                      <a
                        href={`/list/followers/${profile.username}`}
                        style={{ textDecoration: 'none' }}
                      >
                        {getFollowersCount() === 1 ? 'follower' : 'followers'}
                      </a>
                    </span>
                  </div>
                  <div className={styles.followItem}>
                    <span
                      className={styles.followCount}
                      style={dynamicStyles.statHighlight}
                    >
                      <a
                        href={`/list/following/${profile.username}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {getFollowingCount()}
                      </a>
                    </span>
                    <span className={styles.followLabel}>
                      <a
                        href={`/list/following/${profile.username}`}
                        style={{ textDecoration: 'none' }}
                      >
                        following
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {profile.links && profile.links.length > 0 && (
                <>
                  <div className={styles.socialLinks}>
                    <div className={styles.linksScroll}>
                      {profile.links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className={styles.socialLink}
                          style={{ borderColor: colorVariations.primary }}
                        >
                          {getLinkIcon(link)}
                          {link.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                  <hr className={styles.divider} />
                </>
              )}

              <div className={styles.userStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Cake Day</span>
                  <span className={styles.statValue}>
                    {new Date(profile.accountCreationDate).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.settingsSection}>
                <h4>Settings</h4>
                <div className={styles.settingRow}>
                  <span
                    className={styles.settingLabel}
                    style={dynamicStyles.username}
                  >
                    u/{profile.username}
                  </span>
                  <Link
                    to={`/settings/profile/${profile.username}`}
                    className={styles.settingsButton}
                    style={{
                      borderColor: colorVariations.primary,
                      color: colorVariations.primary,
                    }}
                  >
                    <FaCog /> Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
