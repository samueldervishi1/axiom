import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { openDB } from 'idb';
import { getUsernameFromServer } from '../auth/authUtils';
import { MdDelete, MdSchedule, MdPublish } from 'react-icons/md';
import { LuSendHorizontal } from 'react-icons/lu';
import { BiCalendar } from 'react-icons/bi';
import styles from '../styles/post.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const PostForm = ({ onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [loadingUsername, setLoadingUsername] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const dbPromise = useMemo(
    () =>
      openDB('socialAppDB', 1, {
        upgrade(db) {
          db.createObjectStore('posts', { keyPath: 'id', autoIncrement: true });
        },
      }),
    []
  );

  const savePostOffline = useCallback(
    async (content) => {
      const db = await dbPromise;
      const post = {
        content,
        postDate: new Date().toISOString().split('T')[0],
        postTime: new Date().toISOString().split('T')[1],
      };
      await db.put('posts', post);
    },
    [dbPromise]
  );

  const getMinDateTime = useCallback(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  }, []);

  const handlePostSubmit = useCallback(
    async (content, isOffline = false) => {
      if (
        isSubmitting ||
        loadingUsername ||
        !username ||
        !userId ||
        !content?.trim() ||
        (isOffline && !content)
      )
        return;

      console.log('Submitting post:', {
        content,
        isScheduled,
        scheduledDateTime,
        username,
        userId,
      });

      if (isScheduled) {
        if (!scheduledDateTime) {
          showSnackbar('Please select a date and time for scheduling', 'error');
          return;
        }

        const selectedTime = new Date(scheduledDateTime);
        const minTime = new Date();
        minTime.setMinutes(minTime.getMinutes() + 1);

        if (selectedTime <= minTime) {
          showSnackbar('Scheduled time must be in the future', 'error');
          return;
        }
      }

      setIsSubmitting(true);

      try {
        let response;

        if (isScheduled) {
          const payload = {
            content,
            authorId: userId,
            authorName: username,
            scheduledFor: scheduledDateTime + ':00',
          };
          console.log('Scheduled post payload:', payload);

          response = await axios.post(
            `${API_URL}posts/create-scheduled`,
            payload,
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          const payload = {
            action: 'CREATE',
            content,
            authorId: userId,
            authorName: username,
          };
          console.log('Regular post payload:', payload);

          response = await axios.post(`${API_URL}posts/create`, payload, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        console.log('Response:', response);

        if (response.status === 200) {
          const message = isScheduled
            ? `Post scheduled for ${new Date(scheduledDateTime).toLocaleString()}!`
            : 'Post created successfully!';
          showSnackbar(message);

          setPostContent('');
          setIsScheduled(false);
          setScheduledDateTime('');
          setShowScheduleInput(false);
          onPostCreated?.();
        }
      } catch (error) {
        console.error('Full error:', error);
        if (!navigator.onLine && !isScheduled) {
          await savePostOffline(content);
          showSnackbar(
            'Post saved offline. It will be sent when you are online.',
            'warning'
          );
        } else {
          console.error('Error creating post:', error);
          const errorMsg = isScheduled
            ? 'Error scheduling post. Please try again.'
            : 'Error creating post. Please try again.';
          showSnackbar(errorMsg, 'error');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      loadingUsername,
      username,
      userId,
      isScheduled,
      scheduledDateTime,
      showSnackbar,
      savePostOffline,
      onPostCreated,
    ]
  );

  const sendOfflinePosts = useCallback(async () => {
    const db = await dbPromise;
    const posts = await db.getAll('posts');
    if (posts.length > 0) {
      for (const post of posts) {
        await handlePostSubmit(post.content, true);
        await db.delete('posts', post.id);
      }
    }
  }, [dbPromise, handlePostSubmit]);

  useEffect(() => {
    window.addEventListener('online', sendOfflinePosts);
    return () => window.removeEventListener('online', sendOfflinePosts);
  }, [sendOfflinePosts]);

  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getUsernameFromServer();
      if (result && typeof result === 'object') {
        setUsername(result.username || result.name || '');
        setUserId(result.id || result.userId || '');
      } else {
        setUsername(result || '');
        setUserId('1');
      }
      setLoadingUsername(false);
    };

    fetchUserData();
  }, []);

  const placeholderText = useMemo(() => {
    return loadingUsername
      ? "What's on your mind today..."
      : `What's on your mind today, ${username}?`;
  }, [loadingUsername, username]);

  const handleClearInput = () => {
    setPostContent('');
    setIsScheduled(false);
    setScheduledDateTime('');
    setShowScheduleInput(false);
  };

  const toggleScheduleMode = () => {
    setIsScheduled(!isScheduled);
    setShowScheduleInput(!showScheduleInput);
    if (isScheduled) {
      setScheduledDateTime('');
    }
  };

  return (
    <form
      className={styles.post_form}
      onSubmit={(e) => {
        e.preventDefault();
        handlePostSubmit(postContent);
      }}
    >
      <div className={styles.input_with_icons}>
        <textarea
          placeholder={placeholderText}
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          rows={1}
          required
          className={styles.textarea}
          style={{ resize: 'none', overflow: 'hidden' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
        {loadingUsername && (
          <span className={styles.animatedDots} aria-label='loading username'>
            ...
          </span>
        )}

        {showScheduleInput && (
          <div className={styles.schedule_container}>
            <BiCalendar className={styles.calendar_icon} />
            <input
              type='datetime-local'
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={getMinDateTime()}
              className={styles.datetime_input}
              required={isScheduled}
            />
            <span className={styles.schedule_text}>
              {scheduledDateTime
                ? `Will post on ${new Date(scheduledDateTime).toLocaleString()}`
                : 'Select date and time'}
            </span>
          </div>
        )}

        <div className={styles.icons_container}>
          <button
            type='button'
            className={`${styles.schedule_btn} ${isScheduled ? styles.schedule_active : ''}`}
            onClick={toggleScheduleMode}
            title={isScheduled ? 'Switch to post now' : 'Schedule post'}
          >
            {isScheduled ? <MdSchedule /> : <MdPublish />}
          </button>

          <button
            type='button'
            className={styles.icon}
            onClick={handleClearInput}
            title='Clear input'
          >
            <MdDelete />
          </button>

          <button
            type='submit'
            className={styles.post_the_post}
            disabled={
              isSubmitting ||
              loadingUsername ||
              !username ||
              !userId ||
              !postContent.trim()
            }
            title={isScheduled ? 'Schedule your post' : 'Share your post'}
          >
            {isSubmitting ? (
              <div className={styles.loading_dots}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            ) : (
              <LuSendHorizontal />
            )}
          </button>
        </div>
      </div>

      {isScheduled && (
        <div className={styles.schedule_status}>
          <MdSchedule className={styles.schedule_icon} />
          <span>This post will be scheduled</span>
        </div>
      )}
    </form>
  );
};

export default PostForm;
