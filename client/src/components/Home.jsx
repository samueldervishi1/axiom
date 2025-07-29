import React, { useEffect, useState, useCallback, memo, Suspense } from 'react';
import styles from '../styles/home.module.css';
import CreatePost from './CreatePost';

const PostList = React.lazy(() => import('./PostList'));
const PopularHashtags = React.lazy(() => import('./PopularHashtags'));
const AnimatedCard = React.lazy(() => import('./AnimatedCard'));
const ScheduledPostsCard = React.lazy(() => import('./ScheduledPostsCard'));

const POST_REFRESH_INTERVAL = 300000;

const LoadingFallback = memo(() => (
  <div className={styles.loading_container}>Loading...</div>
));
LoadingFallback.displayName = 'LoadingFallback';

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const postIntervalId = setInterval(
      handlePostRefresh,
      POST_REFRESH_INTERVAL
    );

    return () => clearInterval(postIntervalId);
  }, [handlePostRefresh]);

  return (
    <div className={styles.home_container}>
      <div className={styles.main_content}>
        <CreatePost onPostCreated={handlePostRefresh} />
        <Suspense fallback={<LoadingFallback />}>
          <PostList key={refreshTrigger} onPostRefresh={handlePostRefresh} />
        </Suspense>
      </div>

      <div className={styles.health_check}>
        <Suspense fallback={<LoadingFallback />}>
          <ScheduledPostsCard />
          <AnimatedCard />
          <PopularHashtags />
        </Suspense>
      </div>
    </div>
  );
};

export default memo(Home);
