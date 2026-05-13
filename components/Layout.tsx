import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ICONS, COLORS } from '../constants.tsx';
import { StarlingFlock } from './StarlingFlock';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {
      name: 'Explore Map', path: '/map',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
      desc: 'See anonymous stories near you',
    },
    {
      name: 'Resources', path: '/resources',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
      desc: 'Peer & community resources',
    },
    {
      name: 'Share a Note', path: '/share',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      desc: 'Add your voice anonymously',
    },
    {
      name: 'Guidelines', path: '/guidelines',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      desc: 'Safe sharing standards',
    },
  ];

  return (
    <div className={`flex flex-col selection:bg-[#448a7d] selection:text-white ${location.pathname === '/map' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}>
      {location.pathname !== '/map' && <StarlingFlock />}
      <div className="bg-[#fbd6d1] border-b border-[#e57c6e]/20 py-3 px-4 flex-shrink-0 text-center z-50">
        <p className="text-xs md:text-sm font-semibold text-[#1e3a34]">
          Starlings is not crisis support. If you need support right now, you can find care options
          <a href="https://www.starlings.ca/community-crisis-lines" className="ml-1 underline hover:text-[#e57c6e] transition-colors">here</a>.
        </p>
      </div>

      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-white z-[5000] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src={`${import.meta.env.BASE_URL}logo-star.avif`} alt="Starlings" className="w-24 md:w-32 h-auto transition-transform group-hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${location.pathname === link.path
                  ? 'text-[#448a7d]'
                  : 'text-gray-400 hover:text-[#1e3a34]'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/share"
              className="bg-[#1e3a34] text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-[#2d5a52] transition-all shadow-md shadow-teal-900/10"
            >
              Share Now
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-[#1e3a34]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? ICONS.X : ICONS.Menu}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-[0_24px_48px_-12px_rgba(30,58,52,0.18)] z-50 overflow-hidden"
            >
              <div className="px-4 pt-3 pb-5">
                {navLinks.map((link, i) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-4 px-3 py-3.5 rounded-2xl transition-colors ${isActive ? 'bg-[#e8f3f1]' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-[#1e3a34] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {link.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black text-sm leading-tight ${isActive ? 'text-[#1e3a34]' : 'text-gray-800'}`}>{link.name}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{link.desc}</p>
                        </div>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#448a7d] shrink-0" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: navLinks.length * 0.06 }}
                  className="mt-3 pt-3 border-t border-gray-100"
                >
                  <Link
                    to="/share"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2.5 w-full bg-[#1e3a34] hover:bg-[#2d5a52] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors active:scale-95"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Share What Helped
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className={`flex-grow relative flex flex-col ${location.pathname === '/map' ? 'overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.993 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.004 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="flex-grow flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {location.pathname !== '/map' && (
        <footer className="bg-[#1e3a34] text-white py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
              <div className="max-w-md">
                <h3 className="font-bold text-3xl mb-6">starlings community</h3>
                <p className="text-teal-100/60 leading-relaxed font-light">
                  Empowering youth impacted by family substance use through community, healing, and hope.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-16 gap-y-4">
                <div>
                  <p className="font-bold text-[#e57c6e] uppercase tracking-widest text-xs mb-4">Project</p>
                  <div className="flex flex-col gap-3">
                    <Link to="/map" className="text-sm text-teal-100/80 hover:text-white transition-colors">Support Map</Link>
                    <Link to="/resources" className="text-sm text-teal-100/80 hover:text-white transition-colors">Resources</Link>
                    <Link to="/share" className="text-sm text-teal-100/80 hover:text-white transition-colors">Submit Note</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-teal-100/40 border-t border-white/5 pt-12 text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Starlings Community.</p>
              <p>Starlings is not crisis support. If you need support right now, you can find care options <a href="https://www.starlings.ca/community-crisis-lines" className="underline hover:text-[#e57c6e] transition-colors">here</a>.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
