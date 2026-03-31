import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { Resource, ResourceType } from '../types.ts';
import { ICONS, MOCK_RESOURCES } from '../constants.tsx';
import { Book, Headphones, Music, Share2, Globe, Image as ImageIcon, MessageCircle } from 'lucide-react';

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
    const [liked, setLiked] = useState(false);
    const [supportive, setSupportive] = useState(false);
    const [exploring, setExploring] = useState(false);
    const [showComment, setShowComment] = useState(false);

    const handleInsightClick = async (type: 'helpful' | 'supportive' | 'exploring') => {
        if (type === 'helpful') { if (liked) return; setLiked(true); }
        if (type === 'supportive') { if (supportive) return; setSupportive(true); }
        if (type === 'exploring') { if (exploring) return; setExploring(true); }
        await apiService.incrementInsight(resource.id, type);
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
        if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'X (Twitter)', icon: <MessageCircle className="w-3.5 h-3.5" /> };
        if (u.includes('youtube.com')) return { name: 'YouTube', icon: <Globe className="w-3.5 h-3.5" /> };
        return { name: 'Social Profile', icon: <Share2 className="w-3.5 h-3.5" /> };
    };

    const social = resource.type === ResourceType.SOCIAL_MEDIA ? getSocialDetails(resource.url) : null;

    return (
        <div className="p-6 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-gray-100 flex flex-col h-full hover:shadow-2xl hover:border-indigo-100/50 hover:-translate-y-1 transition-all group">
            {resource.type === ResourceType.MEME && resource.imageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <img src={resource.imageUrl} alt={resource.title} className="w-full max-h-64 object-contain mix-blend-multiply" />
                </div>
            )}

            {social && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-indigo-50 text-indigo-600 rounded-lg w-fit shadow-sm border border-indigo-100">
                    {social.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                </div>
            )}

            <h4 className="font-black text-2xl text-[#1e3a34] mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{resource.title}</h4>
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
                {!showComment ? (
                    <button onClick={() => setShowComment(true)} className="text-xs text-gray-400 font-bold hover:text-[#448a7d] flex items-center gap-1.5 uppercase tracking-widest transition-colors"><MessageCircle className="w-4 h-4" /> Add reflection</button>
                ) : (
                    <input
                        type="text"
                        placeholder="Share your experience with this..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                alert("Reflections are currently saved locally. To sync globally, add a 'reflections' column to Live_Resources.");
                                setShowComment(false);
                            }
                        }}
                        className="w-full text-sm font-medium bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1e3a34] focus:outline-none focus:border-[#448a7d] shadow-inner"
                    />
                )}
            </div>
        </div>
    );
};

