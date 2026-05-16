import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ICONS, COLORS, EASE_OUT_EXPO } from '../constants.tsx';
import { StarlingFlock } from './StarlingFlock';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {
      name: 'Explore Map', path: '/map',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
      desc: 'See anonymous stories near you',
      illustration: (
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="9" width="30" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M14 9v22M26 9v22" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 2.5" opacity="0.6"/>
          <path d="M5 19h30" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 2.5" opacity="0.6"/>
          <path d="M20 11.5c-2.2 0-4 1.8-4 4 0 3 4 7.5 4 7.5s4-4.5 4-7.5c0-2.2-1.8-4-4-4z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="20" cy="15.5" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="13" r="1" fill="currentColor" fillOpacity="0.35"/>
          <circle cx="33" cy="27" r="1" fill="currentColor" fillOpacity="0.35"/>
        </svg>
      ),
    },
    {
      name: 'Resources', path: '/resources',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
      desc: 'Peer & community resources',
      illustration: (
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 7h22v26H9z" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M9 33a2.5 2.5 0 0 1 2.5-2.5H31" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M14 16h12M14 20.5h8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M14 11.5h7" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
          <circle cx="32" cy="9" r="2" fill="currentColor" fillOpacity="0.4"/>
          <circle cx="35" cy="6" r="1.2" fill="currentColor" fillOpacity="0.25"/>
          <circle cx="29" cy="6.5" r="1" fill="currentColor" fillOpacity="0.2"/>
          <circle cx="35" cy="13" r="0.8" fill="currentColor" fillOpacity="0.2"/>
        </svg>
      ),
    },
    {
      name: 'Share a Note', path: '/share',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      desc: 'Add your voice anonymously',
      illustration: (
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="10" width="20" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M13 17h10M13 21h7M13 25h5" stroke="currentColor" strokeWidth="1.3" opacity="0.6"/>
          <path d="M24 8l4 4-2 2-4-4z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M26 6a2 2 0 0 1 2.83 0l.5.5A2 2 0 0 1 29 9.33L25 12l-3 1 1-3z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="33" cy="9" r="1.5" fill="currentColor" fillOpacity="0.35"/>
          <circle cx="36" cy="6" r="1" fill="currentColor" fillOpacity="0.22"/>
          <circle cx="31" cy="5.5" r="0.8" fill="currentColor" fillOpacity="0.2"/>
          <circle cx="36" cy="14" r="0.8" fill="currentColor" fillOpacity="0.18"/>
        </svg>
      ),
    },
    {
      name: 'Guidelines', path: '/guidelines',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      desc: 'Safe sharing standards',
      illustration: (
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 5L8 10v8c0 7.5 5.5 14 12 16.5C26.5 32 32 25.5 32 18v-8L20 5z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M15 20l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="34" cy="9" r="1.5" fill="currentColor" fillOpacity="0.35"/>
          <circle cx="6" cy="11" r="1.2" fill="currentColor" fillOpacity="0.25"/>
          <circle cx="36" cy="20" r="1" fill="currentColor" fillOpacity="0.2"/>
          <circle cx="5" cy="22" r="0.8" fill="currentColor" fillOpacity="0.15"/>
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex flex-col selection:bg-[#448a7d] selection:text-white ${location.pathname === '/map' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}>
      {location.pathname !== '/map' && <StarlingFlock />}

      {/* Mobile full-screen nav overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu-overlay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            className="md:hidden fixed inset-0 z-[9999] bg-[#0f2620] overflow-y-auto flex flex-col"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Atmospheric orbs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#448a7d]/30 rounded-full blur-[90px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#e57c6e]/18 rounded-full blur-[70px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            <div className="absolute top-1/2 right-4 w-40 h-40 bg-[#448a7d]/12 rounded-full blur-[50px] -translate-y-1/2 pointer-events-none" />

            {/* Dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
              }}
            />

            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="flex items-center justify-between px-6 pt-7 pb-3 relative z-10 flex-shrink-0"
            >
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <img
                  src={`${import.meta.env.BASE_URL}logo-star.avif`}
                  alt="Starlings"
                  className="w-24 h-auto brightness-0 invert opacity-85"
                />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/18 active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </motion.div>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE_OUT_EXPO }}
              className="px-6 pt-3 pb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#448a7d] relative z-10 flex-shrink-0"
            >
              Navigate
            </motion.p>

            {/* Nav links */}
            <nav className="flex-1 px-5 pt-2 relative z-10">
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.48, ease: EASE_OUT_EXPO, delay: 0.18 + i * 0.075 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between gap-3 py-[1.1rem] border-b group transition-all ${
                        isActive ? 'border-white/20' : 'border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-[10px] font-black tabular-nums text-[#448a7d]/60 w-5 shrink-0 leading-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className={`font-black italic leading-none tracking-tight transition-colors ${
                            isActive
                              ? 'text-[#e57c6e] text-[1.65rem]'
                              : 'text-white/80 group-hover:text-white text-[1.65rem]'
                          }`}>
                            {link.name}
                          </p>
                          <p className="text-[11px] text-white/30 font-medium mt-1.5 not-italic leading-none">
                            {link.desc}
                          </p>
                        </div>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#e57c6e]/18 text-[#e57c6e]'
                          : 'bg-white/[0.06] text-white/45 group-hover:bg-white/12 group-hover:text-white/75'
                      }`}>
                        {link.illustration}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.18 + navLinks.length * 0.075 }}
              className="px-5 pt-5 pb-10 relative z-10 flex-shrink-0"
            >
              <Link
                to="/share"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-3 w-full bg-[#e57c6e] hover:bg-[#e8836f] active:scale-[0.98] text-white py-[1.05rem] rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-[#e57c6e]/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Share What Helped
              </Link>
              <p className="text-center text-[10px] text-white/22 font-medium mt-3 tracking-wide">
                Anonymous &amp; always free
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="md:hidden p-2 text-[#1e3a34] relative z-[10000]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? ICONS.X : ICONS.Menu}
          </button>
        </div>
      </header>

      <main className={`relative flex min-h-0 flex-grow flex-col ${location.pathname === '/map' ? 'overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.993 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.004 }}
            transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
            className="flex min-h-0 flex-grow flex-col"
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
