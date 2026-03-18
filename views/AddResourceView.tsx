import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { ResourceType } from '../types.ts';
import { ICONS } from '../constants.tsx';

const AddResourceView: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const defaultMode = searchParams.get('mode') === 'apply' ? 'apply' : 'recommend';

    const [mode, setMode] = useState<'recommend' | 'apply'>(defaultMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        url: '',
        type: ResourceType.WEBSITE,
        description: '',
        alias: '',
        submitterEmail: '',
        qualifications: '',
        agreeToTerms: false
    });

    const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;

    const isFormValid = () => {
        if (!formData.title.trim() || !formData.url.trim() || wordCount > 500) return false;
        if (mode === 'apply') {
            return formData.submitterEmail.trim() && formData.qualifications.trim() && formData.agreeToTerms;
        }
        return true; // recommend mode
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setIsSubmitting(true);
        // In a real app we would pass alias and qualifications as well or map them to the comment
        const combinedDesc = mode === 'apply'
            ? `[APPLICATION] Qualifications: ${formData.qualifications} | Desc: ${formData.description}`
            : `${formData.description} (Recommended by ${formData.alias || 'Anonymous'})`;

        const result = await apiService.submitResource({
            title: formData.title,
            url: formData.url,
            type: formData.type,
            description: combinedDesc,
            submitterEmail: mode === 'apply' ? formData.submitterEmail : undefined,
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
                <h2 className="text-4xl font-black text-[#1e3a34] mb-4 italic tracking-tight">
                    {mode === 'apply' ? 'Application Received.' : 'Recommendation Received.'}
                </h2>
                <p className="text-gray-500 font-medium md:text-lg mb-8 max-w-lg mx-auto">
                    {mode === 'apply'
                        ? 'Thank you for applying to share your resource. Our team will carefully review your application and qualifications within the next 48 hours. You will be notified via email whether your resource has been approved or rejected.'
                        : 'Thank you for sharing this recommendation! To ensure high-quality, safe content for our community, your submission will be reviewed by our moderation team within the next 48 hours before being approved or rejected.'}
                </p>
                <button
                    onClick={() => navigate('/resources')}
                    className="px-10 py-5 bg-[#1e3a34] text-white rounded-full font-bold text-lg hover:bg-[#2d5a52] transition-colors"
                >
                    Return to Resources
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-24 max-[400px]:px-4 max-[400px]:py-8 animate-reveal">
            <div className="mb-12 text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-[#1e3a34] italic tracking-tight">
                    {mode === 'apply' ? 'Apply to Post.' : 'Recommend a Resource.'}
                </h1>
                <p className="text-gray-500 font-medium md:text-lg">
                    {mode === 'apply'
                        ? 'Are you a professional or organization? Apply to feature your resource directly.'
                        : 'Know a video, publication, or tool that helps youth impacted by family substance use? Share it.'}
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1.5 rounded-full flex">
                    <button
                        onClick={() => setMode('recommend')}
                        className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all ${mode === 'recommend' ? 'bg-white shadow-sm text-[#448a7d]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Recommend
                    </button>
                    <button
                        onClick={() => setMode('apply')}
                        className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all ${mode === 'apply' ? 'bg-white shadow-sm text-[#448a7d]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Apply to Post
                    </button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(30,58,52,0.15)] border border-white p-8 md:p-14 max-[400px]:p-6">
                <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">

                    <div className="space-y-4">
                        <label htmlFor="title" className="block text-[#1e3a34] font-black text-xl italic">Resource Name/Title <span className="text-[#e57c6e]">*</span></label>
                        <input
                            id="title"
                            type="text"
                            required
                            placeholder="e.g. Navigating Family Addiction Guide"
                            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <label htmlFor="url" className="block text-[#1e3a34] font-black text-xl italic">Link / URL <span className="text-[#e57c6e]">*</span></label>
                        <input
                            id="url"
                            type="url"
                            required
                            placeholder="https://..."
                            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <label htmlFor="type" className="block text-[#1e3a34] font-black text-xl italic">Resource Type</label>
                        <div className="relative">
                            <select
                                id="type"
                                className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231e3a34%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_2rem_center] bg-[length:0.8rem_auto]"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                            >
                                <option value={ResourceType.WEBSITE}>Website</option>
                                <option value={ResourceType.VIDEO}>Video</option>
                                <option value={ResourceType.PUBLICATION}>Publication</option>
                                <option value={ResourceType.TOOL}>Tool</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <label htmlFor="description" className="block text-[#1e3a34] font-black text-xl italic">
                                {mode === 'recommend' ? 'Comments' : 'Description'}
                            </label>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                {wordCount}/500 words
                            </span>
                        </div>
                        {mode === 'recommend' && <p className="text-sm text-gray-500 mb-2">Note: Your comments will be displayed publicly alongside the resource if approved.</p>}
                        <div className="relative">
                            <textarea
                                id="description"
                                placeholder={mode === 'recommend' ? "Why is this resource helpful?" : "Describe what this resource offers to the community."}
                                className={`w-full p-8 bg-gray-50 border-2 ${wordCount > 500 ? 'border-red-400' : 'border-transparent focus:border-[#448a7d]/30'} rounded-[2rem] focus:bg-white focus:outline-none min-h-[140px] text-lg font-medium text-[#1e3a34] transition-all shadow-inner shadow-gray-200/50`}
                                value={formData.description}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const count = val.trim().split(/\s+/).filter(Boolean).length;
                                    if (count <= 500 || count <= wordCount) {
                                        setFormData({ ...formData, description: val });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {mode === 'recommend' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <label htmlFor="alias" className="block text-[#1e3a34] font-black text-xl italic">Your Alias</label>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Optional</span>
                            </div>
                            <input
                                id="alias"
                                type="text"
                                placeholder="Stay anonymous, or provide a nickname"
                                className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#448a7d]/30 rounded-[1.5rem] text-lg font-medium text-[#1e3a34] focus:outline-none focus:bg-white transition-all shadow-inner shadow-gray-200/50"
                                value={formData.alias}
                                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                            />
                            <p className="text-sm text-gray-500">We do not collect email addresses for recommendations.</p>
                        </div>
                    )}

                    {mode === 'apply' && (
                        <>
                            <fieldset className="space-y-6 p-8 bg-teal-50/50 border border-[#448a7d]/20 rounded-[2rem]">
                                <legend className="sr-only">Professional Information</legend>
                                <div className="flex items-start gap-4 mb-2">
                                    <div className="flex-shrink-0 text-[#448a7d] mt-1">{ICONS.Users}</div>
                                    <div>
                                        <h3 className="text-[#1e3a34] font-black italic text-lg leading-tight">Partner Details</h3>
                                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                            To ensure high-quality content, we require professionals and organizations to provide contact info and qualifications. You must adhere to all privacy and safety laws.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-6">
                                    <label htmlFor="email" className="block text-[#1e3a34] font-bold text-sm uppercase tracking-wider">Email Address <span className="text-[#e57c6e]">*</span></label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="you@organization.org"
                                        className="w-full px-6 py-4 bg-white border border-gray-200 focus:border-[#448a7d] rounded-2xl text-base font-medium text-[#1e3a34] focus:outline-none transition-all shadow-sm"
                                        value={formData.submitterEmail}
                                        onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label htmlFor="qualifications" className="block text-[#1e3a34] font-bold text-sm uppercase tracking-wider">Why post this? (Qualifications) <span className="text-[#e57c6e]">*</span></label>
                                    <textarea
                                        id="qualifications"
                                        required
                                        placeholder="Describe your organization's alignment with Starlings mission..."
                                        className="w-full p-6 bg-white border border-gray-200 focus:border-[#448a7d] rounded-2xl min-h-[100px] text-base font-medium text-[#1e3a34] focus:outline-none transition-all shadow-sm"
                                        value={formData.qualifications}
                                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                    />
                                </div>

                                <label className="flex items-start gap-4 cursor-pointer mt-4 group">
                                    <div className="mt-0.5 relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.agreeToTerms}
                                            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                        />
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${formData.agreeToTerms ? 'bg-[#448a7d] border-[#448a7d]' : 'bg-white border-gray-300 group-hover:border-[#448a7d]/50'}`}>
                                            <svg className={`w-3.5 h-3.5 text-white transform transition-transform duration-300 ${formData.agreeToTerms ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 leading-snug">
                                        I confirm that this resource adheres to all relevant legal and privacy standards, and I am authorized to share it.
                                    </span>
                                </label>
                            </fieldset>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !isFormValid()}
                        className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-[0.98] ${!isFormValid() ? 'bg-gray-100 text-gray-300 shadow-none' : 'bg-[#1e3a34] text-white hover:bg-[#2d5a52] hover:shadow-2xl hover:-translate-y-1'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : (mode === 'apply' ? 'Submit Application' : 'Recommend Resource')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddResourceView;
