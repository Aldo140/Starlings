
import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';

const Landing: React.FC = () => {
  return (
    <div className="relative overflow-x-hidden bg-white min-h-screen flex flex-col">
      {/* Centered Hero Section - Optimized for Vertical Viewport Safety */}
      <section className="relative flex-grow flex items-center justify-center py-6 md:py-12 px-4 overflow-hidden min-h-[calc(100vh-160px)] md:min-h-[85vh]">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[90vw] h-[90vw] max-w-[800px] bg-[#e8f3f1] rounded-full blur-[100px] opacity-60 animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-15%] w-[80vw] h-[80vw] max-w-[700px] bg-[#fbd6d1] rounded-full blur-[90px] opacity-40 animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container mx-auto max-w-5xl z-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-3 md:space-y-8 animate-reveal">
            {/* Minimalist Badge */}
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1 md:py-2 bg-white/60 backdrop-blur-sm shadow-sm border border-[#448a7d]/10 rounded-full">
              <span className="text-[#1e3a34] font-black text-[7px] md:text-xs uppercase tracking-[0.25em] flex items-center gap-2">
                <span className="text-[#e57c6e] flex items-center">{ICONS.Heart}</span> 
                Healing starts with connection
              </span>
            </div>
            
            {/* Title */}
            <div className="space-y-0 md:space-y-1">
              <h1 className="hero-title font-black text-[#1e3a34]">
                Find your
              </h1>
              <h1 className="hero-title font-black hero-gradient italic pr-1">
                Community.
              </h1>
            </div>
            
            {/* Core Message Block */}
            <div className="max-w-xl mx-auto space-y-2 md:space-y-4">
              <p className="text-[11px] md:text-xl lg:text-2xl text-gray-500 leading-relaxed font-light px-2">
                An anonymous, safe space for youth to share what helps them navigate family substance use.
              </p>
              <div className="inline-block py-0.5 md:py-1 px-3 md:px-4 bg-teal-50 border border-teal-100 rounded-lg">
                <p className="text-[8px] md:text-sm font-bold text-[#448a7d] uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  Shared wisdom. Collective strength.
                </p>
              </div>
            </div>

            {/* CTAs - Guaranteed visible above fold */}
            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 w-full sm:w-auto px-4 pt-4 md:pt-4">
              <Link 
                to="/map" 
                className="group w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 bg-[#1e3a34] text-white rounded-[2rem] font-bold text-sm md:text-xl hover:bg-[#2d5a52] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_20px_40px_-10px_rgba(30,58,52,0.3)] hover:scale-[1.05] active:scale-95"
              >
                Explore the Map 
                <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>
              </Link>
              <Link 
                to="/share" 
                className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 bg-white text-[#1e3a34] border-2 border-[#1e3a34]/10 rounded-[2rem] font-bold text-sm md:text-xl hover:border-[#1e3a34]/40 transition-all flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-50 active:scale-95"
              >
                Share a Note {ICONS.Plus}
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Images (Safe for Ultra-Wide Desktop) */}
        <div className="absolute top-[20%] left-[6%] hidden 2xl:block animate-reveal" style={{ animationDelay: '0.4s' }}>
           <div className="w-40 h-56 rounded-[2.5rem] overflow-hidden shadow-2xl -rotate-6 border-[6px] border-white group cursor-default">
              <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Self Care" />
           </div>
        </div>
        <div className="absolute bottom-[20%] right-[6%] hidden 2xl:block animate-reveal" style={{ animationDelay: '0.6s' }}>
           <div className="w-48 h-60 rounded-[2.5rem] overflow-hidden shadow-2xl rotate-3 border-[6px] border-white group cursor-default">
              <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Supportive Peers" />
           </div>
        </div>
      </section>

      {/* Philosophy Grid - Fixed Dead Images for Reliable Branding */}
      <section className="bg-gray-50 py-16 md:py-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-10 md:mb-20 space-y-3 md:space-y-4">
            <p className="text-[#448a7d] font-black text-[10px] md:text-xs uppercase tracking-[0.5em]">Our Promise</p>
            <h2 className="text-2xl md:text-5xl font-black text-[#1e3a34] tracking-tight">Rooted in your safety.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                title: "Privacy First",
                desc: "We don’t collect names, emails, or identifying information. Your identity is your own.",
                icon: ICONS.ShieldCheck,
                color: "bg-[#1e3a34]",
                img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600"
              },
              {
                title: "Human Reviewed",
                desc: "Every post is manually checked to ensure our map remains a source of light and hope.",
                icon: ICONS.Heart,
                color: "bg-[#e57c6e]",
                img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600"
              },
              {
                title: "Youth Impact",
                desc: "Designed for youth, by people with lived experience of family substance use.",
                icon: ICONS.Users,
                color: "bg-[#448a7d]",
                img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600"
              }
            ].map((item, idx) => (
              <div key={idx} className="group bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
                <div className="h-44 md:h-56 overflow-hidden relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className={`absolute top-4 md:top-6 left-4 md:left-6 w-10 md:w-14 h-10 md:h-14 ${item.color} rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6`}>
                    <div className="scale-90 md:scale-110">{item.icon}</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 space-y-2 md:space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-[#1e3a34]">{item.title}</h3>
                  <p className="text-sm md:text-lg text-gray-500 font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Support Gallery Section */}
      <section className="bg-white py-16 md:py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8 md:pr-12">
              <h2 className="text-3xl md:text-6xl font-black text-[#1e3a34] tracking-tight leading-tight italic">
                A canvas for <br className="hidden md:block"/> collective healing.
              </h2>
              <p className="text-base md:text-xl text-gray-500 font-light leading-relaxed">
                Starlings is more than a map. It’s a testament to the fact that you aren’t defined by the struggles in your home. We gather the small, everyday strategies that help us stay whole.
              </p>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-4 md:p-6 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-[#448a7d] mb-1">100%</p>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Anonymous Space</p>
                </div>
                <div className="p-4 md:p-6 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-[#e57c6e] mb-1">Peer</p>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Led By Experience</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-3 md:space-y-4 pt-6 md:pt-10">
                   <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=400" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Self Care" />
                   <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Community" />
                </div>
                <div className="space-y-3 md:space-y-4">
                   <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Meditation" />
                   <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=400" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Support" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Immersive Final CTA */}
      <section className="bg-[#1e3a34] py-16 md:py-40 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover mix-blend-overlay" alt="Nature" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6 md:space-y-10">
          <div className="text-[#e57c6e] inline-block scale-[1.5] md:scale-[2.5] animate-pulse">
            {ICONS.Heart}
          </div>
          <h2 className="text-3xl md:text-7xl font-black tracking-tight leading-[1]">
            Healing is <br className="hidden md:block"/> 
            <span className="text-[#448a7d]">Possible.</span>
          </h2>
          <p className="text-base md:text-2xl font-light text-teal-100/50 max-w-2xl mx-auto italic leading-snug">
            "You aren't defined by the struggles in your family; you are defined by how you care for yourself and others."
          </p>
          <div className="pt-4 md:pt-6">
            <Link 
              to="/map" 
              className="inline-flex px-8 md:px-14 py-4 md:py-6 bg-[#e57c6e] text-white rounded-full font-bold text-lg md:text-2xl hover:bg-[#d46a5c] transition-all shadow-2xl active:scale-95"
            >
              Explore the Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
