import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdSchedule, MdRefresh, MdAccessTime } from 'react-icons/md';
import { BiCalendarEvent } from 'react-icons/bi';
import styles from '../styles/scheduledPostsCard.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ScheduledPostsCard = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}posts/scheduled?page=0&size=5`,
        {
          withCredentials: true,
        }
      );

      if (response.data && response.data.content) {
        const onlyScheduled = response.data.content.filter(
          (post) => post.status === 'SCHEDULED'
        );
        setScheduledPosts(onlyScheduled);
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load scheduled posts');
      this.reportError(
        new Error(
          `Failed to load scheduled posts: ${err?.message || 'Unknown error'}`
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();

    const interval = setInterval(fetchScheduledPosts, 120000);

    return () => clearInterval(interval);
  }, []);

  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffMins < 60) {
      return `in ${diffMins}m`;
    } else if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else {
      return `in ${diffDays}d`;
    }
  };

  const getTimeStatus = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;

    if (diffMs < 0) return 'overdue';
    if (diffMs < 3600000) return 'soon';
    return 'scheduled';
  };

  if (loading && scheduledPosts.length === 0) {
    return (
      <div className={styles.card}>
        {/* Background layers */}
        <div className={styles.background_layer}>
          <div className={styles.gradient_orb}></div>
          <div className={styles.gradient_orb_secondary}></div>
        </div>

        <div className={styles.wave_background}>
          <div className={styles.particles}></div>
        </div>

        {/* Floating particles */}
        <div className={styles.floating_particles}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`${styles.particle} ${styles[`particle_${i + 1}`]}`}
            ></div>
          ))}
        </div>

        <div className={styles.header}>
          <div className={styles.title_section}>
            <MdSchedule className={styles.icon} />
            <h3>Scheduled Posts</h3>
          </div>
        </div>

        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Background layers */}
      <div className={styles.background_layer}>
        <div className={styles.gradient_orb}></div>
        <div className={styles.gradient_orb_secondary}></div>
      </div>

      <div className={styles.wave_background}>
        <div className={styles.particles}></div>
      </div>

      {/* Floating particles */}
      <div className={styles.floating_particles}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`${styles.particle} ${styles[`particle_${i + 1}`]}`}
          ></div>
        ))}
      </div>

      {/* Glow effect */}
      <div className={styles.glow_effect}></div>

      <div className={styles.header}>
        <div className={styles.title_section}>
          <MdSchedule className={styles.icon} />
          <h3>Scheduled Posts</h3>
          {scheduledPosts.length > 0 && (
            <span className={styles.count}>{scheduledPosts.length}</span>
          )}
        </div>
        <button
          className={styles.refresh_btn}
          onClick={fetchScheduledPosts}
          disabled={loading}
          title='Refresh scheduled posts'
        >
          <MdRefresh
            className={`${styles.refresh_icon} ${loading ? styles.spinning : ''}`}
          />
          <div className={styles.button_shine}></div>
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.posts_container}>
        {scheduledPosts.length === 0 ? (
          <div className={styles.empty_state}>
            <BiCalendarEvent className={styles.empty_icon} />
            <p>No scheduled posts</p>
            <span>Your scheduled posts will appear here</span>
          </div>
        ) : (
          scheduledPosts.map((post) => (
            <div key={post.id} className={styles.post_item}>
              <div className={styles.post_content}>
                <p className={styles.content}>
                  {post.content.length > 80
                    ? `${post.content.substring(0, 80)}...`
                    : post.content}
                </p>
                <div className={styles.post_meta}>
                  <span className={styles.author}>by {post.authorName}</span>
                </div>
              </div>

              <div className={styles.schedule_info}>
                <div
                  className={`${styles.time_badge} ${styles[getTimeStatus(post.scheduledFor)]}`}
                >
                  <MdAccessTime className={styles.time_icon} />
                  <span>{formatScheduledTime(post.scheduledFor)}</span>
                </div>
                <div className={styles.scheduled_date}>
                  {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {lastUpdated && (
        <div className={styles.footer}>
          <span className={styles.last_updated}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScheduledPostsCard;