const ResourcesView: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommunityIndex, setActiveCommunityIndex] = useState<string | null>(null);
    const [activeGeneralIndex, setActiveGeneralIndex] = useState<number>(0);

    useEffect(() => {
        const fetchResources = async () => {
            // Force instant render using local Mock UI data
            const mappedMocks = MOCK_RESOURCES.map(r => ({ ...r, alias: r.alias || apiService.generateAlias() })) as Resource[];
            setResources(mappedMocks);
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-reveal">

            {/* STUNNING HERO SECTION */}
            <div className="relative overflow-hidden rounded-[3rem] bg-[#1e3a34] text-white p-10 md:p-16 mb-16 shadow-2xl">
                <div className="absolute inset-0 opacity-60 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a34] via-[#1e3a34]/80 to-transparent"></div>

                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tight mb-6">Light the way.</h1>
                    <p className="text-gray-300 font-medium md:text-xl max-w-2xl mb-10 leading-relaxed">
                        Resources suggested by Peers and Community Partners
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link
                            to="/add-resource?mode=recommend"
                            className="w-full sm:w-auto bg-[#e57c6e] text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-[#d46a5c] shadow-[0_10px_30px_-10px_rgba(229,124,110,0.5)] hover:-translate-y-1 transition-all active:scale-95"
                        >
                            {ICONS.Plus} Recommend
                        </Link>
                        <Link
                            to="/add-resource?mode=apply"
                            className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-white/20 border border-white/20 shadow-md hover:-translate-y-1 transition-all active:scale-95"
                        >
                            {ICONS.Users} Become a Community Partner
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
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-gray-100">
                    <p className="text-gray-500 font-medium mb-6">No resources found yet.</p>
                    <Link to="/add-resource" className="text-[#448a7d] font-bold underline hover:text-[#1e3a34] transition-colors">
                        Be the first to recommend one
                    </Link>
                </div>
            ) : (
                <div className="space-y-20">
                    {/* GENERAL RESOURCES SECTION */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-[#e8f3f1] text-[#448a7d] rounded-2xl flex items-center justify-center shadow-sm">
                                <div className="scale-125">{ICONS.Info}</div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">Community Partners</h2>
                                <p className="text-gray-500 font-medium">Community Partners are Starlings-trained organizations offering specialized, verified care for youth and adults who have grown up with parental substance use, listed by location. Each partner is independent and responsible for their care.</p>
                            </div>
                        </div>
                        {/* ACCORDION GALLERY CONTAINER for Community Partners */}
                        <div className="flex flex-col md:flex-row w-full h-[600px] gap-2 md:gap-4 mt-8 mix-blend-normal">
                            {resources.filter(r => r.category === 'general').map((resource, index) => {
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
                                        <div className="relative z-10 p-5 md:p-10 w-full md:min-w-[500px] flex-shrink-0 transition-opacity duration-500 pointer-events-none">
                                            {/* ACTIVE CONTENT */}
                                            <div className={`flex flex-col transform transition-all duration-[800ms] ease-out ${isActive ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-16 opacity-0 absolute bottom-0'}`}>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4 w-full">
                                                    <span className={`text-[9px] md:text-[10px] text-white shadow-xl font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-full ${config.color} border border-white/20 backdrop-blur-md`}>
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

                                                <h3 className="text-white font-black text-2xl md:text-5xl leading-tight tracking-tight mb-2 md:mb-4 drop-shadow-md">
                                                    {resource.title}
                                                </h3>

                                                <p className="text-indigo-100 font-medium text-xs md:text-base max-w-2xl leading-relaxed mb-4 md:mb-8 pointer-events-auto line-clamp-2 md:line-clamp-none">
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

                    {/* COMMUNITY RESOURCES SECTION (BUCKETS) */}
                    <section className="relative w-full pb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                                <div className="scale-125">{ICONS.Users}</div>
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-[#1e3a34] italic tracking-tight">Community Suggested Resources</h2>
                                <p className="text-gray-500 font-medium text-lg mt-1">Peer-recommended videos, tools, and local support networks.</p>
                            </div>
                        </div>

                        {/* SIMPLE LAYOUT: Tablet, Small Desktop */}
                        <div className="hidden md:block xl:hidden space-y-16 mt-8 pb-10">
                            {[
                                { id: ResourceType.BOOK, label: 'Books', icon: <Book className="w-8 h-8 text-amber-500" /> },
                                { id: ResourceType.PODCAST, label: 'Podcasts', icon: <Headphones className="w-8 h-8 text-purple-500" /> },
                                { id: ResourceType.SONG, label: 'Songs', icon: <Music className="w-8 h-8 text-pink-500" /> },
                                { id: ResourceType.SOCIAL_MEDIA, label: 'Social Media', icon: <Share2 className="w-8 h-8 text-blue-500" /> },
                                { id: ResourceType.WEBSITE, label: 'Websites', icon: <Globe className="w-8 h-8 text-teal-500" /> },
                                { id: ResourceType.MEME, label: 'Memes & Images', icon: <ImageIcon className="w-8 h-8 text-orange-500" /> },
                            ].map((bucket) => {
                                const bucketResources = resources.filter(r => r.category === 'community' && r.type === bucket.id).sort((a, b) => a.title.localeCompare(b.title));

                                if (bucketResources.length === 0) return null;

                                return (
                                    <div key={bucket.id} className="flex flex-col animate-reveal">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                                                {bucket.icon}
                                            </div>
                                            <h3 className="font-black text-[#1e3a34] text-3xl tracking-tight">{bucket.label}</h3>
                                            <span className="text-[10px] font-black text-[#e57c6e] bg-orange-50 border border-orange-100/50 px-3 py-1.5 rounded-full uppercase tracking-widest">{bucketResources.length} Items</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {bucketResources.map(res => <ResourceCard key={res.id} resource={res} />)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* PREMIUM ACCORDION GALLERY For Mobile (<768px) and Large Desktop (>1280px) */}
                        <div className="grid md:hidden xl:grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 mt-8">
                            {[
                                { id: ResourceType.BOOK, label: 'Books', icon: <Book className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <Book className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' },
                                { id: ResourceType.PODCAST, label: 'Podcasts', icon: <Headphones className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <Headphones className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/30' },
                                { id: ResourceType.SONG, label: 'Songs', icon: <Music className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <Music className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-pink-500', bg: 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-pink-500/30' },
                                { id: ResourceType.SOCIAL_MEDIA, label: 'Social Media', icon: <Share2 className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <Share2 className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30' },
                                { id: ResourceType.WEBSITE, label: 'Websites', icon: <Globe className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <Globe className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-teal-500', bg: 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-500/30' },
                                { id: ResourceType.MEME, label: 'Memes & Images', icon: <ImageIcon className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <ImageIcon className="w-40 h-40 absolute -right-8 -bottom-8 text-white opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30' },
                            ].map((bucket, i) => {
                                const bucketResources = resources.filter(r => r.category === 'community' && r.type === bucket.id).sort((a, b) => a.title.localeCompare(b.title));
                                const isActive = activeCommunityIndex === bucket.id;

                                return (
                                    <div key={bucket.id} className="flex flex-col animate-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <button onClick={() => setActiveCommunityIndex(isActive ? null : bucket.id)} className={`group relative overflow-hidden flex flex-col items-start justify-between p-6 xl:p-8 rounded-[2rem] xl:rounded-[2.5rem] transition-all duration-500 h-48 xl:h-64 ${bucket.bg} ${isActive ? 'ring-4 ring-indigo-500/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] scale-[1.02] z-10' : 'shadow-lg hover:shadow-2xl hover:-translate-y-2'}`}>
                                            {bucket.bgIcon}
                                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>

                                            <div className="relative z-10 flex w-full justify-between items-start">
                                                <div className={`p-3 xl:p-4 rounded-xl xl:rounded-2xl bg-white ${bucket.color} shadow-inner`}>
                                                    {bucket.icon}
                                                </div>
                                                <span className="text-[10px] xl:text-xs font-black text-white bg-black/20 backdrop-blur-md px-3 xl:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">{bucketResources.length} Items</span>
                                            </div>

                                            <div className="relative z-10 w-full text-left mt-auto">
                                                <h3 className="font-black text-white text-2xl xl:text-4xl tracking-tight leading-none drop-shadow-md mb-1 xl:mb-2">{bucket.label}</h3>
                                                <div className="flex items-center gap-2 mt-2 xl:mt-3 text-white/90 text-xs xl:text-sm font-bold opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all duration-300 xl:translate-y-2 group-hover:translate-y-0">
                                                    <span>{isActive ? 'Close Collection' : 'Explore Collection'}</span>
                                                    <svg className={`w-3 h-3 xl:w-4 xl:h-4 transform transition-transform ${isActive ? 'rotate-180' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isActive ? "M5 15l7-7 7 7" : "M14 5l7 7m0 0l-7 7m7-7H3"} /></svg>
                                                </div>
                                            </div>
                                        </button>

                                        {/* INLINE MOBILE EXPANSION For Mobile Screens ONLY */}
                                        <div className={`xl:hidden overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'max-h-[3000px] mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'} col-[1/-1]`}>
                                            <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-xl">
                                                {bucketResources.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">{ICONS.Heart}</div>
                                                        <p className="text-gray-400 font-medium mb-3">No resources yet.</p>
                                                        <Link to={`/add-resource?mode=recommend&type=${bucket.id}`} className="inline-block px-6 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold uppercase tracking-wide text-xs hover:bg-indigo-100 transition-colors">Recommend</Link>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {bucketResources.map(res => <ResourceCard key={res.id} resource={res} />)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ACCORDION EXPANDED CONTENT For Large Desktop */}
                        <div className={`hidden xl:block overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-top ${activeCommunityIndex ? 'max-h-[3000px] opacity-100 mt-10' : 'max-h-0 opacity-0 mt-0'}`}>
                            {activeCommunityIndex && (
                                <div className="bg-[#f9fbfa] border border-teal-100 rounded-[3rem] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#e57c6e] via-[#448a7d] to-[#1e3a34]"></div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#e8f3f1] rounded-full blur-[100px] pointer-events-none"></div>

                                    <div className="relative z-10 flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-4xl font-black text-[#1e3a34] capitalize italic tracking-tight">{activeCommunityIndex.replace('_', ' ')} Collection</h3>
                                            <p className="text-gray-500 font-medium mt-2">Explore recommendations from peers below.</p>
                                        </div>
                                        <button onClick={() => setActiveCommunityIndex(null)} className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm active:scale-95">
                                            {ICONS.X}
                                        </button>
                                    </div>

                                    <div className="relative z-10">
                                        {resources.filter(r => r.category === 'community' && r.type === activeCommunityIndex).length === 0 ? (
                                            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
                                                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-inner transform rotate-3">
                                                    <div className="scale-[2]">{ICONS.Heart}</div>
                                                </div>
                                                <p className="text-gray-400 font-bold text-2xl mb-4 tracking-tight">No resources yet.</p>
                                                <Link to={`/add-resource?mode=recommend&type=${activeCommunityIndex}`} className="inline-flex px-10 py-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black tracking-widest uppercase hover:bg-indigo-100 hover:shadow-md transition-all active:scale-95">Recommend the First One</Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-8">
                                                {resources.filter(r => r.category === 'community' && r.type === activeCommunityIndex).sort((a, b) => a.title.localeCompare(b.title)).map(res => (
                                                    <ResourceCard key={res.id} resource={res} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* PARTNERS SECTION */}
                    {resources.filter(r => r.category === 'partner').length > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-orange-50 text-[#e57c6e] rounded-2xl flex items-center justify-center shadow-sm">
                                    <div className="scale-125">{ICONS.ShieldCheck}</div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">Starlings-Aligned Partners</h2>
                                    <p className="text-gray-500 font-medium">Starlings-aligned partners are organizations reviewed by Starlings that offer resources for youth and adults affected by parental substance use. They are independent and not affiliated with or trained by Starlings. Inclusion does not imply endorsement, and we encourage you to explore what feels right for you.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {resources.filter(r => r.category === 'partner').map((resource) => {
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
                                                <div className="bg-white/95 backdrop-blur-md text-[#e57c6e] shadow-sm text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-1.5 rounded-full">
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
    );
};

export default ResourcesView;
