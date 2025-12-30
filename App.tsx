import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Landing from './views/Landing.tsx';
import MapView from './views/MapView.tsx';
import ShareView from './views/ShareView.tsx';
import Guidelines from './views/Guidelines.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/share" element={<ShareView />} />
          <Route path="/guidelines" element={<Guidelines />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;