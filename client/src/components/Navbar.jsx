import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { getUserIdFromServer, getUsernameFromServer } from '../auth/authUtils';
import {
  IoSearchOutline,
  IoSettingsOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5';
import { CiLogout } from 'react-icons/ci';
import { SiPoe } from 'react-icons/si';
import { CgProfile } from 'react-icons/cg';
import loaderImage from '../assets/377.gif';
import { IoIosPeople } from 'react-icons/io';
import { TiHome } from 'react-icons/ti';
import { TbPremiumRights } from 'react-icons/tb';
import logo from '../assets/logo.png';
import styles from '../styles/navbar.module.css';

const Navbar = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [, setUserId] = useState(null);
  const [userInitial, setUserInitial] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const getAIModelName = () => {
    if (!subscriptionStatus) {
      return 'Sage Advanced';
    }

    const planType = subscriptionStatus.planType;

    if (planType === 'ultimate') {
      return 'Sage Ultimate';
    } else if (planType === 'pro') {
      return 'Sage Supreme';
    } else {
      return 'Sage Advanced';
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const result = await getUserIdFromServer();
      setUserId(result);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [username, userId] = await Promise.all([
          getUsernameFromServer(),
          getUserIdFromServer(),
        ]);

        setCurrentUsername(username);
        setUserId(userId);

        if (username) {
          setUserInitial(username.charAt(0).toUpperCase());
        }

        // Fetch subscription status
        try {
          const subscriptionResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}subscription/status`,
            {
              withCredentials: true,
            }
          );
          setSubscriptionStatus(subscriptionResponse.data);
        } catch (error) {
          console.warn('Failed to fetch subscription status:', error);
          setSubscriptionStatus(null);
        }

        // Fetch profile image
        if (userId) {
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}profile/${userId}/image`,
              {
                responseType: 'blob',
                withCredentials: true,
              }
            );

            if (response.status === 200 && response.data.size > 0) {
              const imageUrl = URL.createObjectURL(response.data);
              setProfileImageUrl(imageUrl);
            }
          } catch (err) {
            // No profile image - use initials
            throw new Error(
              `Failed to load profile image: ${err?.message || 'Unknown error'}`
            );
          }
        }
      } catch (err) {
        throw new Error(
          `Failed to fetch user data: ${err?.message || 'Unknown error'}`
        );
      }
    };

    fetchUserData();
  }, []);

  const userSettings = [
    {
      name: 'Profile',
      icon: <CgProfile className={styles.dropdown_icon} />,
      type: 'item',
    },
    {
      name: 'Account',
      type: 'title',
    },
    {
      name: 'Settings',
      icon: <IoSettingsOutline className={styles.dropdown_icon} />,
      type: 'item',
    },
    {
      name: 'Help',
      icon: <IoHelpCircleOutline className={styles.dropdown_icon} />,
      type: 'item',
    },
    {
      type: 'divider',
    },
    {
      name: 'Sign out',
      icon: <CiLogout className={styles.dropdown_icon} />,
      type: 'item',
    },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await logout();
      navigate('/login');

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      setIsLoggingOut(false);
      throw new Error(`Logout failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleSettingAction = useCallback(
    async (settingName) => {
      if (settingName === 'Home') {
        navigate('/home');
      } else if (settingName === 'Profile') {
        navigate('/profile');
      } else if (settingName === 'Help') {
        navigate('/settings?section=help');
      } else if (settingName === 'Settings') {
        navigate('/settings');
      } else if (settingName === 'Sign out') {
        handleLogout();
      }
      setIsDropdownOpen(false);
    },
    [navigate, handleLogout]
  );

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(query);
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}search/all?query=${encodedQuery}`,
        { withCredentials: true }
      );
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
      throw new Error(`Search failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, handleSearch]);

  const handleUserClick = (username) => {
    if (username === currentUsername) {
      navigate('/profile');
    } else {
      navigate(`/user/${username}`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className={styles.chat_history1}>
        <div className={styles.history_div_2}>
          <div className={styles.navbar_left}>
            <a style={{ textDecoration: 'none', color: 'black' }} href='/home'>
              <img src={logo} className={styles.logo_image} alt='Axiom Logo' />
            </a>

            <div className={styles.search_container} ref={searchRef}>
              <div className={styles.search_wrapper}>
                <IoSearchOutline className={styles.search_icon} />
                <input
                  type='text'
                  className={styles.search_input}
                  placeholder='Search users...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {showSearchResults && (
                <div className={styles.search_results}>
                  {isSearching ? (
                    <div className={styles.search_loading}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user, index) => (
                      <div
                        key={index}
                        className={styles.search_result_item}
                        onClick={() => handleUserClick(user.username)}
                      >
                        <div className={styles.username}>{user.username}</div>
                        <div className={styles.fullname}>{user.fullName}</div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.no_results}>No users found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.navbar_right}>
            <div className={styles.history_links}>
              <button
                className={styles.nav_item}
                onClick={() => navigate('/home')}
              >
                <TiHome className={styles.icon_p} />
                <span className={styles.nav_text}>Home</span>
              </button>

              <button
                className={styles.nav_item}
                onClick={() => navigate('/connect')}
              >
                <IoIosPeople className={styles.icon_p} />
                <span className={styles.nav_text}>Connect</span>
              </button>

              <button
                className={styles.nav_item}
                onClick={() => navigate('/plan')}
              >
                <TbPremiumRights className={styles.icon_p} />
                <span className={styles.nav_text}>Upgrade</span>
              </button>

              <button
                className={styles.nav_item}
                onClick={() => navigate('/chat')}
              >
                <SiPoe className={styles.icon_p} />
                <span className={styles.nav_text}>{getAIModelName()}</span>
              </button>
            </div>

            <div className={styles.profile_menu} ref={menuRef}>
              <button
                onClick={toggleDropdown}
                className={styles.profile_button}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt='Profile'
                    className={styles.profile_image}
                  />
                ) : (
                  <div className={styles.custom_avatar}>
                    {userInitial || '?'}
                  </div>
                )}
                <span className={styles.nav_text}>Me</span>
              </button>

              <div
                className={`${styles.dropdown_menu} ${
                  isDropdownOpen ? styles.show : ''
                }`}
              >
                {userSettings.map((setting, index) => {
                  if (setting.type === 'title') {
                    return (
                      <div key={index} className={styles.dropdown_title}>
                        {setting.name}
                      </div>
                    );
                  } else if (setting.type === 'divider') {
                    return (
                      <hr key={index} className={styles.dropdown_divider} />
                    );
                  } else {
                    return (
                      <button
                        key={index}
                        className={styles.dropdown_item}
                        onClick={() => {
                          handleSettingAction(setting.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {setting.icon}
                        {setting.name}
                      </button>
                    );
                  }
                })}
              </div>
            </div>

            <div
              className={styles.hamburger}
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <div
                className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`}
              />
              <div
                className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`}
              />
              <div
                className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`}
              />
            </div>

            {isMenuOpen && (
              <div className={styles.mobile_menu}>
                <button
                  className={styles.mobile_item}
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/home');
                  }}
                >
                  <TiHome className={styles.icon_p} />
                  <span>Home</span>
                </button>

                <button
                  className={styles.mobile_item}
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/explore');
                  }}
                >
                  <IoIosPeople className={styles.icon_p} />
                  <span>Connect</span>
                </button>

                <button
                  className={styles.mobile_item}
                  onClick={() => navigate('/plan')}
                >
                  <TbPremiumRights className={styles.icon_p} />
                  <span>Upgrade</span>
                </button>

                <button
                  className={styles.mobile_item}
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/chat');
                  }}
                >
                  <SiPoe className={styles.icon_p} />
                  <span>{getAIModelName()}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoggingOut && (
        <div className={styles.logout_loader}>
          <div className={styles.logout_box}>
            <h2 style={{ color: 'white' }}>Logging Out...</h2>
            <img
              src={loaderImage}
              alt='Logging out...'
              style={{ width: '50px', margin: '10px 0' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
