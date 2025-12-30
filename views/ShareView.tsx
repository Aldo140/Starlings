
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { LocationSearchResult } from '../types';
import { HELP_OPTIONS, ICONS } from '../constants';

const ShareView: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    promptA: '',
    promptB: '',
    promptC: '',
    citySearch: '',
    selectedLocation: null as LocationSearchResult | null,
    what_helped: [] as string[],
    confirmAge: false,
    confirmNoDetails: false,
    confirmReviewed: false
  });
  
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Instant local results + Debounced deep results
  useEffect(() => {
    const query = formData.citySearch;
    if (query.length < 2 || formData.selectedLocation) {
      if (!formData.selectedLocation) setLocationResults([]);
      return;
    }

    // Stage 1: Instant Local Search
    const triggerLocalSearch = async () => {
      const local = await apiService.searchLocation(query);
      // Only show local if we haven't already selected a place
      if (!formData.selectedLocation) {
        setLocationResults(local);
      }
    };

    triggerLocalSearch();

    // Stage 2: Debounced Deep Search (Nominatim)
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3 && !formData.selectedLocation) {
        setIsSearching(true);
        const deep = await apiService.deepSearchLocation(query);
        
        // Merge results: keep unique items, prioritize local
        setLocationResults(prev => {
          const combined = [...prev];
          deep.forEach(d => {
            if (!combined.some(c => c.display_name === d.display_name)) {
              combined.push(d);
            }
          });
          return combined.slice(0, 6);
        });
        setIsSearching(false);
      }
    }, 600); // Wait for typing to stop before hitting external API

    return () => clearTimeout(delayDebounceFn);
  }, [formData.citySearch, formData.selectedLocation]);

  const toggleHelpOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      what_helped: prev.what_helped.includes(option)
        ? prev.what_helped.filter(o => o !== option)
        : [...prev.what_helped, option]
    }));
  };

  const handleLocationSelect = (loc: LocationSearchResult) => {
    setFormData(prev => ({
      ...prev,
      selectedLocation: loc,
      citySearch: loc.display_name
    }));
    setLocationResults([]);
  };

  // Helper to highlight matched text in results
  const renderDisplayName = (name: string, query: string) => {
    if (!query) return name;
    const parts = name.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="text-[#1e3a34] font-black underline decoration-[#448a7d]/40">{part}</span> 
            : <span key={i} className="text-gray-400">{part}</span>
        )}
      </span>
    );
  };

  const isFormValid = formData.selectedLocation && 
                      formData.confirmAge && 
                      formData.confirmNoDetails && 
                      formData.confirmReviewed &&
                      (formData.promptA || formData.promptB);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    
    const combinedMessage = [
      formData.promptA ? `One thing that helped me was ${formData.promptA}.` : '',
      formData.promptB ? `A message I'd tell someone else is ${formData.promptB}.` : '',
      formData.promptC ? `A support or system that helped was ${formData.promptC}.` : ''
    ].filter(Boolean).join(' ');

    const result = await apiService.submitPost({
      city: formData.selectedLocation!.address.city || 
            formData.selectedLocation!.address.town || 
            formData.selectedLocation!.address.village || 'Unknown',
      country: formData.selectedLocation!.address.country,
      lat: parseFloat(formData.selectedLocation!.lat),
      lng: parseFloat(formData.selectedLocation!.lon),
      message: combinedMessage,
      what_helped: formData.what_helped
    });

    if (result.success) {
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-reveal">
        <div className="w-20 h-20 bg-[#e8f3f1] rounded-full flex items-center justify-center text-[#448a7d] mx-auto mb-8 shadow-xl">
          <div className="scale-150">{ICONS.ShieldCheck}</div>
        </div>
        <h2 className="text-4xl font-black text-[#1e3a34] mb-4 italic tracking-tight">Note Received.</h2>
        <p className="text-gray-500 mb-10 leading-relaxed font-light text-lg">
          Your reflection has been sent for manual moderation. Once approved, it will appear on the map to support others in our community.
        </p>
        <button 
          onClick={() => navigate('/map')}
          className="px-10 py-5 bg-[#1e3a34] text-white rounded-full font-bold text-lg hover:bg-[#2d5a52] transition-all shadow-2xl active:scale-95"
        >
          Return to Map
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-24 animate-reveal">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-black text-[#1e3a34] italic tracking-tight">Share your light.</h1>
        <p className="text-gray-500 max-w-lg mx-auto font-light leading-relaxed">
          Your experience can provide a roadmap for someone else. Keep it anonymous, safe, and supportive.
        </p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-50 p-8 md:p-16">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Location Selection */}
          <section className="space-y-4">
            <label className="block text-[#1e3a34] font-black text-xl italic">Where are you sharing from?</label>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Instant search for Canadian cities</p>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 scale-125">
                {ICONS.Search}
              </div>
              <input 
                ref={searchInputRef}
                type="text"
                autoComplete="off"
                placeholder="Try 'Toronto' or 'High River'..."
                className={`w-full pl-14 pr-6 py-5 bg-gray-50 border-2 rounded-[1.5rem] text-lg transition-all focus:outline-none focus:bg-white ${formData.selectedLocation ? 'border-[#448a7d]/20 text-[#448a7d]' : 'border-transparent focus:border-[#448a7d]/10'}`}
                value={formData.citySearch}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, citySearch: e.target.value, selectedLocation: null }));
                  if (e.target.value === '') setLocationResults([]);
                }}
              />
              {isSearching && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-[#448a7d] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {locationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-3 rounded-[1.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] z-30 overflow-hidden animate-fade-up">
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                    {locationResults.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-6 py-5 hover:bg-teal-50 border-b border-gray-50 last:border-0 transition-all flex items-center justify-between group"
                        onClick={() => handleLocationSelect(loc)}
                      >
                        <span className="font-medium text-sm md:text-base">
                          {renderDisplayName(loc.display_name, formData.citySearch)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[#448a7d]">
                          {ICONS.ArrowRight}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Guided Prompts */}
          <section className="space-y-8">
            <h3 className="text-[#1e3a34] font-black text-xl italic border-b border-gray-100 pb-4">Guided Notes</h3>
            
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reflection 1</label>
              <textarea 
                className="w-full p-6 bg-gray-50 border-transparent border-2 rounded-[1.5rem] focus:bg-white focus:border-[#448a7d]/10 focus:outline-none transition-all min-h-[140px] text-lg"
                placeholder="One thing that helped me was..."
                value={formData.promptA}
                onChange={(e) => setFormData(prev => ({ ...prev, promptA: e.target.value }))}
                maxLength={400}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reflection 2</label>
              <textarea 
                className="w-full p-6 bg-gray-50 border-transparent border-2 rounded-[1.5rem] focus:bg-white focus:border-[#448a7d]/10 focus:outline-none transition-all min-h-[140px] text-lg"
                placeholder="A message I'd tell someone else is..."
                value={formData.promptB}
                onChange={(e) => setFormData(prev => ({ ...prev, promptB: e.target.value }))}
                maxLength={400}
              />
            </div>
          </section>

          {/* Tags */}
          <section className="space-y-6">
            <h3 className="text-[#1e3a34] font-black text-xl italic">What helped specifically?</h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {HELP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleHelpOption(option)}
                  className={`px-6 py-3 rounded-full text-sm font-bold tracking-tight transition-all border-2 ${
                    formData.what_helped.includes(option)
                      ? 'bg-[#1e3a34] text-white border-[#1e3a34] shadow-lg'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          {/* Agreements */}
          <section className="space-y-4 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h3 className="text-[10px] font-black text-[#448a7d] uppercase tracking-[0.2em] mb-4">Safe Sharing Agreement</h3>
            
            <label className="flex items-start gap-4 cursor-pointer group py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34] rounded-md transition-all cursor-pointer"
                checked={formData.confirmAge}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmAge: e.target.checked }))}
              />
              <span className="text-sm md:text-base text-gray-500 font-light select-none leading-snug">
                I confirm I am <strong className="text-gray-700">18+ years old.</strong>
              </span>
            </label>

            <label className="flex items-start gap-4 cursor-pointer group py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34] rounded-md transition-all cursor-pointer"
                checked={formData.confirmNoDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmNoDetails: e.target.checked }))}
              />
              <span className="text-sm md:text-base text-gray-500 font-light select-none leading-snug">
                I agree to avoid <strong className="text-gray-700">identifying details</strong> (names, addresses, phone numbers).
              </span>
            </label>

            <label className="flex items-start gap-4 cursor-pointer group py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34] rounded-md transition-all cursor-pointer"
                checked={formData.confirmReviewed}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmReviewed: e.target.checked }))}
              />
              <span className="text-sm md:text-base text-gray-500 font-light select-none leading-snug">
                I understand submissions are <strong className="text-gray-700">manually reviewed</strong> before publishing.
              </span>
            </label>
          </section>

          {/* Submit Action */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full py-6 rounded-[2rem] font-bold text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
                !isFormValid 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-[#1e3a34] text-white hover:bg-[#2d5a52] hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  {isFormValid ? 'Share your Note' : 'Complete the Form to Share'}
                  <div className="scale-125">{ICONS.ArrowRight}</div>
                </>
              )}
            </button>
            {!isFormValid && !isSubmitting && (
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-300 mt-6">
                {!formData.selectedLocation ? 'Missing Location' : 'Please complete the agreement checkboxes'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareView;
