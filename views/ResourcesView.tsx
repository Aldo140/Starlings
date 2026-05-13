import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { Resource, ResourceType } from '../types.ts';
import { ICONS, SEED_RESOURCES } from '../constants.tsx';
import { Book, Headphones, Music, Share2, Globe, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ResourceCard: React.FC<{ resource: Resource }> = memo(({ resource }) => {
    const [liked, setLiked] = useState(false);
    const [supportive, setSupportive] = useState(false);
    const [exploring, setExploring] = useState(false);
    const [showReflection, setShowReflection] = useState(false);
    const [reflectionText, setReflectionText] = useState('');
    const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
    const [reflectionError, setReflectionError] = useState('');

    const handleInsightClick = async (type: 'helpful' | 'supportive' | 'exploring') => {
        if (type === 'helpful') { if (liked) return; setLiked(true); }
        if (type === 'supportive') { if (supportive) return; setSupportive(true); }
        if (type === 'exploring') { if (exploring) return; setExploring(true); }
        await apiService.incrementInsight(resource.id, type);
    };

    const handleReflectionSubmit = async () => {
        const text = reflectionText.trim();
        if (!text) return;
        setReflectionError('');
        const result = await apiService.submitReflection(resource.id, text);
        if (result.flagged) {
            setReflectionError('Please revise this reflection to remove crisis details, links, contact information, or identifying details.');
            return;
        }
        if (result.success) {
            setReflectionSubmitted(true);
            setShowReflection(false);
            setReflectionText('');
        } else {
            setReflectionError('Something went wrong. Please try again.');
        }
    };

    let recommender = null;
    let cleanDescription = resource.description || '';
    const recMatch = cleanDescription.match(/^Recommended by '([^']+)':\s*(.*)/);
    if (recMatch) {
        recommender = recMatch[1];
        cleanDescription = recMatch[2];
    }

    const getSocialDetails = (url: string) => {
        if (!url) return { name: 'Social Profile', icon: <Share2 className="w-3.5 h-3.5" /> };
        const u = url.toLowerCase();
        if (u.includes('instagram.com')) return { name: 'Instagram', icon: <ImageIcon className="w-3.5 h-3.5" /> };
        if (u.includes('tiktok.com')) return { name: 'TikTok', icon: <Music className="w-3.5 h-3.5" /> };
        if (u.includes('facebook.com')) return { name: 'Facebook', icon: <Globe className="w-3.5 h-3.5" /> };
        if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'X (Twitter)', icon: <Share2 className="w-3.5 h-3.5" /> };
        if (u.includes('youtube.com')) return { name: 'YouTube', icon: <Globe className="w-3.5 h-3.5" /> };
        return { name: 'Social Profile', icon: <Share2 className="w-3.5 h-3.5" /> };
    };

    const social = resource.type === ResourceType.SOCIAL_MEDIA ? getSocialDetails(resource.url) : null;

    return (
        <div className="p-6 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-gray-100 flex flex-col h-full hover:shadow-2xl hover:border-indigo-100/50 transition-shadow transition-colors group">
            {resource.type === ResourceType.MEME && resource.imageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <img src={resource.imageUrl} alt={resource.title} className="w-full max-h-64 object-contain" />
                </div>
            )}

            {social && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-indigo-50 text-indigo-600 rounded-lg w-fit shadow-sm border border-indigo-100">
                    {social.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                </div>
            )}

            <h4 className="font-black text-2xl text-[#1e3a34] mb-2 leading-tight">{resource.title}</h4>
            {recommender && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recommended by {recommender}</p>}
            <p className="text-base font-medium text-gray-600 mb-6 flex-grow leading-relaxed">{cleanDescription}</p>
            {resource.url && resource.type !== ResourceType.MEME && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-indigo-500 hover:text-indigo-600 hover:underline mb-6 inline-block uppercase tracking-widest">Explore Resource &rarr;</a>
            )}

            <div className="border-t border-gray-200 pt-5 mt-auto">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Peer Insights</p>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button onClick={() => handleInsightClick('helpful')} className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${liked ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        ❤️ Helpful {((resource.helpful_count || 0) + (liked ? 1 : 0)) > 0 ? `(${((resource.helpful_count || 0) + (liked ? 1 : 0))})` : ''}
                    </button>
                    <button onClick={() => handleInsightClick('supportive')} className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${supportive ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        🤝 Supportive {((resource.supportive_count || 0) + (supportive ? 1 : 0)) > 0 ? `(${((resource.supportive_count || 0) + (supportive ? 1 : 0))})` : ''}
                    </button>
                    <button onClick={() => handleInsightClick('exploring')} className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${exploring ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        🌱 Worth exploring {((resource.exploring_count || 0) + (exploring ? 1 : 0)) > 0 ? `(${((resource.exploring_count || 0) + (exploring ? 1 : 0))})` : ''}
                    </button>
                </div>
                {reflectionSubmitted ? (
                    <p className="text-xs text-[#448a7d] font-black uppercase tracking-widest">Reflection received</p>
                ) : showReflection ? (
                    <div className="space-y-3">
                        <textarea
                            value={reflectionText}
                            onChange={(e) => setReflectionText(e.target.value)}
                            maxLength={280}
                            placeholder="Optional short reflection..."
                            className="w-full text-sm font-medium bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1e3a34] focus:outline-none focus:border-[#448a7d] shadow-inner min-h-24 resize-none"
                        />
                        {reflectionError && <p className="text-xs text-red-600 font-bold">{reflectionError}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleReflectionSubmit} className="px-4 py-2 rounded-full bg-[#1e3a34] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2d5a52] transition-colors">
                                Submit
                            </button>
                            <button onClick={() => { setShowReflection(false); setReflectionError(''); }} className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowReflection(true)} className="text-xs text-gray-400 font-bold hover:text-[#448a7d] flex items-center gap-1.5 uppercase tracking-widest transition-colors">
                        <MessageCircle className="w-4 h-4" /> Add reflection
                    </button>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    const prev = prevProps.resource;
    const next = nextProps.resource;
    return prev.id === next.id &&
        prev.title === next.title &&
        prev.description === next.description &&
        prev.helpful_count === next.helpful_count &&
        prev.supportive_count === next.supportive_count &&
        prev.exploring_count === next.exploring_count;
});

const ResourcesView: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommunityIndex, setActiveCommunityIndex] = useState<string | null>(null);
    const [activeGeneralIndex, setActiveGeneralIndex] = useState<number>(0);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchResources = async () => {
            // Show real seed resources immediately while Google Sheets loads.
            const seedResources = SEED_RESOURCES.map(r => ({ ...r, alias: r.alias || apiService.generateAlias() })) as Resource[];
            setResources(seedResources);
            setLoading(false);

            // Silently fetch and hot-swap global Google Sheets data in the background
            try {
                const data = await apiService.getApprovedResources();
                setResources(data);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            }
        };
        fetchResources();
    }, []);

    // Helper config for mapping resource types to colors/icons
    const typeConfig = {
        website: { color: 'bg-[#448a7d]', label: 'Website' },
        video: { color: 'bg-[#e57c6e]', label: 'Video' },
        publication: { color: 'bg-indigo-500', label: 'Publication' },
        tool: { color: 'bg-amber-500', label: 'Tool' },
    } as Record<string, { color: string, label: string }>;

    // BUCKETS CONFIGURATION (Shared across Mobile, Tablet, and Desktop layouts)
    const COMMUNITY_BUCKETS = [
        { id: ResourceType.BOOK, label: 'Books', icon: <Book className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' },
        { id: ResourceType.PODCAST, label: 'Podcasts', icon: <Headphones className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/30' },
        { id: ResourceType.SONG, label: 'Songs', icon: <Music className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-pink-500', bg: 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-pink-500/30' },
        { id: ResourceType.SOCIAL_MEDIA, label: 'Social Media', icon: <Share2 className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30' },
        { id: ResourceType.WEBSITE, label: 'Websites', icon: <Globe className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-teal-500', bg: 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-500/30' },
        { id: ResourceType.MEME, label: 'Memes & Images', icon: <ImageIcon className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30' },
    ];

    // MEMOIZED: Compute bucket resources only when resources array changes
    const communityBucketResources = useMemo(() => {
        const result: Record<string, Resource[]> = {};
        COMMUNITY_BUCKETS.forEach(bucket => {
            result[bucket.id] = resources
                .filter(r => r.category === 'community' && r.type === bucket.id)
                .sort((a, b) => a.title.localeCompare(b.title));
        });
        return result;
    }, [resources]);

    const communityPartners = useMemo(() => {
        return resources.filter(r => r.category === 'general');
    }, [resources]);

    const alignedPartners = useMemo(() => {
        return resources.filter(r => r.category === 'partner');
    }, [resources]);

    const activeBucket = COMMUNITY_BUCKETS.find(b => b.id === activeCommunityIndex) ?? null;
    const activeResources = activeCommunityIndex ? (communityBucketResources[activeCommunityIndex] || []) : [];

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-reveal">

                {/* STUNNING HERO SECTION */}
                <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-[#1e3a34] text-white p-7 md:p-16 mb-8 md:mb-16 shadow-2xl">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a34] via-[#1e3a34]/80 to-transparent"></div>

                    <div className="relative z-10 max-w-3xl">
                        <h1 className="text-3xl md:text-7xl font-black italic tracking-tight mb-3 md:mb-6">Light the way.</h1>
                        <p className="text-gray-300 font-medium text-sm md:text-xl max-w-2xl mb-6 md:mb-10 leading-relaxed">
                            Resources suggested by Peers and Community Partners
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                            <Link
                                to="/add-resource?mode=recommend"
                                className="w-full sm:w-auto bg-[#e57c6e] text-white px-6 md:px-8 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 hover:bg-[#d46a5c] shadow-[0_10px_30px_-10px_rgba(229,124,110,0.5)] hover:-translate-y-1 transition-all active:scale-95"
                            >
                                {ICONS.Plus} Recommend
                            </Link>
                            <Link
                                to="/add-resource?mode=apply"
                                className="w-full sm:w-auto bg-white/20 text-white px-6 md:px-8 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 hover:bg-white/30 border border-white/30 shadow-md hover:-translate-y-1 transition-all active:scale-95"
                            >
                                {ICONS.Users} Become a Partner
                            </Link>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[#1e3a34]/40 font-bold text-xs uppercase tracking-widest">Loading resources...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-20 bg-white/80 rounded-[3rem] border border-gray-100">
                        <p className="text-gray-500 font-medium mb-6">No resources found yet.</p>
                        <Link to="/add-resource" className="text-[#448a7d] font-bold underline hover:text-[#1e3a34] transition-colors">
                            Be the first to recommend one
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10 md:space-y-20">
                        {/* COMMUNITY PARTNERS SECTION */}
                        {communityPartners.length > 0 && (
                        <section>
                            <div className="mb-6 md:mb-16 lg:mb-20">
                                <div className="h-1 md:h-1.5 w-12 md:w-32 bg-gradient-to-r from-[#448a7d] to-[#2d5a52] rounded-full mb-4 md:mb-8" />
                                <div className="space-y-2 md:space-y-6">
                                    <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] italic tracking-tight leading-tight max-w-4xl">
                                        Community Partners
                                    </h2>
                                    <div className="space-y-2 md:space-y-4 max-w-3xl">
                                        <p className="text-sm md:text-xl text-gray-700 font-semibold leading-relaxed">
                                            Starlings-trained organizations offering <span className="text-[#448a7d] font-black">specialized, verified care</span> for youth and adults who have grown up with parental substance use.
                                        </p>
                                        <p className="hidden md:block text-base md:text-lg text-gray-600 font-medium leading-relaxed">
                                            Listed by location. Each partner is independent and responsible for their care.
                                        </p>
                                        <div className="flex items-center gap-2 pt-1 md:pt-2">
                                            <span className="inline-block text-[10px] md:text-sm font-black uppercase tracking-widest px-3 md:px-5 py-1.5 md:py-2.5 bg-[#448a7d] text-white rounded-full shadow-md">✓ Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MOBILE Community Partners — Vertical Accordion (same visual DNA as desktop) */}
                            <div className="flex flex-col gap-2 md:hidden mt-2">
                                {communityPartners.map((resource, index) => {
                                    const config = typeConfig[resource.type] || typeConfig.website;
                                    const isActive = activeGeneralIndex === index;
                                    let cleanDescription = resource.description || '';
                                    const recMatch = cleanDescription.match(/^Recommended by '([^']+)':\s*(.*)/);
                                    if (recMatch) cleanDescription = recMatch[2];

                                    return (
                                        <motion.div
                                            key={resource.id}
                                            animate={{ height: isActive ? 268 : 62 }}
                                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                                            className="relative overflow-hidden rounded-[1.5rem] cursor-pointer flex flex-col justify-end"
                                            style={{ height: 62 }}
                                            onClick={() => setActiveGeneralIndex(isActive ? 0 : index)}
                                        >
                                            {/* Background image */}
                                            <div className="absolute inset-0">
                                                {resource.imageUrl ? (
                                                    <motion.img
                                                        src={resource.imageUrl}
                                                        alt={resource.title}
                                                        className="w-full h-full object-cover"
                                                        animate={{ scale: isActive ? 1.04 : 1.1 }}
                                                        transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
                                                        <div className="text-indigo-200 scale-[4]">{ICONS.Heart}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Gradient overlay */}
                                            <motion.div
                                                animate={{ opacity: isActive ? 0.88 : 0.55 }}
                                                transition={{ duration: 0.45 }}
                                                className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"
                                            />

                                            {/* Content pinned to bottom */}
                                            <div className="relative z-10 px-4 pb-4 pt-3 w-full">
                                                {/* Row always visible: badge + title (collapsed) + chevron */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`text-[8px] text-white font-black uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0 ${config.color} border border-white/20 shadow`}>
                                                            {config.label}
                                                        </span>
                                                        {!isActive && (
                                                            <span className="text-white font-black text-sm truncate drop-shadow">{resource.title}</span>
                                                        )}
                                                    </div>
                                                    <motion.div
                                                        animate={{ rotate: isActive ? 180 : 0 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                                        className="flex-shrink-0"
                                                    >
                                                        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </motion.div>
                                                </div>

                                                {/* Expanded content */}
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ delay: 0.1, duration: 0.22 }}
                                                            className="mt-2.5"
                                                        >
                                                            <h3 className="text-white font-black text-2xl leading-tight tracking-tight mb-1.5 drop-shadow-md">
                                                                {resource.title}
                                                            </h3>
                                                            <p className="text-white/70 text-xs font-medium leading-relaxed mb-4 line-clamp-2">
                                                                {cleanDescription}
                                                            </p>
                                                            <a
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.18em] px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/50 shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)] active:scale-95 transition-all"
                                                            >
                                                                Explore Resource
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                </svg>
                                                            </a>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* DESKTOP/TABLET Accordion Gallery */}
                            <div className="hidden md:flex w-full h-[600px] gap-4 mt-8">
                                {communityPartners.map((resource, index) => {
                                    const config = typeConfig[resource.type] || typeConfig.website;
                                    const isActive = activeGeneralIndex === index;

                                    let recommender = null;
                                    let cleanDescription = resource.description || '';
                                    const recMatch = cleanDescription.match(/^Recommended by '([^']+)':\s*(.*)/);
                                    if (recMatch) {
                                        recommender = recMatch[1];
                                        cleanDescription = recMatch[2];
                                    }

                                    return (
                                        <div
                                            key={resource.id}
                                            onMouseEnter={() => setActiveGeneralIndex(index)}
                                            onClick={() => setActiveGeneralIndex(index)}
                                            className={`relative overflow-hidden rounded-[1.5rem] md:rounded-[3rem] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer group flex flex-col justify-end ${isActive ? 'flex-[10] shadow-[0_30px_60px_-15px_rgba(99,102,241,0.5)] border-2 border-indigo-100' : 'flex-[1] shadow-sm border border-gray-100/50 hover:flex-[1.5]'}`}
                                        >
                                            <div className="absolute inset-0">
                                                {resource.imageUrl ? (
                                                    <img src={resource.imageUrl} alt={resource.title} className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-out ${isActive ? 'scale-100' : 'scale-110'}`} />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center text-indigo-500/20">
                                                        <div className="scale-[3]">{ICONS.Heart}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Gradient Overlay */}
                                            <div className={`absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent transition-opacity duration-700 ${isActive ? 'opacity-90' : 'opacity-40 group-hover:opacity-60'}`}></div>

                                            {/* Content Wrapper */}
                                            <div className="relative z-10 p-5 md:p-8 lg:p-10 w-full flex-shrink-0 transition-opacity duration-500 pointer-events-none">
                                                {/* ACTIVE CONTENT */}
                                                <div className={`flex flex-col transform transition-all duration-[800ms] ease-out ${isActive ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-16 opacity-0 absolute bottom-0'}`}>
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4 w-full">
                                                        <span className={`text-[9px] md:text-[10px] text-white shadow-xl font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-full ${config.color} border border-white/20`}>
                                                            {config.label}
                                                        </span>
                                                        {recommender && (
                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg">
                                                                    {recommender.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#e8f3f1]">Found by {recommender}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-white font-black text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-tight mb-2 md:mb-4 drop-shadow-md">
                                                        {resource.title}
                                                    </h3>

                                                    <p className="text-indigo-100 font-medium text-xs md:text-sm lg:text-base max-w-2xl leading-relaxed mb-4 md:mb-6 lg:mb-8 pointer-events-auto line-clamp-2 md:line-clamp-none">
                                                        {cleanDescription}
                                                    </p>

                                                    {isActive && (
                                                        <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="pointer-events-auto inline-flex items-center justify-center md:justify-start gap-2 md:gap-3 text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] w-full md:w-fit px-6 md:px-8 py-3 md:py-4 rounded-full bg-indigo-500 hover:bg-indigo-400 border border-indigo-400 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] transition-all active:scale-95 group/btn"
                                                        >
                                                            Explore Resource <svg className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* INACTIVE / VERTICAL BADGE */}
                                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isActive ? 'opacity-0' : 'opacity-100 flex-col justify-end pb-4 md:pb-12'}`}>
                                                <div className="transform md:-rotate-90 origin-center text-white/90 font-black md:uppercase tracking-[0.1em] md:tracking-[0.4em] text-xs md:text-xs whitespace-nowrap drop-shadow-xl flex items-center gap-2 md:gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                    {config.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                        )}

                        {/* COMMUNITY RESOURCES SECTION (BUCKETS) */}
                        <section className="relative w-full pb-16">
                            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-8">
                                <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-md flex-shrink-0">
                                    {ICONS.Users}
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-4xl font-black text-[#1e3a34] italic tracking-tight leading-tight">Community Suggested Resources</h2>
                                    <p className="text-gray-500 font-medium text-xs md:text-lg mt-0.5 md:mt-1">Peer-recommended by the community.</p>
                                </div>
                            </div>



                            {/* APP STORE EXPANDABLE CARDS For Mid-Screens (Tablet / 13inch) - 768px to 1245px */}
                            <div className="hidden md:block xl:hidden mt-8 mb-16 px-2">
                                {/* Grid of Closed Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {COMMUNITY_BUCKETS.map((bucket) => {
                                        const bucketResources = communityBucketResources[bucket.id];

                                        return (
                                            <div
                                                key={bucket.id}
                                                onClick={() => setExpandedCategory(bucket.id)}
                                                className={`relative overflow-hidden cursor-pointer group rounded-[2.5rem] p-8 h-64 flex flex-col items-start justify-between shadow-lg hover:shadow-lg ${bucket.bg}`}
                                            >
                                                <div className="pointer-events-none">{bucket.bgIcon}</div>
                                                <div className="relative z-10 p-5 rounded-2xl bg-black/30 shadow-inner border border-white/10">
                                                    {React.cloneElement(bucket.icon as React.ReactElement, { className: "w-8 h-8 text-white" })}
                                                </div>
                                                <div className="relative z-10 w-full mt-auto text-left">
                                                    <h3 className="text-3xl font-black text-white drop-shadow-md tracking-tight leading-tight mb-2">{bucket.label}</h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/20 px-4 py-1.5 rounded-full inline-block shadow-sm">
                                                        {bucketResources.length} Items Available
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>


                            </div>
                            {/* MOBILE: Horizontal Pill Rail + Content Panel */}
                            <div className="md:hidden mt-6">

                                {/* 3×2 chip grid — all 6 categories visible, no scroll */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {COMMUNITY_BUCKETS.map((bucket) => {
                                        const count = communityBucketResources[bucket.id].length;
                                        const isActive = activeCommunityIndex === bucket.id;
                                        return (
                                            <motion.button
                                                key={bucket.id}
                                                onClick={() => setActiveCommunityIndex(isActive ? null : bucket.id)}
                                                animate={{ scale: isActive ? 1.04 : 1 }}
                                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                                className={`relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border transition-colors duration-200 ${
                                                    isActive
                                                        ? `${bucket.bg} border-transparent shadow-md`
                                                        : 'bg-white border-gray-100 shadow-sm'
                                                }`}
                                            >
                                                {count > 0 && (
                                                    <span className={`absolute top-1.5 right-1.5 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none ${
                                                        isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>{count}</span>
                                                )}
                                                <div className={isActive ? 'text-white' : bucket.color}>
                                                    {React.cloneElement(bucket.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                                </div>
                                                <span className={`text-[10px] font-black leading-tight text-center px-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                                    {bucket.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Content panel */}
                                <div className="mt-5">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {!activeBucket ? (
                                            <motion.div
                                                key="mob-empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="flex flex-col items-center justify-center py-8 text-center bg-white/70 rounded-[1.5rem] border border-dashed border-gray-200"
                                            >
                                                <div className="flex gap-2 mb-4">
                                                    {COMMUNITY_BUCKETS.slice(0, 4).map((bucket) => (
                                                        <div key={bucket.id} className={`w-8 h-8 rounded-xl flex items-center justify-center ${bucket.bg} opacity-50`}>
                                                            {React.cloneElement(bucket.icon as React.ReactElement, { className: 'w-3.5 h-3.5 text-white' })}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-sm font-black text-[#1e3a34]/30 italic">Tap a category above</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={`mob-${activeBucket.id}`}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                                            >
                                                {/* Compact header */}
                                                <div className="flex items-center justify-between mb-4 px-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow ${activeBucket.bg}`}>
                                                            {React.cloneElement(activeBucket.icon as React.ReactElement, { className: 'w-5 h-5 text-white' })}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-[#1e3a34] italic leading-none">{activeBucket.label}</h3>
                                                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                                {activeResources.length === 0 ? 'No resources yet' : `${activeResources.length} resource${activeResources.length !== 1 ? 's' : ''}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveCommunityIndex(null)}
                                                        className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 active:scale-95 transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Resource list */}
                                                {activeResources.length === 0 ? (
                                                    <div className="text-center py-14 bg-white rounded-[1.5rem] border border-dashed border-gray-200">
                                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200 shadow-inner">
                                                            <div className="scale-150">{ICONS.Heart}</div>
                                                        </div>
                                                        <p className="text-gray-400 font-bold text-base mb-3">No {activeBucket.label.toLowerCase()} yet.</p>
                                                        <Link
                                                            to={`/add-resource?mode=recommend&type=${activeCommunityIndex}`}
                                                            className="inline-flex px-6 py-2.5 rounded-full bg-[#e8f3f1] text-[#448a7d] font-black uppercase tracking-widest text-[10px] hover:bg-[#d5e8e4] transition-colors"
                                                        >
                                                            Recommend One
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {activeResources.map((res, i) => (
                                                            <motion.div
                                                                key={res.id}
                                                                initial={{ opacity: 0, y: 16 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: i * 0.06, duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                                                            >
                                                                <ResourceCard resource={res} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </div>

                            {/* DESKTOP XL: Elegant Side-by-Side Rail Layout */}
                            <div className="hidden xl:flex gap-10 mt-10 items-start h-[640px]">

                                {/* LEFT RAIL — Category Selector */}
                                <div className="w-[230px] flex-shrink-0 h-full">
                                    <div className="h-full flex flex-col">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 px-1 mb-3">Browse by type</p>
                                        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="py-2">
                                                {COMMUNITY_BUCKETS.map((bucket) => {
                                                    const count = communityBucketResources[bucket.id].length;
                                                    const isActive = activeCommunityIndex === bucket.id;
                                                    return (
                                                        <button
                                                            key={bucket.id}
                                                            onClick={() => setActiveCommunityIndex(isActive ? null : bucket.id)}
                                                            className={`relative w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 text-left group ${isActive ? 'bg-[#e8f3f1]/70' : 'hover:bg-gray-50'}`}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="railIndicator"
                                                                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#448a7d] rounded-r-full"
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                                                />
                                                            )}
                                                            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-150 ${isActive ? `bg-white shadow-sm border border-gray-100 ${bucket.color}` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                                {React.cloneElement(bucket.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                                            </div>
                                                            <div className="flex-grow min-w-0">
                                                                <span className={`text-sm font-black block leading-tight transition-colors ${isActive ? 'text-[#1e3a34]' : 'text-gray-500 group-hover:text-gray-700'}`}>{bucket.label}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 min-w-[22px] text-center transition-colors ${isActive ? 'bg-[#448a7d] text-white' : count > 0 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-300'}`}>
                                                                {count}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="mt-4 px-1">
                                            <Link
                                                to="/add-resource?mode=recommend"
                                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#448a7d]/60 hover:text-[#448a7d] transition-colors group"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-[#448a7d]/10 group-hover:bg-[#448a7d]/20 flex items-center justify-center transition-colors flex-shrink-0">
                                                    {ICONS.Plus}
                                                </div>
                                                Suggest a resource
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT PANEL — Content Area */}
                                <div className="flex-grow h-full overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8f3f1 transparent' }}>
                                    <AnimatePresence mode="wait" initial={false}>
                                        {!activeBucket ? (
                                            <motion.div
                                                key="xl-empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col items-center justify-center py-28 text-center"
                                            >
                                                <div className="flex items-end gap-2 mb-10">
                                                    {COMMUNITY_BUCKETS.map((bucket, i) => (
                                                        <motion.div
                                                            key={bucket.id}
                                                            className={`rounded-2xl flex items-center justify-center shadow-md ${bucket.bg}`}
                                                            style={{ width: 40 + (i === 2 ? 8 : i === 3 ? 4 : 0), height: 40 + (i === 2 ? 8 : i === 3 ? 4 : 0), opacity: 0.55 }}
                                                            animate={{ y: [0, -(4 + i * 2.5), 0] }}
                                                            transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, delay: i * 0.32, ease: 'easeInOut' }}
                                                        >
                                                            {React.cloneElement(bucket.icon as React.ReactElement, { className: 'w-4 h-4 text-white' })}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <h3 className="text-2xl font-black text-[#1e3a34]/30 italic tracking-tight mb-2">Select a category</h3>
                                                <p className="text-sm text-gray-400 font-medium max-w-xs leading-relaxed">Choose a type from the left to explore peer-recommended resources</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={activeBucket.id}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -18 }}
                                                transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                                            >
                                                {/* Panel header */}
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg ${activeBucket.bg}`}>
                                                            {React.cloneElement(activeBucket.icon as React.ReactElement, { className: 'w-7 h-7 text-white' })}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-3xl font-black text-[#1e3a34] italic tracking-tight leading-none">{activeBucket.label}</h3>
                                                            <p className="text-sm text-gray-500 font-medium mt-1.5">
                                                                {activeResources.length === 0
                                                                    ? 'No resources yet'
                                                                    : `${activeResources.length} peer-recommended resource${activeResources.length !== 1 ? 's' : ''}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveCommunityIndex(null)}
                                                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm active:scale-95"
                                                    >
                                                        {ICONS.X}
                                                    </button>
                                                </div>

                                                {/* Resource grid or empty */}
                                                {activeResources.length === 0 ? (
                                                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                                                        <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 text-gray-200 shadow-inner">
                                                            <div className="scale-[2]">{ICONS.Heart}</div>
                                                        </div>
                                                        <p className="text-gray-400 font-bold text-xl mb-4 tracking-tight">No {activeBucket.label.toLowerCase()} yet.</p>
                                                        <Link
                                                            to={`/add-resource?mode=recommend&type=${activeCommunityIndex}`}
                                                            className="inline-flex px-8 py-3.5 rounded-full bg-[#e8f3f1] border border-[#448a7d]/20 text-[#448a7d] font-black tracking-widest uppercase text-xs hover:bg-[#d5e8e4] transition-all active:scale-95"
                                                        >
                                                            Recommend the First One
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-6">
                                                        {activeResources.map((res, i) => (
                                                            <motion.div
                                                                key={res.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: i * 0.07, duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
                                                            >
                                                                <ResourceCard resource={res} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </div>
                        </section>

                        {/* PARTNERS SECTION */}
                        {alignedPartners.length > 0 && (
                            <section>
                                <div className="mb-12 md:mb-16 lg:mb-20">
                                    {/* Accent bar */}
                                    <div className="h-1.5 md:h-2 w-20 md:w-32 bg-gradient-to-r from-[#e57c6e] to-[#d46a5c] rounded-full mb-6 md:mb-8" />
                                    
                                    <div className="space-y-4 md:space-y-6">
                                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] italic tracking-tight leading-tight max-w-4xl">
                                            Starlings-Aligned Partners
                                        </h2>
                                        
                                        <div className="space-y-3 md:space-y-4 max-w-3xl">
                                            <p className="text-lg md:text-xl text-gray-700 font-semibold leading-relaxed">
                                                Organizations reviewed by Starlings that offer <span className="text-[#e57c6e] font-black">resources and support</span> for youth and adults affected by parental substance use.
                                            </p>
                                            <p className="text-base md:text-lg text-gray-600 font-medium leading-relaxed">
                                                They are independent and not affiliated with or trained by Starlings. <span className="font-black">Inclusion does not imply endorsement</span> — we encourage you to explore what feels right for you.
                                            </p>
                                            <div className="flex items-center gap-2 pt-2">
                                                <span className="inline-block text-xs md:text-sm font-black uppercase tracking-widest px-4 md:px-5 py-2 md:py-2.5 bg-[#e57c6e] text-white rounded-full shadow-md">◆ Reviewed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {alignedPartners.map((resource) => {
                                        const config = typeConfig[resource.type] || typeConfig.website;
                                        return (
                                            <a
                                                key={resource.id}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative bg-white rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(229,124,110,0.15)] hover:shadow-[0_30px_60px_-15px_rgba(229,124,110,0.25)] hover:-translate-y-2 transition-all duration-500 border-2 border-[#e57c6e]/10 group flex flex-col sm:flex-row h-full overflow-hidden"
                                            >
                                                <div className="absolute top-6 left-6 z-20 flex gap-2">
                                                    <div className="bg-white/90 text-[#e57c6e] shadow-sm text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-1.5 rounded-full">
                                                        {ICONS.ShieldCheck} Verified
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-2/5 sm:min-w-[240px] h-64 sm:h-auto bg-gray-100 flex-shrink-0 relative overflow-hidden">
                                                    {resource.imageUrl ? (
                                                        <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-[#e57c6e]/20">
                                                            <div className="scale-150">{ICONS.Heart}</div>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:to-black/5"></div>
                                                </div>

                                                <div className="p-8 sm:p-10 flex flex-col flex-grow justify-center relative z-10 bg-white sm:-ml-6 sm:rounded-l-[3rem] shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <span className={`text-[10px] text-white shadow-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                        {resource.location && (
                                                            <span className="text-[10px] text-[#448a7d] bg-[#448a7d]/10 font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                                {ICONS.MapPin} {resource.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-[#1e3a34] font-black text-3xl tracking-tight mb-4 group-hover:text-[#e57c6e] transition-colors leading-tight">
                                                        {resource.title}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm leading-relaxed flex-grow font-medium">
                                                        {resource.description}
                                                    </p>
                                                    <div className="mt-8 flex items-center gap-2 text-[#e57c6e] font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                                        Visit Partner <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* EXPANDED FULL SCREEN OVERLAY (Extracted from transformed wrapper to guarantee viewport lock!) */}
            <AnimatePresence>
                {expandedCategory && (
                    <>
                        {/* Independent Ambient Background Fade */}
                        <div
                            className="fixed top-[72px] md:top-[88px] inset-x-0 bottom-0 z-[40] bg-black/70 transition-opacity duration-300"
                            style={{ opacity: expandedCategory ? 1 : 0, pointerEvents: expandedCategory ? 'auto' : 'none' }}
                        />

                        {/* The Morphing App Store Card */}
                        {COMMUNITY_BUCKETS.filter(b => b.id === expandedCategory).map((bucket) => {
                            const bucketResources = resources.filter(r => r.category === 'community' && r.type === bucket.id).sort((a, b) => a.title.localeCompare(b.title));

                            return (
                                <div
                                    key={`expanded-${bucket.id}`}
                                    className={`fixed top-[72px] md:top-[88px] inset-x-0 bottom-0 z-[45] flex flex-col bg-slate-50 overflow-hidden outline-none origin-top rounded-none transition-all duration-300`}
                                    style={{ opacity: expandedCategory === bucket.id ? 1 : 0, pointerEvents: expandedCategory === bucket.id ? 'auto' : 'none' }}
                                >
                                    {/* Immersive Header (Compact for maximum internal grid space) */}
                                    <div className={`relative px-6 py-6 md:px-10 md:py-8 shrink-0 ${bucket.bg}`}>
                                        {bucket.bgIcon}

                                        {/* Close Button X */}
                                        <button
                                            onClick={() => setExpandedCategory(null)}
                                            className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 transition-colors rounded-full flex items-center justify-center text-white shadow-xl border border-white/20 active:scale-95 z-50"
                                        >
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>

                                        <div className="relative z-10 max-w-4xl pr-12 md:pr-16 flex items-center gap-4 md:gap-5">
                                            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-black/40 shadow-inner border border-white/10 flex items-center justify-center shrink-0">
                                                {React.cloneElement(bucket.icon as React.ReactElement, { className: "w-6 h-6 md:w-8 md:h-8 text-white" })}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight leading-tight mb-0.5 md:mb-1">{bucket.label} Collection</h3>
                                                <p className="text-white/90 font-medium text-xs md:text-sm leading-snug hidden sm:block">Browse {bucketResources.length} peer-recommended resources dynamically sorted from the community.</p>
                                                <p className="text-white/90 font-medium text-xs leading-snug sm:hidden">{bucketResources.length} resources</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scrollable Internal Gallery */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar scroll-smooth">
                                        {bucketResources.length === 0 ? (
                                            <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300 transform rotate-3 shadow-inner"><div className="scale-150">{ICONS.Heart}</div></div>
                                                <p className="text-gray-400 font-bold text-2xl mb-4 tracking-tight">No resources in this category yet.</p>
                                                <Link to={`/add-resource?mode=recommend&type=${bucket.id}`} onClick={() => setExpandedCategory(null)} className="inline-flex px-10 py-4 mt-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black tracking-widest uppercase hover:bg-indigo-100 hover:shadow-md transition-all active:scale-95">Be the first to share</Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
                                                {bucketResources.map(res => <ResourceCard key={res.id} resource={res} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default ResourcesView;
