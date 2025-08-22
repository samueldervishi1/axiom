import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoInformationCircleOutline } from 'react-icons/io5';
import styles from '../styles/addToYourFeed.module.css';
import userDefaultImage from '../assets/user.webp';
import { getUserIdFromServer } from '../auth/authUtils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ConnectSidebar = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}users?page=0`, {
        withCredentials: true,
      });

      const data = response.data;
      const filteredUsers = (data.content || data)
        .filter((user) => user.id !== currentUserId)
        .slice(0, 3); // Only show 3 users in sidebar

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const userId = await getUserIdFromServer();
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Failed to get current user ID:', error);
      }
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
      fetchUsers();
    }
  }, [currentUserId]);

  const renderProfileImage = (user) => {
    if (user.profileImageData && user.profileImageContentType) {
      return `data:${user.profileImageContentType};base64,${user.profileImageData}`;
    }
    return userDefaultImage;
  };

  const handleConnect = () => {};

  const handleViewAll = () => {
    navigate('/connect');
  };

  return (
    <div className={styles.feed_container}>
      <div className={styles.header}>
        <h4>People you may know</h4>
        <div
          className={styles.info_icon_container}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <IoInformationCircleOutline className={styles.info_icon} />
          {showTooltip && (
            <div className={styles.tooltip}>
              Connect with professionals in your network to see their updates in
              your feed
            </div>
          )}
        </div>
      </div>

      <div className={styles.companies_list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={styles.company_item}>
              <div className={styles.company_logo}>
                <img
                  src={renderProfileImage(user)}
                  alt={user.fullName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <div className={styles.company_info}>
                <h5 className={styles.company_name}>{user.fullName}</h5>
                {(user.title || user.bio) && (
                  <p className={styles.company_description}>
                    {user.title || user.bio}
                  </p>
                )}
                <button
                  className={styles.connect_button}
                  onClick={() => handleConnect(user.id)}
                >
                  Connect
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className={styles.view_all_button} onClick={handleViewAll}>
        View all recommendations
      </button>
    </div>
  );
};

export default ConnectSidebar;
