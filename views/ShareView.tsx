import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { LocationSearchResult } from '../types.ts';
import { HELP_OPTIONS, ICONS } from '../constants.tsx';

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

  useEffect(() => {
    const query = formData.citySearch;
    if (query.length < 2 || formData.selectedLocation) {
      if (!formData.selectedLocation) setLocationResults([]);
      return;
    }

    const triggerSearch = async () => {
      const local = await apiService.searchLocation(query);
      if (!formData.selectedLocation) setLocationResults(local);
    };
    triggerSearch();

    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3 && !formData.selectedLocation) {
        setIsSearching(true);
        const deep = await apiService.deepSearchLocation(query);
        setLocationResults(prev => {
          const combined = [...prev];
          deep.forEach(d => {
            if (!combined.some(c => c.display_name === d.display_name)) combined.push(d);
          });
          return combined.slice(0, 6);
        });
        setIsSearching(false);
      }
    }, 600);

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
        <button 
          onClick={() => navigate('/map')}
          className="px-10 py-5 bg-[#1e3a34] text-white rounded-full font-bold text-lg"
        >
          Return to Map
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-24 animate-reveal">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-[#1e3a34] italic tracking-tight">Share your light.</h1>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 p-8 md:p-16">
        <form onSubmit={handleSubmit} className="space-y-12">
          <section className="space-y-4">
            <label className="block text-[#1e3a34] font-black text-xl italic">Where are you sharing from?</label>
            <div className="relative">
              <input 
                ref={searchInputRef}
                type="text"
                autoComplete="off"
                placeholder="City name..."
                className="w-full px-6 py-5 bg-gray-50 border-2 rounded-[1.5rem] text-lg focus:outline-none focus:bg-white"
                value={formData.citySearch}
                onChange={(e) => setFormData(prev => ({ ...prev, citySearch: e.target.value, selectedLocation: null }))}
              />
              {locationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border mt-3 rounded-[1.5rem] shadow-2xl z-30 overflow-hidden">
                  {locationResults.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-6 py-5 hover:bg-teal-50 border-b border-gray-50 last:border-0"
                      onClick={() => handleLocationSelect(loc)}
                    >
                      {loc.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-8">
            <textarea 
              className="w-full p-6 bg-gray-50 border-transparent border-2 rounded-[1.5rem] focus:bg-white focus:outline-none min-h-[140px] text-lg"
              placeholder="One thing that helped me was..."
              value={formData.promptA}
              onChange={(e) => setFormData(prev => ({ ...prev, promptA: e.target.value }))}
            />
          </section>

          <section className="space-y-4 p-8 bg-gray-50 rounded-[2rem]">
            <label className="flex items-start gap-4 cursor-pointer py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34]"
                checked={formData.confirmAge}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmAge: e.target.checked }))}
              />
              <span className="text-sm text-gray-500">I confirm I am 18+ years old.</span>
            </label>
            <label className="flex items-start gap-4 cursor-pointer py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34]"
                checked={formData.confirmNoDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmNoDetails: e.target.checked }))}
              />
              <span className="text-sm text-gray-500">I agree to avoid identifying details.</span>
            </label>
            <label className="flex items-start gap-4 cursor-pointer py-2">
              <input 
                type="checkbox" 
                className="mt-1.5 w-5 h-5 accent-[#1e3a34]"
                checked={formData.confirmReviewed}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmReviewed: e.target.checked }))}
              />
              <span className="text-sm text-gray-500">I understand submissions are reviewed.</span>
            </label>
          </section>

          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className={`w-full py-6 rounded-[2rem] font-bold text-xl transition-all ${
              !isFormValid ? 'bg-gray-100 text-gray-300' : 'bg-[#1e3a34] text-white hover:bg-[#2d5a52]'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Share your Note'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShareView;