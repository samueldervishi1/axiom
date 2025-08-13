import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import styles from '../styles/modal.module.css';
import { getUserIdFromServer } from '../auth/authUtils';

const API_URL = import.meta.env.VITE_API_URL;

const UserPostsModal = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (isOpen) {
      resetAndFetchPosts();
    }
  }, [isOpen]);

  const resetAndFetchPosts = async () => {
    setCurrentPage(0);
    setPosts([]);
    setHasNext(false);
    setTotalElements(0);
    await fetchUserPosts(0, true);
  };

  const fetchUserPosts = async (page = 0, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const userId = await getUserIdFromServer();
      const response = await axios.get(
        `${API_URL}posts/user/${userId}?page=${page}&size=3`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;
      const filteredPosts = data.content.filter((post) => !post.deleted);

      if (reset) {
        setPosts(filteredPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...filteredPosts]);
      }

      setCurrentPage(data.currentPage);
      setHasNext(data.hasNext === 'true' || data.hasNext === true);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const handleShowMore = async () => {
    const modalContent = document.querySelector(`.${styles.postsModalContent}`);
    const currentScrollPosition = modalContent?.scrollTop || 0;

    await fetchUserPosts(currentPage + 1, false);

    // Maintain scroll position after new content loads
    setTimeout(() => {
      if (modalContent) {
        modalContent.scrollTop = currentScrollPosition;
      }
    }, 50);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContainer} ${styles.postsModalContainer}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Your Posts</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={`${styles.modalContent} ${styles.postsModalContent}`}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading your posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't created any posts yet.</p>
            </div>
          ) : (
            <div className={styles.postsContainer}>
              {posts.map((post) => (
                <div key={post.id} className={styles.postItem}>
                  <div className={styles.postContent}>
                    <p>{post.content}</p>
                  </div>
                  <div className={styles.postMeta}>
                    <span className={styles.postDate}>
                      {formatDate(post.createdAt)}
                    </span>
                    <span className={styles.postId}>Post #{post.id}</span>
                  </div>
                </div>
              ))}

              {hasNext && (
                <div className={styles.showMoreContainer}>
                  <button
                    className={styles.showMoreButton}
                    onClick={handleShowMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className={styles.smallSpinner}></div>
                        Loading more...
                      </>
                    ) : (
                      `Show More (${totalElements - posts.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPostsModal;
