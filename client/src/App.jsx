import { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import './index.css';
import { useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import RateLimitBlocker from './components/RateLimitBlocker';
import { useRateLimit } from './hooks/useRateLimit';
import { usePageTracker } from './hooks/usePageTracker';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Home = lazy(() => import('./components/Home'));
const ChatAI = lazy(() => import('./components/ChatAI'));
const TermsAndServices = lazy(() => import('./components/Terms'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));
const NotFound = lazy(() => import('./components/NotFound'));
const FAQ = lazy(() => import('./components/FAQ'));
const Settings = lazy(() => import('./components/Settings'));
const DeactivatedAccount = lazy(
  () => import('./components/DeactivatedAccount')
);
const ExplorePage = lazy(() => import('./components/ExplorePage'));
const Profile = lazy(() => import('./components/Profile'));
const UserSettings = lazy(() => import('./components/SettingsProfile'));
const PostDetails = lazy(() => import('./components/PostDetails'));
const FollowerScreen = lazy(() => import('./components/FollowerScreen'));

// Inner component that uses Router context
const AppContent = () => {
  const { isAuthenticated, isDeactivated } = useAuth();
  const {
    isBlocked,
    remainingTime,
    formattedRemainingTime,
    checkRateLimit,
    resetRateLimit,
    forceUnblock,
    getRequestStats,
  } = useRateLimit();

  // Enhanced page tracking (now inside Router context)
  const { getVisitStats } = usePageTracker(checkRateLimit);

  const ProtectedRoute = ({ element }) => {
    if (isBlocked) {
      return null; // Rate limit blocker will handle the display
    }
    if (!isAuthenticated) return <Login />;
    if (isDeactivated) return <Navigate to='/account-deactivated' replace />;
    return element;
  };

  return (
    <div className='App'>
      {/* Rate Limit Blocker Modal */}
      <RateLimitBlocker
        isBlocked={isBlocked}
        remainingTime={remainingTime}
        formattedRemainingTime={formattedRemainingTime}
        onReset={resetRateLimit} // Only for development/debug
        onForceUnblock={forceUnblock} // For migrating old blocks
        getRequestStats={getRequestStats}
        getVisitStats={getVisitStats}
      />

      {!isBlocked && isAuthenticated && !isDeactivated && <Navbar />}

      <Suspense
        fallback={<div style={{ textAlign: 'center' }}>Loading...</div>}
      >
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/terms' element={<TermsAndServices />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/faq' element={<FAQ />} />
          <Route path='/account-deactivated' element={<DeactivatedAccount />} />

          {/* Protected Routes */}
          <Route path='/home' element={<ProtectedRoute element={<Home />} />} />
          <Route
            path='/chat'
            element={<ProtectedRoute element={<ChatAI />} />}
          />
          <Route
            path='/settings'
            element={<ProtectedRoute element={<Settings />} />}
          />
          <Route
            path='/profile'
            element={<ProtectedRoute element={<Profile />} />}
          />
          <Route
            path='/settings/profile/:username'
            element={<ProtectedRoute element={<UserSettings />} />}
          />
          <Route
            path='/post/:postId'
            element={<ProtectedRoute element={<PostDetails />} />}
          />
          <Route
            path='/list/:type/:username'
            element={<ProtectedRoute element={<FollowerScreen />} />}
          />
          <Route
            path='/explore'
            element={<ProtectedRoute element={<ExplorePage />} />}
          />

          {/* Fallback Routes */}
          <Route path='/' element={<Navigate to='/home' replace />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
