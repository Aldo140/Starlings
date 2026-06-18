import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import Layout from './components/Layout.tsx';
import Landing from './views/Landing.tsx';
import { apiService } from './services/api.ts';

// Non-landing routes lazy-loaded so framer-motion, leaflet, etc.
// are not bundled into the initial JS payload.
const MapView = React.lazy(() => import('./views/MapView.tsx'));
const ShareView = React.lazy(() => import('./views/ShareView.tsx'));
const Guidelines = React.lazy(() => import('./views/Guidelines.tsx'));
const ResourcesView = React.lazy(() => import('./views/ResourcesView.tsx'));
const AddResourceView = React.lazy(() => import('./views/AddResourceView.tsx'));
const AboutMap = React.lazy(() => import('./views/AboutMap.tsx'));

const RouteFallback: React.FC = () => (
  <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="h-12 w-12 rounded-[42%_58%_55%_45%/48%_44%_56%_52%] bg-gradient-to-br from-[#448a7d] to-[#e57c6e]"
        animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a34]/45">
        Loading page
      </span>
    </div>
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    // Attempt to sync any queued posts on initial mount
    apiService.syncOfflinePosts();

    // Pre-fetch the sheet-sourced flagged word list so it's ready before
    // any submission check runs. Fails silently — static BANNED_PATTERNS
    // remain active as fallback.
    apiService.getFlaggedWords();

    // Listen for browser gaining network connection
    const handleOnline = () => {
      apiService.syncOfflinePosts();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Layout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<AboutMap />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/resources" element={<ResourcesView />} />
              <Route path="/add-resource" element={<AddResourceView />} />
              <Route path="/share" element={<ShareView />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </MotionConfig>
  );
};

export default App;
