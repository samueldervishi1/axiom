import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const usePostComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    if (!postId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching comments for post ${postId}`);

      const response = await axios.get(`${API_URL}comments/post/${postId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Comments response:', response.data);

      if (response.status === 200) {
        const commentsData = Array.isArray(response.data) ? response.data : [];
        console.log('Setting comments:', commentsData);
        setComments(commentsData);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = (newComment) => {
    setComments((prev) => [...prev, newComment]);
  };

  const sortComments = (comments) => {
    return [...comments].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return {
    comments: sortComments(comments),
    loading,
    error,
    refreshComments: fetchComments,
    addComment,
  };
};
