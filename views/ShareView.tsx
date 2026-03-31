import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { LocationSearchResult, ResourceType } from '../types.ts';
import { HELP_OPTIONS, ICONS } from '../constants.tsx';

// A beautifully styled custom checkbox component
const CustomCheckbox = ({ checked, onChange, label, subtext, id }: { checked: boolean, onChange: (e: any) => void, label: string, subtext: string, id: string }) => (
  <label htmlFor={id} className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${checked ? 'bg-teal-50 border-[#448a7d]/30 shadow-md shadow-teal-900/5' : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'
    }`}>
    <div className="mt-0.5 relative flex-shrink-0">
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        aria-required="true"
      />
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${checked ? 'bg-[#448a7d] border-[#448a7d]' : 'bg-white border-gray-300'
        }`}>
        <svg className={`w-3.5 h-3.5 text-white transform transition-transform duration-300 ${checked ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <div className="flex flex-col">
      <span className={`text-sm font-bold transition-colors ${checked ? 'text-[#1e3a34]' : 'text-gray-700'}`}>{label}</span>
      <span className="text-xs text-gray-500 font-medium mt-0.5">{subtext}</span>
    </div>
  </label>
);

const ShareView: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [shareType, setShareType] = useState<'note' | 'resource'>('note');

  const [formData, setFormData] = useState({
    promptA: '',
    promptB: '',
    promptC: '',
    what_helped: [] as string[],

    // Resource fields
    resourceTitle: '',
    resourceAuthor: '',
    resourceUrl: '',
    resourceType: ResourceType.WEBSITE,
    resourceDescription: '',
    resourceAlias: '',

    citySearch: '',
    selectedLocation: null as LocationSearchResult | null,

    confirmAge: false,
    confirmNoDetails: false,
    confirmReviewed: false
  });

  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const FLAGGED_WORDS = ['spam', 'abuse', 'slur', 'hate', 'suicide', 'self-harm']; // Placeholder flagged words

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

  const isFormValid = () => {
    const baseValid = formData.confirmAge && formData.confirmNoDetails && formData.confirmReviewed;
    if (!baseValid) return false;

    if (shareType === 'note') {
      return formData.selectedLocation !== null && (formData.promptA.trim() !== '' || formData.promptB.trim() !== '');
    } else {
      return formData.resourceTitle.trim() !== '' &&
        formData.resourceUrl.trim() !== '' &&
        formData.resourceDescription.trim().split(/\s+/).filter(Boolean).length <= 500;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setErrorMessage('');

    const fullText = shareType === 'note'
      ? `${formData.promptA} ${formData.promptB} ${formData.promptC}`.toLowerCase()
      : `${formData.resourceTitle} ${formData.resourceDescription} ${formData.resourceAuthor}`.toLowerCase();

    if (FLAGGED_WORDS.some(word => fullText.includes(word))) {
      setErrorMessage("Your submission contains flagged words and cannot be submitted. Please revise your content.");
      return;
    }

    setIsSubmitting(true);
    let result;

    if (shareType === 'note') {
      const combinedMessage = [
        formData.promptA ? `One thing that helped me was ${formData.promptA}.` : '',
        formData.promptB ? `A message I'd tell someone else is ${formData.promptB}.` : '',
        formData.promptC ? `A support or system that helped was ${formData.promptC}.` : ''
      ].filter(Boolean).join(' ');

      result = await apiService.submitPost({
        city: formData.selectedLocation!.address.city ||
          formData.selectedLocation!.address.town ||
          formData.selectedLocation!.address.village || 'Unknown',
        country: formData.selectedLocation!.address.country,
        lat: parseFloat(formData.selectedLocation!.lat),
        lng: parseFloat(formData.selectedLocation!.lon),
        message: combinedMessage,
        what_helped: formData.what_helped
      });
    } else {
      // Resource flow
      if (formData.selectedLocation) {
        // Map-based resource
        const authorInfo = formData.resourceAuthor ? ` | Author: ${formData.resourceAuthor}` : '';
        const combinedMessage = `[RESOURCE - ${formData.resourceType}] ${formData.resourceTitle}${authorInfo} | Link: ${formData.resourceUrl}\n\n${formData.resourceDescription}\n\nRecommended by: ${formData.resourceAlias || 'Anonymous'}`;

        result = await apiService.submitPost({
          city: formData.selectedLocation.address.city ||
            formData.selectedLocation.address.town ||
            formData.selectedLocation.address.village || 'Unknown',
          country: formData.selectedLocation.address.country,
          lat: parseFloat(formData.selectedLocation.lat),
          lng: parseFloat(formData.selectedLocation.lon),
          message: combinedMessage,
          what_helped: [] // Not heavily relevant for resources
        });
      } else {
        // Global resource
        const authorInfo = formData.resourceAuthor ? ` | Author: ${formData.resourceAuthor}` : '';
        const combinedDesc = `${authorInfo}\n${formData.resourceDescription} (Recommended by ${formData.resourceAlias || 'Anonymous'})`;
        result = await apiService.submitResource({
          title: formData.resourceTitle,
          url: formData.resourceUrl,
          type: formData.resourceType,
          description: combinedDesc
        });
      }
    }

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
        <h2 className="text-4xl font-black text-[#1e3a34] mb-4 italic tracking-tight">Submission Received.</h2>
        <p className="text-gray-500 font-medium md:text-lg mb-8 max-w-md mx-auto">
          Thank you for sharing your light. To ensure our community remains a safe space, all submissions undergo a moderation review process. You can expect it to be reviewed within the next 48 hours.
        </p>
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
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 xl:py-32 max-[400px]:px-4 max-[400px]:py-8 animate-reveal">
      <div className="mb-12 md:mb-16 text-center space-y-2">
        <h1 className="text-4xl md:text-6xl max-[400px]:text-3xl font-black text-[#1e3a34] italic tracking-tight">Share your light.</h1>
        <p className="text-gray-500 font-medium md:text-lg">Your note or resource could be the very thing someone needs today.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1.5 rounded-full flex">
          <button
            onClick={() => setShareType('note')}
            className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all ${shareType === 'note' ? 'bg-white shadow-sm text-[#448a7d]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Share a Note
          </button>
          <button
            onClick={() => setShareType('resource')}
            className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all ${shareType === 'resource' ? 'bg-white shadow-sm text-[#448a7d]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Recommend a Resource
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(30,58,52,0.15)] border border-white p-8 md:p-16 max-[400px]:p-6">
        <form onSubmit={handleSubmit} className="space-y-12 md:space-y-16">
          <section className="space-y-4">
            <div className="flex justify-between items-baseline">
              <label htmlFor="citySearch" className="block text-[#1e3a34] font-black text-xl italic">What City are you sharing from?</label>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{shareType === 'resource' ? 'Optional' : 'Required'}</span>
            </div>
            {shareType === 'resource' && (
              <p className="text-sm text-gray-500">Only specify a city if this resource is tied to a specific local area (like a clinic or support group).</p>
            )}
            <div className="relative">
              <input
                id="citySearch"
                ref={searchInputRef}
                type="text"
                autoComplete="off"
                placeholder="City name..."
                className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-xl font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                value={formData.citySearch}
                onChange={(e) => setFormData(prev => ({ ...prev, citySearch: e.target.value, selectedLocation: null }))}
              />
              {locationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-3 rounded-[1.5rem] shadow-2xl z-30 overflow-hidden divide-y divide-gray-50">
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

          {shareType === 'note' && (
            <>
              <section className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="promptA" className="block text-[#1e3a34] font-black text-xl italic">Share your note</label>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {formData.promptA.trim().split(/\s+/).filter(Boolean).length}/500 words
                  </span>
                </div>
                <textarea
                  id="promptA"
                  className={`w-full p-8 bg-gray-50 border-2 ${formData.promptA.trim().split(/\s+/).filter(Boolean).length > 500 ? 'border-red-400' : 'border-transparent focus:border-[#448a7d]/30'} rounded-[2rem] focus:bg-white focus:outline-none min-h-[160px] md:min-h-[220px] max-[400px]:min-h-[120px] text-xl font-medium text-[#1e3a34] max-[400px]:text-base transition-all shadow-inner shadow-gray-200/50`}
                  placeholder="One thing that helped me was..."
                  value={formData.promptA}
                  onChange={(e) => {
                    const val = e.target.value;
                    const count = val.trim().split(/\s+/).filter(Boolean).length;
                    if (count <= 500 || count <= formData.promptA.trim().split(/\s+/).filter(Boolean).length) {
                      setFormData(prev => ({ ...prev, promptA: val }));
                    }
                  }}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="promptA" className="block text-[#1e3a34] font-black text-xl italic">What helped?</label>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {HELP_OPTIONS.map((option, index) => (
                    <label key={option} htmlFor={`help-${index}`} className={`flex items-center gap-3 rounded-2xl px-5 py-4 cursor-pointer border-2 transition-all ${formData.what_helped.includes(option) ? 'bg-teal-50 border-[#448a7d]/30 shadow-md shadow-teal-900/5' : 'bg-gray-50 border-transparent hover:border-gray-100 hover:bg-white'
                      }`}>
                      <input
                        id={`help-${index}`}
                        type="checkbox"
                        className="sr-only"
                        checked={formData.what_helped.includes(option)}
                        onChange={() => toggleHelpOption(option)}
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${formData.what_helped.includes(option) ? 'bg-[#448a7d] border-[#448a7d]' : 'bg-white border-gray-300'
                        }`}>
                        <svg className={`w-3 h-3 text-white transform transition-transform ${formData.what_helped.includes(option) ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-[#1e3a34] font-semibold">{option}</span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {shareType === 'resource' && (
            <>
              <section className="space-y-4">
                <label htmlFor="resourceTitle" className="block text-[#1e3a34] font-black text-xl italic">Title of resource <span className="text-[#e57c6e]">*</span></label>
                <input
                  id="resourceTitle"
                  type="text"
                  required
                  placeholder="e.g. Navigating Family Addiction Guide"
                  className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                  value={formData.resourceTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceTitle: e.target.value }))}
                />
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="resourceAuthor" className="block text-[#1e3a34] font-black text-xl italic">Author</label>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Optional</span>
                </div>
                <input
                  id="resourceAuthor"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                  value={formData.resourceAuthor}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceAuthor: e.target.value }))}
                />
              </section>

              <section className="space-y-4">
                <label htmlFor="resourceUrl" className="block text-[#1e3a34] font-black text-xl italic">Link / URL <span className="text-[#e57c6e]">*</span></label>
                <input
                  id="resourceUrl"
                  type="url"
                  required
                  placeholder="https://..."
                  className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                  value={formData.resourceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceUrl: e.target.value }))}
                />
              </section>

              <section className="space-y-4">
                <label htmlFor="resourceType" className="block text-[#1e3a34] font-black text-xl italic">Resource Type</label>
                <div className="relative">
                  <select
                    id="resourceType"
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231e3a34%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_2rem_center] bg-[length:0.8rem_auto]"
                    value={formData.resourceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, resourceType: e.target.value as ResourceType }))}
                  >
                    <option value={ResourceType.WEBSITE}>Website</option>
                    <option value={ResourceType.VIDEO}>Video</option>
                    <option value={ResourceType.PUBLICATION}>Publication</option>
                    <option value={ResourceType.TOOL}>Tool</option>
                    <option value={ResourceType.BOOK}>Book</option>
                    <option value={ResourceType.PODCAST}>Podcast</option>
                    <option value={ResourceType.SONG}>Song</option>
                    <option value={ResourceType.SOCIAL_MEDIA}>Social Media Channel</option>
                    <option value={ResourceType.MEME}>Meme / Image</option>
                  </select>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="resourceDescription" className="block text-[#1e3a34] font-black text-xl italic">
                    What you liked about it
                  </label>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {formData.resourceDescription.trim().split(/\s+/).filter(Boolean).length}/500 words
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">Note: Your comments will be displayed publicly alongside the resource if approved.</p>
                <div className="relative">
                  <textarea
                    id="resourceDescription"
                    placeholder="Why is this resource helpful?"
                    className={`w-full p-8 bg-gray-50 border-2 ${formData.resourceDescription.trim().split(/\s+/).filter(Boolean).length > 500 ? 'border-red-400' : 'border-transparent focus:border-[#448a7d]/30'} rounded-[2rem] focus:bg-white focus:outline-none min-h-[140px] text-lg font-medium text-[#1e3a34] transition-all shadow-inner shadow-gray-200/50`}
                    value={formData.resourceDescription}
                    onChange={(e) => {
                      const val = e.target.value;
                      const count = val.trim().split(/\s+/).filter(Boolean).length;
                      if (count <= 500 || count <= formData.resourceDescription.trim().split(/\s+/).filter(Boolean).length) {
                        setFormData(prev => ({ ...prev, resourceDescription: val }));
                      }
                    }}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="resourceAlias" className="block text-[#1e3a34] font-black text-xl italic">Your Alias</label>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Optional</span>
                </div>
                <input
                  id="resourceAlias"
                  type="text"
                  placeholder="Stay anonymous, or provide a nickname"
                  className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                  value={formData.resourceAlias}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceAlias: e.target.value }))}
                />
                <p className="text-sm text-gray-500">We do not collect email addresses for recommendations.</p>
              </section>
            </>
          )}

          <fieldset className="space-y-4 p-6 md:p-8 bg-gray-50/50 border border-gray-100/50 rounded-[2rem]">
            <legend className="sr-only">Safety and Privacy Confirmations</legend>
            <div className="mb-4">
              <h3 className="text-[#1e3a34] font-black italic text-lg">Community Guidelines</h3>
              <p className="text-sm text-gray-500 mt-1">Help us keep this map a safe space for everyone.</p>
            </div>

            <div className="space-y-3">
              <CustomCheckbox
                id="confirmAge"
                label="I am 18 or older"
                subtext={`You must be an adult to share a ${shareType} on the map.`}
                checked={formData.confirmAge}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmAge: e.target.checked }))}
              />
              <CustomCheckbox
                id="confirmNoDetails"
                label="No identifying details"
                subtext="Do not include names, specific addresses, or contact info."
                checked={formData.confirmNoDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmNoDetails: e.target.checked }))}
              />
              <CustomCheckbox
                id="confirmReviewed"
                label="Submissions are reviewed"
                subtext="Entries are checked by our team before appearing."
                checked={formData.confirmReviewed}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmReviewed: e.target.checked }))}
              />
            </div>
          </fieldset>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-[1.5rem] font-medium animate-reveal">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className={`w-full py-6 md:py-8 rounded-[2rem] font-black text-xl md:text-2xl transition-all shadow-xl active:scale-[0.98] ${!isFormValid ? 'bg-gray-100 text-gray-300 shadow-none' : 'bg-[#1e3a34] text-white hover:bg-[#2d5a52] hover:shadow-2xl hover:-translate-y-1'
              }`}
          >
            {isSubmitting ? 'Submitting...' : `Share your ${shareType === 'note' ? 'Note' : 'Resource'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShareView;
