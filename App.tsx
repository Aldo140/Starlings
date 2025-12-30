
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './views/Landing';
import MapView from './views/MapView';
import ShareView from './views/ShareView';
import Guidelines from './views/Guidelines';

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
