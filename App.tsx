import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Layout>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/resources" element={<ResourcesView />} />
            <Route path="/add-resource" element={<AddResourceView />} />
            <Route path="/share" element={<ShareView />} />
            <Route path="/guidelines" element={<Guidelines />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
