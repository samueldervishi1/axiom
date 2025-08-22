import { useState, useEffect } from 'react';
import styles from '../styles/connect.module.css';
import userDefaultImage from '../assets/user.webp';
import { getUserIdFromServer } from '../auth/authUtils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Connect = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = async (pageNumber = 0, reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}users?page=${pageNumber}`, {
        withCredentials: true,
      });

      const data = response.data;

      // Filter out the current user from the list
      const filteredUsers = (data.content || data).filter(
        (user) => user.id !== currentUserId
      );

      if (reset) {
        setUsers(filteredUsers);
      } else {
        setUsers((prev) => [...prev, ...filteredUsers]);
      }

      // Use backend pagination metadata
      if (data.last !== undefined) {
        setHasMore(!data.last);
      } else {
        setHasMore(filteredUsers.length > 0);
      }
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
      fetchUsers(0, true);
    }
  }, [currentUserId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage);
  };

  const renderProfileImage = (user) => {
    if (user.profileImageData && user.profileImageContentType) {
      return `data:${user.profileImageContentType};base64,${user.profileImageData}`;
    }
    return userDefaultImage;
  };

  const UserCard = ({ user }) => (
    <div className={styles.user_card}>
      <div className={styles.user_avatar}>
        <img
          src={renderProfileImage(user)}
          alt={user.fullName}
          className={styles.avatar_image}
        />
      </div>
      <div className={styles.user_info}>
        <h3 className={styles.user_name}>{user.fullName}</h3>
        {user.title && <p className={styles.user_title}>{user.title}</p>}
        {user.bio && <p className={styles.user_bio}>{user.bio}</p>}
        <div className={styles.user_stats}>
          <span className={styles.stat}>
            {user.followers?.length || 0} followers
          </span>
          <span className={styles.stat}>
            {user.following?.length || 0} following
          </span>
        </div>
      </div>
      <div className={styles.user_actions}>
        <button className={styles.connect_button}>Connect</button>
        <button className={styles.message_button}>Message</button>
      </div>
    </div>
  );

  return (
    <div className={styles.connect_container}>
      <div className={styles.connect_card}>
        <div className={styles.connect_header}>
          <h1>People you may know</h1>
          <p>Connect with professionals in your network</p>
        </div>

        <div className={styles.users_grid}>
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {loading && (
          <div className={styles.loading_container}>
            <div className={styles.loading_spinner}></div>
            <p>Loading more people...</p>
          </div>
        )}

        {hasMore && !loading && users.length > 0 && (
          <div className={styles.load_more_container}>
            <button
              className={styles.load_more_button}
              onClick={handleLoadMore}
            >
              Show more people
            </button>
          </div>
        )}

        {!hasMore && users.length > 0 && (
          <div className={styles.end_message}>
            <p>You've seen all available connections!</p>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className={styles.empty_state}>
            <h3>No people found</h3>
            <p>Try refreshing the page or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect;
