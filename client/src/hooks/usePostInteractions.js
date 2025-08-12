import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const usePostInteractions = (postId, userId) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserLikedPost = async (userId, postId) => {
    try {
      const url = `${API_URL}posts/liked/${userId}/${postId}`;
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 200) {
        const likeDetails = response.data.likeDetails;

        if (likeDetails && likeDetails.hasLiked !== undefined) {
          const hasLiked =
            likeDetails.hasLiked === 'true' || likeDetails.hasLiked === true;
          return hasLiked;
        } else {
          return false;
        }
      }
      return false;
    } catch (error) {
      throw new Error('Error checking if user liked post:', error);
    }
  };

  const getPostCommentsCount = async (postId) => {
    try {
      console.log(`Fetching comments count for post ${postId}`);
      const response = await axios.get(`${API_URL}comments/${postId}/count`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Comments count response:', response.data);

      if (response.status === 200) {
        if (response.data.response_text) {
          const commentsData = JSON.parse(response.data.response_text);
          console.log('Parsed comments data:', commentsData);
          return commentsData.commentsCount || 0;
        } else {
          console.log('Direct comments count:', response.data.commentsCount);
          return response.data.commentsCount || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting comments count:', error);
      return 0;
    }
  };

  const handleLike = async () => {
    try {
      if (!userId) return;

      setIsLikeAnimating(true);
      const previousLikedState = isLiked;
      setIsLiked((prev) => !prev);

      const response = await axios.post(
        `${API_URL}posts/like/${postId}`,
        {
          userId: userId,
          postId: postId,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const countResponse = await axios.get(
          `${API_URL}posts/count/${postId}`,
          {
            withCredentials: true,
          }
        );
        setLikesCount(countResponse.data.likesCount);

        const userHasLiked = await checkUserLikedPost(userId, postId);
        setIsLiked(userHasLiked);
      } else {
        setIsLiked(previousLikedState);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked((prev) => !prev);
    } finally {
      setTimeout(() => {
        setIsLikeAnimating(false);
      }, 450);
    }
  };

  const refreshCounts = async () => {
    if (!userId || !postId) return;

    try {
      console.log(`Refreshing counts for post ${postId}, user ${userId}`);
      const [postCountResponse, commentsCount, userHasLiked] =
        await Promise.all([
          axios.get(`${API_URL}posts/count/${postId}`, {
            withCredentials: true,
          }),
          getPostCommentsCount(postId),
          checkUserLikedPost(userId, postId),
        ]);

      console.log('Setting likes count:', postCountResponse.data.likesCount);
      console.log('Setting comment count:', commentsCount);
      console.log('Setting is liked:', userHasLiked);

      setLikesCount(postCountResponse.data.likesCount);
      setCommentCount(commentsCount);
      setIsLiked(userHasLiked);
    } catch (error) {
      console.error('Error refreshing post counts:', error);
    }
  };

  useEffect(() => {
    const fetchPostInteractions = async () => {
      if (!userId || !postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await refreshCounts();
      } catch (error) {
        console.error(`Error fetching interactions for post ${postId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostInteractions();
  }, [postId, userId]);

  return {
    isLiked,
    likesCount,
    commentCount,
    isLikeAnimating,
    loading,
    handleLike,
    refreshCounts,
    setCommentCount,
  };
};
