import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Landing from './views/Landing.tsx';
import MapView from './views/MapView.tsx';
import ShareView from './views/ShareView.tsx';
import Guidelines from './views/Guidelines.tsx';
import ResourcesView from './views/ResourcesView.tsx';
import AddResourceView from './views/AddResourceView.tsx';
import { apiService } from './services/api.ts';

const App: React.FC = () => {
  useEffect(() => {
    // Attempt to sync any queued posts on initial mount
    apiService.syncOfflinePosts();

    // Listen for browser gaining network connection
    const handleOnline = () => {
      console.log('Network connected. Triggering offline sync...');
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/resources" element={<ResourcesView />} />
          <Route path="/add-resource" element={<AddResourceView />} />
          <Route path="/share" element={<ShareView />} />
          <Route path="/guidelines" element={<Guidelines />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;