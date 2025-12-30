
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS, COLORS } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Explore Map', path: '/map' },
    { name: 'Share Note', path: '/share' },
    { name: 'Guidelines', path: '/guidelines' },
  ];

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#448a7d] selection:text-white">
      {/* Crisis Banner */}
      <div className="bg-[#fbd6d1] border-b border-[#e57c6e]/20 py-3 px-4 text-center z-50">
        <p className="text-xs md:text-sm font-semibold text-[#1e3a34]">
          Starlings is not crisis response. If you are in immediate danger, call 988 or local emergency services. 
          <a href="https://starlings.ca/crisis" className="ml-2 underline hover:text-[#e57c6e] transition-colors">Get help now</a>
        </p>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1e3a34] flex items-center justify-center text-white shadow-lg shadow-teal-900/10">
              {ICONS.Heart}
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#1e3a34]">starlings</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  location.pathname === link.path 
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-[#1e3a34]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? ICONS.X : ICONS.Menu}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-border p-6 shadow-2xl z-50 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xl font-bold text-[#1e3a34] py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to="/share" 
              className="bg-[#1e3a34] text-white py-4 rounded-2xl text-center font-bold text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Share What Helped
            </Link>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-[#1e3a34] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-md">
              <h3 className="font-bold text-3xl mb-6">starlings community</h3>
              <p className="text-teal-100/60 leading-relaxed font-light">
                Empowering youth impacted by family substance use through community, healing, and hope. 
                We believe that every youth has the right to feel seen and supported.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              <div>
                <p className="font-bold text-[#e57c6e] uppercase tracking-widest text-xs mb-4">Project</p>
                <div className="flex flex-col gap-3">
                  <Link to="/map" className="text-sm text-teal-100/80 hover:text-white transition-colors">Support Map</Link>
                  <Link to="/share" className="text-sm text-teal-100/80 hover:text-white transition-colors">Submit Note</Link>
                  <Link to="/guidelines" className="text-sm text-teal-100/80 hover:text-white transition-colors">Guidelines</Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-[#e57c6e] uppercase tracking-widest text-xs mb-4">Connect</p>
                <div className="flex flex-col gap-3">
                  <a href="https://starlings.ca" className="text-sm text-teal-100/80 hover:text-white transition-colors">Website</a>
                  <a href="https://starlings.ca/contact" className="text-sm text-teal-100/80 hover:text-white transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-teal-100/40">
              &copy; {new Date().getFullYear()} Starlings Community. Dedicated to the light within us all.
            </p>
            <div className="flex gap-6">
              <span className="text-xs text-teal-100/40 italic">Handcrafted with care for our community.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
