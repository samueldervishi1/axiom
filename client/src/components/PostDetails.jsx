import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import userIcon from '../assets/user.webp';
import styles from '../styles/postDetails.module.css';
import { useSocialShare } from '../hooks/useSocialShare.js';
import { usePostInteractions } from '../hooks/usePostInteractions.js';
import { usePostComments } from '../hooks/usePostComments.js';

const API_URL = import.meta.env.VITE_API_URL;

const PostDetails = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const initialState = location.state || {};

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    addComment,
  } = usePostComments(postId);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}posts/${postId}`, {
          withCredentials: true,
        });
        setPost(response.data);
      } catch (err) {
        setError('Failed to load post details');
        console.error('Error fetching post details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId, initialState.initialLikes, initialState.userId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !initialState.userId || isSubmittingComment)
      return;

    setIsSubmittingComment(true);
    try {
      const response = await axios.post(
        `${API_URL}comments/create/${initialState.userId}/${postId}`,
        { content: newComment },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const now = new Date();
        const newCommentObj = {
          commentId: response.data.id || Date.now().toString(),
          userId: initialState.userId,
          postId: postId,
          content: newComment,
          timestamp: now.toISOString(),
        };

        addComment(newCommentObj);
        setCommentCount((prev) => prev + 1);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className='text-center p-5'>Loading...</div>;
  }

  if (error) {
    return <div className='text-center p-5 text-danger'>{error}</div>;
  }

  if (!post) {
    return <div className='text-center p-5'>Post not found</div>;
  }

  return (
    <div className={styles.postDetailsContainer}>
      <button onClick={handleGoBack} className={styles.backButton}>
        <FaArrowLeft /> Back
      </button>
      <div className={styles.postCard}>
        <div className={styles.postHeader}>
          <div className={styles.userInfoContainer}>
            <img
              src={post.userProfilePic || userIcon}
              alt={initialState.username}
              className={styles.userAvatar}
            />
            <div className={styles.userInfo}>
              <h2 className={styles.username}>{initialState.username}</h2>
              <div className={styles.postTime}>
                {post.postDate} {post.postTime && post.postTime.split('.')[0]}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.postContent}>
          <p>{post.content}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt='Post content'
              className={styles.postImage}
            />
          )}
        </div>

        <div className={styles.commentsSection}>
          <h3 className={styles.commentsHeader}>Comments</h3>

          <form onSubmit={handleSubmitComment} className={styles.commentForm}>
            <input
              type='text'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Write a comment...'
              className={styles.commentInput}
              disabled={isSubmittingComment}
            />
            <button
              type='submit'
              className={styles.commentSubmitButton}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
          </form>

          {commentsLoading ? (
            <div className={styles.commentsLoading}>Loading comments...</div>
          ) : commentsError ? (
            <div className={styles.commentsError}>{commentsError}</div>
          ) : comments.length > 0 ? (
            <div className={styles.commentsList}>
              {comments.map((comment) => {
                const formatTimestamp = (timestamp) => {
                  const date = new Date(timestamp);
                  const dateStr = date.toISOString().split('T')[0];
                  const timeStr = date.toTimeString().split(' ')[0];
                  return `${dateStr} ${timeStr}`;
                };

                return (
                  <div key={comment.commentId} className={styles.commentCard}>
                    <div className={styles.commentHeader}>
                      <img
                        src={userIcon}
                        alt='User'
                        className={styles.commentAvatar}
                      />
                      <div className={styles.commentInfo}>
                        <span className={styles.commentUsername}>
                          {comment.userId === initialState.userId
                            ? initialState.username
                            : `User ${comment.userId}`}
                        </span>
                        <span className={styles.bullet}>•</span>
                        <span className={styles.commentTime}>
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.commentContent}>{comment.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.noComments}>No comments yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
