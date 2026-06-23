import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ICONS, COLORS, EASE_OUT_EXPO } from '../constants.tsx';
import { StarlingFlock } from './StarlingFlock';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const location = useLocation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMenuOpen(false);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      const res = await fetch('https://formsubmit.co/ajax/programs@starlings.ca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
          _subject: 'Starlings Support Map — New Contact',
        }),
      });
      if (res.ok) {
        setContactStatus('sent');
        setContactForm({ name: '', email: '', message: '' });
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  };

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
      name: 'About the Map', path: '/about',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
      desc: 'How Starlings works',
      illustration: (
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="18" stroke="#448a7d" strokeWidth="1.5" opacity="0.4" />
          <path d="M24 32v-8M24 18h.01" stroke="#448a7d" strokeWidth="2" strokeLinecap="round" />
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
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[11000] -translate-y-24 rounded-full bg-[#1e3a34] px-5 py-3 text-sm font-black text-white shadow-xl transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
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
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
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
              <Link
                to="/"
                onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}logo-star.avif`}
                  alt="Starlings"
                  className="w-24 h-auto brightness-0 invert opacity-85"
                />
              </Link>
              <button
                ref={closeButtonRef}
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

      <div className="bg-[#ADEBB3] border-b border-[#448a7d]/25 py-3 px-4 flex-shrink-0 text-center z-50">
        <p className="text-xs md:text-sm font-semibold text-[#1e3a34]">
          Starlings is not crisis support. If you need support right now, you can find care options
          <a href="https://www.starlings.ca/community-crisis-lines" className="ml-1 underline hover:text-[#e57c6e] transition-colors">here</a>.
        </p>
      </div>

      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-white z-[5000] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src={`${import.meta.env.BASE_URL}logo-star.avif`} alt="Starlings" className="w-24 md:w-32 h-auto transition-transform group-hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
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

      <main
        id="main-content"
        tabIndex={-1}
        className={`relative flex min-h-0 flex-grow flex-col outline-none ${location.pathname === '/map' ? 'overflow-hidden' : ''}`}
      >
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
        <footer className="bg-[#1e3a34] text-white pt-20 pb-10 px-4">
          <div className="max-w-7xl mx-auto">

            {/* ── Top row: brand + links grid ── */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-0">
              <div className="max-w-sm">
                <h3 className="font-bold text-3xl mb-5">starlings community</h3>
                <p className="text-teal-100/55 leading-relaxed font-light mb-5">
                  Empowering youth impacted by family substance use through community, healing, and hope.
                </p>
                <a
                  href="https://www.starlings.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#448a7d] text-sm font-bold hover:text-white transition-colors"
                >
                  Visit starlings.ca
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-x-14 gap-y-4 flex-shrink-0">
                {/* Project links */}
                <div>
                  <p className="font-bold text-[#e57c6e] uppercase tracking-widest text-xs mb-4">Project</p>
                  <div className="flex flex-col gap-3">
                    <Link to="/map" className="text-sm text-teal-100/75 hover:text-white transition-colors">Support Map</Link>
                    <Link to="/resources" className="text-sm text-teal-100/75 hover:text-white transition-colors">Resources</Link>
                    <Link to="/share" className="text-sm text-teal-100/75 hover:text-white transition-colors">Submit Note</Link>
                    <Link to="/about" className="text-sm text-teal-100/75 hover:text-white transition-colors">About the Map</Link>
                  </div>
                </div>

                {/* Starlings website links */}
                <div>
                  <p className="font-bold text-[#e57c6e] uppercase tracking-widest text-xs mb-4">Starlings</p>
                  <div className="flex flex-col gap-3">
                    <a href="https://www.starlings.ca" target="_blank" rel="noopener noreferrer" className="text-sm text-teal-100/75 hover:text-white transition-colors">Our Website</a>
                    <a href="https://www.starlings.ca" target="_blank" rel="noopener noreferrer" className="text-sm text-teal-100/75 hover:text-white transition-colors">Offerings &amp; Programs</a>
                    <a href="https://www.starlings.ca" target="_blank" rel="noopener noreferrer" className="text-sm text-teal-100/75 hover:text-white transition-colors">About Starlings</a>
                    <a href="https://www.starlings.ca/community-crisis-lines" target="_blank" rel="noopener noreferrer" className="text-sm text-teal-100/75 hover:text-white transition-colors">Crisis Lines</a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Contact Form ── */}
            <div className="border-t border-white/[0.07] mt-14 pt-14 mb-0">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">

                {/* Left: heading */}
                <div className="lg:max-w-[17rem] flex-shrink-0">
                  <p className="font-black text-[#e57c6e] text-[9px] uppercase tracking-[0.34em] mb-2">Get in Touch</p>
                  <h4
                    className="font-cabinet font-black italic text-white tracking-tight leading-[0.96] mb-4"
                    style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.5rem)' }}
                  >
                    Contact Us
                  </h4>
                  <p className="text-teal-100/45 text-[13px] font-light leading-relaxed">
                    Have a question about Starlings or the Support Map? We&apos;d love to hear from you.
                  </p>
                </div>

                {/* Right: form */}
                <div className="flex-1 min-w-0">
                  {contactStatus === 'sent' ? (
                    <div className="rounded-2xl bg-[#448a7d]/14 border border-[#448a7d]/22 p-8 text-center">
                      <div className="mb-3 flex justify-center">
                        <span className="w-10 h-10 rounded-full bg-[#448a7d]/20 border border-[#448a7d]/30 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#448a7d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                      </div>
                      <p className="text-[#448a7d] font-black uppercase tracking-[0.2em] text-[10px] mb-2">Message sent</p>
                      <p className="text-white/60 text-sm font-medium">Thanks for reaching out. We&apos;ll be in touch soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="name"
                          placeholder="Your name"
                          required
                          value={contactForm.name}
                          onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-white/[0.07] border border-white/[0.11] text-white placeholder:text-white/28 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#448a7d]/48 transition-colors"
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Your email"
                          required
                          value={contactForm.email}
                          onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full bg-white/[0.07] border border-white/[0.11] text-white placeholder:text-white/28 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#448a7d]/48 transition-colors"
                        />
                      </div>
                      <textarea
                        name="message"
                        placeholder="Your message"
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                        className="w-full bg-white/[0.07] border border-white/[0.11] text-white placeholder:text-white/28 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#448a7d]/48 transition-colors resize-none"
                      />
                      {contactStatus === 'error' && (
                        <p className="text-[#e57c6e] text-xs font-bold">
                          Something went wrong. Please try again or email us at{' '}
                          <a href="mailto:programs@starlings.ca" className="underline">programs@starlings.ca</a>.
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={contactStatus === 'sending'}
                        className="inline-flex items-center gap-2.5 bg-[#e57c6e] hover:bg-[#d46a5c] disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 py-3 rounded-full text-sm font-bold transition-all shadow-[0_15px_30px_-10px_rgba(229,124,110,0.38)] active:scale-[0.97]"
                      >
                        {contactStatus === 'sending' ? (
                          <>
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          <>
                            Send Message
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4L22 2z" />
                            </svg>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>

            {/* ── Copyright bar ── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-teal-100/35 border-t border-white/[0.05] mt-14 pt-8 text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Starlings Community.</p>
              <p>Starlings is not crisis support. If you need support right now, you can find care options{' '}
                <a href="https://www.starlings.ca/community-crisis-lines" className="underline hover:text-[#e57c6e] transition-colors">here</a>.
              </p>
            </div>

          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
