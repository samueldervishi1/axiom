import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import loaderImage from '../assets/377.gif';

const PostCard = React.lazy(() => import('./PostCard'));
const API_URL = import.meta.env.VITE_API_URL;

const PostList = ({ onPostRefresh }) => {
  const [posts, setPosts] = useState([]);
  const [error] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [delayOver, setDelayOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [, setTotalElements] = useState(0);
  const [imageCache, setImageCache] = useState(new Map());
  const observer = useRef();

  const preloadImages = async (postsWithImages) => {
    if (postsWithImages.length === 0) return;
    const newCache = new Map(imageCache);

    const imagePromises = postsWithImages.map(async (post) => {
      if (post.hasImage === 'true' || post.hasImage === true) {
        try {
          const response = await axios.get(`${API_URL}posts/${post.id}/image`, {
            withCredentials: true,
            responseType: 'blob',
            timeout: 5000,
          });

          if (response.status === 200 && response.data.size > 0) {
            const imageUrl = URL.createObjectURL(response.data);
            newCache.set(post.id, imageUrl);
            setImageCache(new Map(newCache));
          }
        } catch (error) {
          console.warn(
            `Failed to preload image for post ${post.id}: ${error.message}`
          );
        }
      }
    });
    Promise.allSettled(imagePromises);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayOver(true);
    }, 1500);

    fetchPosts(0, true);

    return () => {
      clearTimeout(timer);
      imageCache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const fetchPosts = async (page = 0, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await axios.get(
        `${API_URL}posts/all?page=${page}&size=5`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;
      const allPosts = data.content || [];

      const filteredPosts = allPosts.filter(
        (post) => !post.deleted && !post.reported
      );

      const postsWithUsernames = await Promise.all(
        filteredPosts.map(async (post) => {
          if (post.authorName) {
            return { ...post, username: post.authorName };
          }
          if (!post.userId) {
            return { ...post, username: 'User Deleted' };
          }

          try {
            const usernameResponse = await axios.get(
              `${API_URL}users/${post.userId}/username`,
              {
                withCredentials: true,
              }
            );
            return { ...post, username: usernameResponse.data };
          } catch (err) {
            this.reportError(
              new Error(
                `Failed to fetch username for user ${post.userId}: ${err?.message || 'Unknown error'}`
              )
            );

            return { ...post, username: 'User Deleted' };
          }
        })
      );

      postsWithUsernames.sort((a, b) => {
        const dateA = new Date(
          a.createTime || a.createdAt || `${a.postDate}T${a.postTime}`
        );
        const dateB = new Date(
          b.createTime || b.createdAt || `${b.postDate}T${b.postTime}`
        );
        return dateB - dateA;
      });

      if (reset) {
        setPosts(postsWithUsernames);
        preloadImages(postsWithUsernames);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...postsWithUsernames]);
        preloadImages(postsWithUsernames);
      }

      setCurrentPage(data.currentPage || page);
      setHasNext(
        data.hasNext === 'true' ||
          data.hasNext === true ||
          data.totalPages > page + 1
      );
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      this.reportError(
        new Error(`Failed to fetch posts: ${err?.message || 'Unknown error'}`)
      );
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const lastPostElementCallbackRef = useCallback(
    (node) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
            fetchPosts(currentPage + 1, false);
          }
        },
        {
          threshold: 0.1,
          rootMargin: '100px',
        }
      );

      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasNext, currentPage]
  );

  if (error) {
    return null;
  }

  if (isLoading || !delayOver) {
    return (
      <div className='text-loader'>
        <img
          src={loaderImage}
          alt='Loading...'
          className='list-loader'
          style={{ width: 30, position: 'relative', left: '45%' }}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className='no-posts-message'
        style={{ textAlign: 'center', marginTop: '20px', color: 'white' }}
      >
        <p style={{ color: 'black' }}>No more posts.</p>
      </div>
    );
  }

  return (
    <div className='post-list' style={{ marginBottom: 15 }}>
      {posts.map((post, index) => (
        <div
          key={post.id}
          className='post-card-wrapper'
          ref={index === posts.length - 1 ? lastPostElementCallbackRef : null}
        >
          <PostCard
            id={post.id}
            content={post.content}
            commentsList={post.commentsList}
            postDate={new Date(post.createdAt).toLocaleDateString()}
            postTime={new Date(post.createdAt).toLocaleTimeString()}
            userId={post.userId}
            username={post.username}
            imageUrl={post.imageUrl}
            hasImage={post.hasImage === 'true' || post.hasImage === true}
            cachedImageUrl={imageCache.get(post.id)}
            onPostRefresh={onPostRefresh}
            savedUserIds={post.savedUserIds || []}
            onPostDeleted={(deletedId) => {
              setPosts((prevPosts) =>
                prevPosts.filter((p) => p.id !== deletedId)
              );
            }}
          />
        </div>
      ))}

      {isLoadingMore && hasNext && (
        <div
          className='infinite-scroll-loader'
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            marginTop: '10px',
          }}
        >
          <img
            src={loaderImage}
            alt='Loading more posts...'
            style={{ width: 30, height: 30 }}
          />
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
            Loading more posts...
          </span>
        </div>
      )}

      {!hasNext && posts.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontSize: '14px',
            borderTop: '1px solid #eee',
            marginTop: '20px',
          }}
        >
          You've reached the end! No more posts.
        </div>
      )}
    </div>
  );
};

export default PostList;
