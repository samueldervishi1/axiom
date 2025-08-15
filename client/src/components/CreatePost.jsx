import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { openDB } from 'idb';
import { useAuth } from '../auth/AuthContext';
import { MdDelete, MdSchedule, MdPublish, MdImage } from 'react-icons/md';
import { LuSendHorizontal } from 'react-icons/lu';
import { BiCalendar } from 'react-icons/bi';
import styles from '../styles/post.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const PostForm = ({ onPostCreated }) => {
  const { userId, username } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleImageSelect = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showSnackbar('Image file too large (max 10MB)', 'error');
          return;
        }

        if (!file.type.startsWith('image/')) {
          showSnackbar('Please select an image file', 'error');
          return;
        }

        setSelectedImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    },
    [showSnackbar]
  );

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, []);

  const handlePostSubmit = useCallback(
    async (content, isOffline = false) => {
      if (
        isSubmitting ||
        !username ||
        !userId ||
        !content?.trim() ||
        (isOffline && !content)
      )
        return;

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
          // Scheduled posts don't support images yet
          const payload = {
            content,
            authorId: userId,
            authorName: username,
            scheduledFor: scheduledDateTime + ':00',
          };

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
          // Regular posts with optional image
          if (selectedImage) {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('authorId', userId);
            formData.append('authorName', username);
            formData.append('image', selectedImage);

            response = await axios.post(`${API_URL}posts/create`, formData, {
              withCredentials: true,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } else {
            const payload = {
              content,
              authorId: userId,
              authorName: username,
            };

            response = await axios.post(`${API_URL}posts/create`, payload, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              },
            });
          }
        }

        if (response.status === 200) {
          const message = isScheduled
            ? `Post scheduled for ${new Date(scheduledDateTime).toLocaleString()}!`
            : 'Post created successfully!';
          showSnackbar(message);

          setPostContent('');
          setIsScheduled(false);
          setScheduledDateTime('');
          setShowScheduleInput(false);
          setSelectedImage(null);
          setImagePreview(null);
          onPostCreated?.();
        }
      } catch (error) {
        if (!navigator.onLine && !isScheduled) {
          await savePostOffline(content);
          showSnackbar(
            'Post saved offline. It will be sent when you are online.',
            'warning'
          );
          throw new Error(
            `Post saved offline: ${error?.message || 'Unknown error'}`
          );
        } else {
          const errorMsg = isScheduled
            ? 'Error scheduling post. Please try again.'
            : 'Error creating post. Please try again.';
          showSnackbar(errorMsg, 'error');
          throw new Error(
            `Post submission failed: ${error?.message || 'Unknown error'}`
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      username,
      userId,
      isScheduled,
      scheduledDateTime,
      selectedImage,
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

  const placeholderText = useMemo(() => {
    return username
      ? `What's on your mind today, ${username}?`
      : "What's on your mind today...";
  }, [username]);

  const handleClearInput = () => {
    setPostContent('');
    setIsScheduled(false);
    setScheduledDateTime('');
    setShowScheduleInput(false);
    setSelectedImage(null);
    setImagePreview(null);
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

        {imagePreview && (
          <div className={styles.image_preview_container}>
            <img
              src={imagePreview}
              alt='Preview'
              className={styles.image_preview}
            />
            <button
              type='button'
              onClick={handleRemoveImage}
              className={styles.remove_image_btn}
              title='Remove image'
            >
              <MdDelete />
            </button>
          </div>
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
          <input
            type='file'
            accept='image/*'
            onChange={handleImageSelect}
            className={styles.image_input}
            id='image-upload'
          />
          <label
            htmlFor='image-upload'
            className={styles.image_btn}
            title='Add image'
          >
            <MdImage />
          </label>
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
              isSubmitting || !username || !userId || !postContent.trim()
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
