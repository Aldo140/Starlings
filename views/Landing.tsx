import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { ICONS } from '../constants.tsx';

const Landing: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [qSuccess, setQSuccess] = useState(false);
  const [qError, setQError] = useState('');

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsSubmittingQ(true);
    setQError('');

    const result = await apiService.submitQuestion(question);
    if (result.flagged) {
      setQError('Your question contains flagged words and cannot be submitted. Please revise it.');
    } else if (result.success) {
      setQSuccess(true);
      setQuestion('');
    } else {
      setQError('Something went wrong. Please try again.');
    }
    setIsSubmittingQ(false);
  };

  return (
    <div className="relative overflow-x-hidden bg-transparent min-h-screen flex flex-col">
      {/* Responsive Viewport Constrained Hero Section */}
      <section className="relative w-full flex-grow flex flex-col items-center justify-center px-4 max-[400px]:px-3 overflow-hidden min-h-[calc(100vh-90px)] py-4">
        {/* Soft Background Gradient for Text Legibility */}
        <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-b from-white via-white/80 to-transparent"></div>

        <div className="container mx-auto max-w-5xl relative z-10 text-center flex flex-col items-center justify-center space-y-3 md:space-y-4 py-2 animate-reveal">

          {/* TOP TEXT BLOCK: Badge, Title, Core Message */}
          <div className="flex flex-col items-center justify-start space-y-2 md:space-y-4 flex-shrink-0">
            {/* Minimalist Badge */}
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1.5 bg-white/60 backdrop-blur-sm shadow-sm border border-[#448a7d]/10 rounded-full">
              <span className="text-[#1e3a34] font-black text-[9px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-[#e57c6e] flex items-center">{ICONS.Heart}</span>
                HEALING STARTS<span className="hidden md:inline"> WITH CONNECTION |</span> For Peers, by peers
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
              <p className="text-[11px] md:text-xl lg:text-2xl max-[400px]:text-[10px] text-gray-500 leading-relaxed font-light px-2">
                An anonymous space for youth to share what helps them navigate family substance use.
              </p>
              <div className="inline-block py-0.5 md:py-1 px-3 md:px-4 bg-teal-50 border border-teal-100 rounded-lg shadow-sm">
                <p className="text-[8px] md:text-sm font-bold text-[#448a7d] uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  Shared wisdom. Collective strength.
                </p>
              </div>
            </div>
          </div>

          {/* MIDDLE IMAGE BLOCK: Inline, elegantly constrained to fit the cluster */}
          <div className="w-full flex-grow flex items-center justify-center overflow-hidden max-h-[25vh] md:max-h-[35vh] min-h-[80px] md:min-h-[120px] relative">
            <img src="/landing-people.jpg" className="w-full h-full object-contain mix-blend-multiply opacity-95" alt="" />
          </div>

          {/* BOTTOM BUTTONS BLOCK: Guaranteed visible below image */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4 w-full px-4 flex-shrink-0 animate-reveal" style={{ animationDelay: '0.2s' }}>
            <Link
              to="/map"
              className="group w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 max-[400px]:px-6 max-[400px]:py-3 bg-[#1e3a34] text-white rounded-[2rem] font-bold text-sm md:text-xl max-[400px]:text-sm hover:bg-[#2d5a52] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_20px_40px_-10px_rgba(30,58,52,0.3)] hover:scale-[1.05] active:scale-95"
            >
              Explore the Map
              <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>
            </Link>
            <Link
              to="/share"
              className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-5 max-[400px]:px-6 max-[400px]:py-3 bg-white text-[#1e3a34] border-2 border-[#1e3a34]/10 rounded-[2rem] font-bold text-sm md:text-xl max-[400px]:text-sm hover:border-[#1e3a34]/40 transition-all flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-50 active:scale-95"
            >
              Share a Note or Resource {ICONS.Plus}
            </Link>
          </div>

        </div>
      </section>

      {/* Philosophy Grid - Fixed Dead Images for Reliable Branding */}
      <section className="relative z-10 bg-white/60 backdrop-blur-md border-t border-white/50 py-16 md:py-32 max-[400px]:py-12">
        <div className="container mx-auto px-6 max-[400px]:px-4 max-w-6xl">
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
                  <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className={`absolute top-4 md:top-6 left-4 md:left-6 w-10 md:w-14 h-10 md:h-14 ${item.color} rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6`}>
                    <div className="scale-90 md:scale-110">{item.icon}</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 max-[400px]:p-6 space-y-2 md:space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-[#1e3a34]">{item.title}</h3>
                  <p className="text-sm md:text-lg text-gray-500 font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Visual Support Gallery Section */}
      < section className="relative z-10 bg-white/40 backdrop-blur-lg border-t border-white/50 py-16 md:py-32 max-[400px]:py-12" >
        <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8 md:pr-12">
              <h2 className="text-3xl md:text-5xl font-black text-[#1e3a34] tracking-tight leading-tight italic">
                A canvas for collective healing.<br className="hidden md:block" /> A space to navigate our experiences together.
              </h2>
              <p className="text-base md:text-xl text-gray-500 font-light leading-relaxed">
                Starlings is more than a map. It’s a testament to the fact that you aren’t alone or defined by the struggles in your home. Here, we gather and share the small, everyday strategies that help us move forward with hope, together.
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
                  <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Self Care" />
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Community" />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-56 md:h-80 object-cover rounded-[2rem] shadow-xl" alt="Meditation" />
                  <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=400" loading="lazy" className="w-full h-40 md:h-64 object-cover rounded-[2rem] shadow-xl" alt="Support" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Premium Q&A Section */}
      < section className="relative bg-[#1e3a34] py-20 md:py-32 overflow-hidden" >
        {/* Background elements */}
        < div className="absolute inset-0 pointer-events-none" >
          <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] bg-[#2d5a52] rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[700px] bg-[#448a7d] rounded-full blur-2xl opacity-20"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </div >

        <div className="container mx-auto px-6 max-[400px]:px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            <div className="lg:col-span-6 space-y-8 md:pr-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-md shadow-lg">
                <span className="text-[#e57c6e] flex items-center">{ICONS.MessageCircle}</span>
                <span className="text-white font-bold text-xs uppercase tracking-widest">Community Q&A</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tight italic leading-tight drop-shadow-sm">
                Unanswered <br /><span className="text-[#e57c6e]">questions?</span>
              </h2>

              <p className="text-lg md:text-xl text-teal-50/90 font-light leading-relaxed max-w-lg">
                Navigating family substance use is complicated. Ask us anything about boundaries, support, or privacy. It’s completely anonymous.
              </p>

              {/* Mock Q&A sample to make it feel alive */}
              <div className="mt-8 p-6 md:p-8 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md relative transform -rotate-1 hover:rotate-0 transition-transform shadow-2xl">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-[#448a7d] to-[#2d5a52] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg transform -rotate-6">?</div>
                <p className="text-white font-bold italic text-lg mb-4 leading-snug">"How do I set boundaries without feeling guilty?"</p>
                <div className="flex gap-4 items-start">
                  <div className="w-1.5 h-12 bg-[#e57c6e] rounded-full flex-shrink-0 mt-1"></div>
                  <p className="text-sm md:text-base text-teal-100/90 font-medium leading-relaxed">Boundaries aren't walls; they are the distance at which you can love someone and yourself simultaneously. Start small.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#fbd6d1] to-[#e8f3f1] opacity-50 rounded-bl-[100%] pointer-events-none"></div>

                {qSuccess ? (
                  <div className="text-center py-12 animate-reveal">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#448a7d] to-[#2d5a52] text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-110 transition-transform rotate-3">
                      <div className="scale-[2.5]">{ICONS.Heart}</div>
                    </div>
                    <h3 className="text-3xl font-black text-[#1e3a34] mb-4">Question Submitted</h3>
                    <p className="text-gray-500 font-medium text-lg mb-10 max-w-sm mx-auto">We'll review your question and it may be featured to help others.</p>
                    <button onClick={() => setQSuccess(false)} className="px-10 py-4 bg-gray-50 text-[#1e3a34] font-black rounded-full hover:bg-gray-100 border border-gray-200 transition-colors uppercase tracking-widest text-sm shadow-sm active:scale-95">Ask Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleQuestionSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-4">
                      <label className="block text-[#1e3a34] font-black text-2xl md:text-3xl tracking-tight mb-2">What's on your mind?</label>
                      <textarea
                        required
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Share your question anonymously..."
                        className="w-full p-6 md:p-8 bg-gray-50 border-2 border-gray-100 focus:border-[#448a7d]/50 rounded-[2rem] min-h-[160px] md:min-h-[200px] text-lg md:text-xl font-medium text-[#1e3a34] transition-all shadow-inner focus:outline-none focus:bg-white placeholder-gray-400 resize-none selection:bg-[#448a7d] selection:text-white"
                      />
                    </div>
                    {qError && (
                      <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl font-bold text-sm animate-reveal flex items-center gap-3">
                        {ICONS.AlertCircle} {qError}
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingQ || !question.trim()}
                        className="w-full relative group overflow-hidden px-8 py-5 bg-[#e57c6e] text-white rounded-[2rem] font-black text-lg md:text-xl uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(229,124,110,0.4)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative flex items-center justify-center gap-3">
                          {isSubmittingQ ? 'Submitting...' : 'Send Question'}
                          {!isSubmittingQ && <span className="group-hover:translate-x-1 transition-transform">{ICONS.ArrowRight}</span>}
                        </span>
                      </button>
                    </div>
                    <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 pt-4 border-t border-gray-100">
                      100% Anonymous & Private
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Immersive Final CTA */}
      < section className="bg-[#1e3a34] py-16 md:py-40 max-[400px]:py-12 text-center text-white relative overflow-hidden" >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover mix-blend-overlay" alt="Nature" />
        </div>
        <div className="max-w-4xl mx-auto px-6 max-[400px]:px-4 relative z-10 space-y-6 md:space-y-10">
          <div className="text-[#e57c6e] inline-block scale-[1.5] md:scale-[2.5] animate-pulse">
            {ICONS.Heart}
          </div>
          <h2 className="text-3xl md:text-7xl font-black tracking-tight leading-[1]">
            Healing is possible. <br className="hidden md:block" />
            <span className="text-[#448a7d]">You are not alone.</span>
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
      </section >
    </div >
  );
};

export default Landing;
