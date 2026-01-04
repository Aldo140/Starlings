import React from 'react';
import { ICONS } from '../constants.tsx';

const Guidelines: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header with Visual */}
      <div className="relative h-64 md:h-96 flex items-center justify-center overflow-hidden">
         <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Supportive Hands" />
         <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
         <div className="relative text-center space-y-4 px-6">
            <h1 className="text-4xl md:text-7xl max-[400px]:text-3xl font-black text-[#1e3a34] tracking-tight italic">Safe Sharing.</h1>
            <p className="text-gray-500 max-w-lg mx-auto font-light text-lg">How we keep this space supportive, resilient, and safe for everyone.</p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 max-[400px]:px-4 py-16 md:py-24 max-[400px]:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          
          <div className="lg:col-span-7 space-y-16">
            {/* What's Allowed */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-[#e8f3f1] flex items-center justify-center text-[#448a7d] shadow-sm">
                  <div className="scale-150">{ICONS.ShieldCheck}</div>
                </div>
                <h2 className="text-3xl font-black text-[#1e3a34]">Our Guiding Light</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Hopeful Messages", desc: "Supportive notes that remind peers they aren't alone in their journey." },
                  { title: "Coping Skills", desc: "Specific, healthy strategies that helped you navigate hard moments." },
                  { title: "Helpful Resources", desc: "General mentions of support types like therapy or peer groups." },
                  { title: "Boundaries", desc: "Reflections on setting healthy personal limits for self-preservation." }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-[#f9fbfa] rounded-[2.5rem] border border-gray-100">
                    <h3 className="font-bold text-[#1e3a34] mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm font-light leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What's Not Allowed */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-[#fbd6d1]/40 flex items-center justify-center text-[#e57c6e] shadow-sm">
                  <div className="scale-150">{ICONS.X}</div>
                </div>
                <h2 className="text-3xl font-black text-[#1e3a34]">Protecting Each Other</h2>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Identifying Details", desc: "Full names, specific addresses, emails, or phone numbers." },
                  { title: "Trauma Dumping", desc: "Graphic, detailed descriptions of harmful or traumatic events." },
                  { title: "Crisis Content", desc: "Mentions of immediate self-harm or danger to self/others." },
                  { title: "Spam or Ads", desc: "Promoting brands, paid services, or unrelated web links." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 hover:bg-red-50/30 rounded-3xl transition-colors">
                    <div className="text-[#e57c6e] mt-1">{ICONS.X}</div>
                    <div>
                       <h4 className="font-bold text-[#1e3a34]">{item.title}</h4>
                       <p className="text-gray-400 text-sm font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Process Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-panel p-10 md:p-14 max-[400px]:p-6 rounded-[3.5rem] shadow-2xl border border-white space-y-10 sticky top-32">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-[#1e3a34]">Moderation</h3>
                <p className="text-gray-500 font-light leading-relaxed">
                  Every note is reviewed by a human moderator at Starlings. We prioritize your anonymity and the collective safety of our community. 
                </p>
                <p className="text-gray-500 font-light leading-relaxed">
                  Most reviews happen within 48-72 hours. If a note is rejected, it's usually to protect the author or the community from crisis content.
                </p>
              </div>

              <div className="space-y-4 pt-10 border-t border-gray-100">
                <h3 className="text-2xl font-black text-[#1e3a34]">Privacy</h3>
                <p className="text-gray-500 font-light leading-relaxed">
                  We only map your note to the city level. We never store IP addresses or identifying device data.
                </p>
              </div>

              <div className="p-8 bg-[#1e3a34] rounded-[2.5rem] text-white space-y-6">
                <div className="flex items-center gap-3 text-[#e57c6e]">
                  {ICONS.AlertCircle}
                  <h4 className="font-bold text-xs uppercase tracking-widest">In Crisis?</h4>
                </div>
                <p className="text-sm font-light text-teal-100/60 leading-relaxed italic">
                  "If you are in immediate danger or need someone to talk to right now, please reach out to professional services."
                </p>
                <a 
                  href="https://starlings.ca/crisis" 
                  className="inline-flex items-center gap-2 py-3 px-6 bg-white/10 rounded-full text-xs font-bold hover:bg-white/20 transition-all"
                >
                  International Crisis Lines {ICONS.ArrowRight}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};export default Guidelines;
