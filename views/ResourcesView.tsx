import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { Resource, ResourceType, ReflectionItem } from '../types.ts';
import { ICONS, SEED_RESOURCES, EASE_OUT_EXPO, EASE_OUT_EXPO_CSS, supportsResourceImage } from '../constants.tsx';
import {
    Book,
    FileText,
    Globe,
    Headphones,
    Image as ImageIcon,
    MapPin,
    MessageCircle,
    Music,
    Share2,
    Video,
    Wrench,
    Shapes,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { useRef } from 'react';
import LoadingBar from '../components/LoadingBar.tsx';
import InfoPopover from '../components/InfoPopover.tsx';
import { FormattedText } from '../components/FormattedText.tsx';

const MAP_BASED_BUCKET_ID = 'map_based';
const OTHER_BUCKET_ID = 'other';
const KNOWN_RESOURCE_TYPES = new Set<string>(Object.values(ResourceType));

const hasMapLocation = (resource: Resource): boolean =>
    Boolean(
        resource.city &&
        Number.isFinite(resource.lat) &&
        Number.isFinite(resource.lng) &&
        (resource.lat !== 0 || resource.lng !== 0)
    );


const REFLECTIONS_PREVIEW_COUNT = 2;

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(query).matches
    );

    useEffect(() => {
        const media = window.matchMedia(query);
        const update = () => setMatches(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, [query]);

    return matches;
};

const ResourceCard: React.FC<{ resource: Resource; reflections: ReflectionItem[] }> = memo(({ resource, reflections }) => {
    const [liked, setLiked] = useState(false);
    const [supportive, setSupportive] = useState(false);
    const [exploring, setExploring] = useState(false);
    const [showReflection, setShowReflection] = useState(false);
    const [reflectionText, setReflectionText] = useState('');
    const [reflectionImageUrl, setReflectionImageUrl] = useState('');
    const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
    const [reflectionError, setReflectionError] = useState('');
    const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
    const [showAllReflections, setShowAllReflections] = useState(false);

    // Synchronous lock, not just state — React state updates can batch, so two
    // rapid clicks can both read `liked === false` before either re-render
    // lands. A ref updates immediately, so the second click is blocked for
    // real, not just after the fact. This is what stops one eager tap turning
    // into duplicate increments on Live_Resources.
    const insightLockRef = useRef({ helpful: false, supportive: false, exploring: false });

    const handleInsightClick = async (type: 'helpful' | 'supportive' | 'exploring') => {
        if (insightLockRef.current[type]) return;
        insightLockRef.current[type] = true;
        if (type === 'helpful') setLiked(true);
        if (type === 'supportive') setSupportive(true);
        if (type === 'exploring') setExploring(true);
        const result = await apiService.incrementInsight(resource.id, type);
        if (!result.success) {
            // Most likely the client-side rate-limit guardrail tripped — roll
            // back the optimistic UI and unlock so the user can try again in
            // a moment instead of the tap silently never counting.
            insightLockRef.current[type] = false;
            if (type === 'helpful') setLiked(false);
            if (type === 'supportive') setSupportive(false);
            if (type === 'exploring') setExploring(false);
        }
    };

    const handleReflectionSubmit = async () => {
        if (isSubmittingReflection) return; // already in flight — ignore repeat clicks
        const text = reflectionText.trim();
        if (!text) return;
        setReflectionError('');
        setIsSubmittingReflection(true);
        try {
            const result = await apiService.submitReflection(resource.id, text, reflectionImageUrl);
            if (result.flagged) {
                setReflectionError('Please revise this reflection to remove crisis details, links, contact information, or identifying details.');
                return;
            }
            if (result.success) {
                setReflectionSubmitted(true);
                setShowReflection(false);
                setReflectionText('');
                setReflectionImageUrl('');
            } else {
                setReflectionError(result.error || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmittingReflection(false);
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
    const resourceReflections = reflections.filter(r => r.resourceId === resource.id && !r.flagged);
    const visibleReflections = showAllReflections ? resourceReflections : resourceReflections.slice(0, REFLECTIONS_PREVIEW_COUNT);
    const imageFieldRelevant = supportsResourceImage(resource.type);

    return (
        <article className="p-5 md:p-8 bg-white rounded-2xl border border-gray-100 flex flex-col h-full shadow-sm md:rounded-[2rem] md:border-2 md:shadow-none md:hover:shadow-xl md:hover:border-indigo-100/50 transition-shadow transition-colors group [content-visibility:auto] [contain-intrinsic-size:1px_560px]">
            {resource.type === ResourceType.MEME && resource.imageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <img src={resource.imageUrl} alt={resource.title} loading="lazy" decoding="async" className="w-full max-h-64 object-contain" />
                </div>
            )}

            {social && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-indigo-50 text-indigo-600 rounded-lg w-fit shadow-sm border border-indigo-100">
                    {social.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                </div>
            )}

            <h4 className="font-black text-xl md:text-2xl text-[#1e3a34] mb-2 leading-tight break-words [overflow-wrap:anywhere]">{resource.title}</h4>
            {recommender && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recommended by {recommender}</p>}
            {hasMapLocation(resource) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-emerald-50 text-emerald-700 rounded-lg w-fit border border-emerald-100">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{resource.city}</span>
                </div>
            )}
            <FormattedText
                text={cleanDescription}
                className="text-base font-medium text-gray-600 leading-relaxed break-words [overflow-wrap:anywhere]"
                wrapperClassName="mb-6 flex-grow"
            />
            {resource.url && (resource.type !== ResourceType.MEME || !resource.imageUrl) && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-indigo-500 hover:text-indigo-600 hover:underline mb-6 inline-block uppercase tracking-widest">Explore Resource &rarr;</a>
            )}

            <div className="border-t border-gray-200 pt-5 mt-auto">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Peer Insights</p>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button onClick={() => handleInsightClick('helpful')} disabled={liked} className={`min-h-11 px-4 py-2 rounded-full text-xs font-black transition-colors disabled:cursor-default ${liked ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        ❤️ Helpful {((resource.helpful_count || 0) + (liked ? 1 : 0)) > 0 ? `(${((resource.helpful_count || 0) + (liked ? 1 : 0))})` : ''}
                    </button>
                    <button onClick={() => handleInsightClick('supportive')} disabled={supportive} className={`min-h-11 px-4 py-2 rounded-full text-xs font-black transition-colors disabled:cursor-default ${supportive ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        🤝 Supportive {((resource.supportive_count || 0) + (supportive ? 1 : 0)) > 0 ? `(${((resource.supportive_count || 0) + (supportive ? 1 : 0))})` : ''}
                    </button>
                    <button onClick={() => handleInsightClick('exploring')} disabled={exploring} className={`min-h-11 px-4 py-2 rounded-full text-xs font-black transition-colors disabled:cursor-default ${exploring ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
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
                            disabled={isSubmittingReflection}
                            className="w-full text-sm font-medium bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1e3a34] focus:outline-none focus:border-[#448a7d] shadow-inner min-h-24 resize-none disabled:opacity-60"
                        />
                        {imageFieldRelevant && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <label htmlFor={`reflection-image-${resource.id}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Add a photo (optional)
                                    </label>
                                    <InfoPopover label="How to get an image link">
                                        <p className="font-black uppercase tracking-widest text-[9px] text-[#7ec8ba] mb-1.5">
                                            Getting a photo link
                                        </p>
                                        Upload your photo somewhere like Google Photos or Imgur, open it, then copy the{' '}
                                        <span className="font-bold text-white">shareable image link</span> — not the page link — and paste it below.
                                    </InfoPopover>
                                </div>
                                <input
                                    id={`reflection-image-${resource.id}`}
                                    type="url"
                                    value={reflectionImageUrl}
                                    onChange={(e) => setReflectionImageUrl(e.target.value)}
                                    placeholder="Paste an image link..."
                                    disabled={isSubmittingReflection}
                                    className="w-full text-sm font-medium bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1e3a34] focus:outline-none focus:border-[#448a7d] shadow-inner disabled:opacity-60"
                                />
                            </div>
                        )}
                        {reflectionError && <p className="text-xs text-red-600 font-bold">{reflectionError}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={handleReflectionSubmit}
                                disabled={isSubmittingReflection || !reflectionText.trim()}
                                className="px-4 py-2 rounded-full bg-[#1e3a34] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2d5a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1e3a34] flex items-center gap-2"
                            >
                                {isSubmittingReflection && (
                                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                                )}
                                {isSubmittingReflection ? 'Submitting...' : 'Submit'}
                            </button>
                            <button
                                onClick={() => { setShowReflection(false); setReflectionError(''); }}
                                disabled={isSubmittingReflection}
                                className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowReflection(true)} className="min-h-11 text-xs text-gray-500 font-bold hover:text-[#448a7d] flex items-center gap-1.5 uppercase tracking-widest transition-colors">
                        <MessageCircle className="w-4 h-4" /> Add reflection
                    </button>
                )}

                {resourceReflections.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageCircle className="w-3.5 h-3.5 text-[#448a7d]" />
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">What others shared</p>
                            <span className="text-[10px] font-black text-[#448a7d] bg-[#e8f3f1] rounded-full px-2 py-0.5 tabular-nums">
                                {resourceReflections.length}
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <AnimatePresence initial={false}>
                                {visibleReflections.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={i >= REFLECTIONS_PREVIEW_COUNT ? { opacity: 0, y: -6 } : false}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                                        className="relative bg-[#f4faf7] rounded-2xl p-4 pl-5 border border-[#c8e0da]/60"
                                    >
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-[#448a7d]/25" aria-hidden="true" />
                                        <FormattedText text={r.reflection} className="text-sm text-[#1e3a34]/80 italic leading-relaxed" />
                                        {r.imageUrl && (
                                            <img
                                                src={r.imageUrl}
                                                alt=""
                                                loading="lazy"
                                                className="mt-3 w-full max-h-48 object-cover rounded-xl border border-[#c8e0da]/60"
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        {resourceReflections.length > REFLECTIONS_PREVIEW_COUNT && (
                            <button
                                onClick={() => setShowAllReflections(v => !v)}
                                className="mt-2.5 text-[11px] font-black text-[#448a7d] uppercase tracking-widest hover:underline"
                            >
                                {showAllReflections ? 'Show less' : `+${resourceReflections.length - REFLECTIONS_PREVIEW_COUNT} more`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}, (prevProps, nextProps) => {
    const prev = prevProps.resource;
    const next = nextProps.resource;
    return prev.id === next.id &&
        prev.title === next.title &&
        prev.description === next.description &&
        prev.helpful_count === next.helpful_count &&
        prev.supportive_count === next.supportive_count &&
        prev.exploring_count === next.exploring_count &&
        prevProps.reflections === nextProps.reflections;
});

const MobileResourcesHero: React.FC = () => (
    <section className="relative -mx-4 -mt-5 mb-0 flex min-h-[calc(100svh-8.75rem)] flex-col overflow-hidden bg-[#17342e] text-white">
        <div className="flex min-h-12 items-center justify-between gap-4 bg-[#e57c6e] px-5 py-3 text-[#17342e] [@media(max-height:720px)]:min-h-10 [@media(max-height:720px)]:py-2">
            <p className="text-sm font-black leading-tight">A community-built resource guide</p>
            <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-[#17342e]" />
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="h-2 w-2 rounded-full bg-[#f7d968]" />
            </span>
        </div>

        <div className="relative flex flex-1 flex-col px-5 pb-7 pt-8 [@media(max-height:720px)]:pb-4 [@media(max-height:720px)]:pt-6">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold text-[#b9d8d2] [@media(max-height:720px)]:mb-3 [@media(max-height:720px)]:text-[13px]">
                <span className="h-2 w-2 rounded-full bg-[#7ec8ba]" aria-hidden="true" />
                Recommended by peers + partners
            </p>
            <h1 className="max-w-[11ch] font-cabinet text-[clamp(2.55rem,12vw,3.35rem)] font-black leading-[0.92] tracking-[-0.035em] text-white [@media(max-height:720px)]:text-[2.25rem]">
                Made by community.
                <span className="block text-[#f09a8e]">Shared with you.</span>
            </h1>
            <p className="mt-5 max-w-[30rem] text-[15px] font-medium leading-[1.6] text-[#dceae7] [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:text-sm [@media(max-height:720px)]:leading-[1.5]">
                Explore resources recommended by people with lived experience and trusted community partners.
            </p>

            <div className="flex min-h-20 flex-1 items-center justify-end py-2 [@media(max-height:720px)]:min-h-12 [@media(max-height:720px)]:py-1" aria-hidden="true">
                <img
                    src={`${import.meta.env.BASE_URL}favicon.png`}
                    alt=""
                    width="256"
                    height="256"
                    decoding="async"
                    className="h-auto w-32 opacity-[0.45] [@media(max-height:720px)]:w-24"
                />
            </div>

            <div>
                <Link
                    to="/add-resource?mode=recommend"
                    className="flex min-h-14 w-full items-center justify-between bg-white px-5 text-left text-sm font-black text-[#17342e] transition-colors active:bg-[#dcece8]"
                >
                    <span>Recommend a resource</span>
                    <span className="flex h-8 w-8 items-center justify-center bg-[#e57c6e] text-[#17342e]" aria-hidden="true">
                        {ICONS.Plus}
                    </span>
                </Link>
                <Link
                    to="/add-resource?mode=apply"
                    className="mt-2 flex min-h-12 w-full items-center justify-between px-1 text-sm font-bold text-[#b9d8d2] transition-colors active:text-white"
                >
                    <span>Work with Starlings? Become a partner</span>
                    <span className="ml-3 text-lg" aria-hidden="true">→</span>
                </Link>
            </div>
        </div>
    </section>
);

const DesktopResourcesHero: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

    const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
    const contentY = useTransform(scrollYProgress, [0, 0.6], ['0%', '-12%']);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 20 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 });
    const orbX = useTransform(mouseX, [-0.5, 0.5], [12, -12]);
    const orbY = useTransform(mouseY, [-0.5, 0.5], [8, -8]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

    const headlineLines = ['From our', 'community,', 'for you.'];

    return (
        <div ref={heroRef} className="mb-8 md:mb-16" style={{ perspective: '1200px' }}>
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] min-h-[70vw] md:min-h-[60vh] lg:min-h-[65vh] flex flex-col shadow-[0_40px_100px_-20px_rgba(15,38,32,0.45)] will-change-transform"
            >
                {/* Parallax photo */}
                <motion.div style={{ y: photoY }} className="absolute inset-[-10%] will-change-transform" aria-hidden="true">
                    <img
                        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f2620] via-[#0f2620]/25 to-transparent" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f2620]/55 to-transparent" aria-hidden="true" />

                {/* Floating orb — moves opposite to tilt */}
                <motion.div
                    style={{ x: orbX, y: orbY, background: 'radial-gradient(ellipse at center, #448a7d 0%, transparent 70%)', filter: 'blur(32px)' }}
                    className="absolute top-6 right-8 w-48 h-48 md:w-72 md:h-72 rounded-full opacity-20 pointer-events-none will-change-transform"
                    aria-hidden="true"
                />

                {/* Content — scrolls + fades out */}
                <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mt-auto p-7 md:p-12 lg:p-16 will-change-transform">
                    {/* Eyebrow */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                        className="flex items-center gap-3 mb-5 md:mb-6"
                    >
                        <motion.span
                            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
                            style={{ originX: 0 }}
                            className="block w-6 h-px bg-[#448a7d]"
                        />
                        <span className="text-[#7ec8ba] text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                            Peer &amp; Community Resources
                        </span>
                    </motion.div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-12">
                        {/* Staggered headline */}
                        <h1 className="font-black italic text-white leading-[0.9] tracking-tight text-[2.8rem] md:text-[5rem] lg:text-[6.5rem] max-w-3xl">
                            {headlineLines.map((line, i) => (
                                <motion.span
                                    key={line}
                                    initial={{ opacity: 0, y: 40, rotateX: -20 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.15 + i * 0.1 }}
                                    style={{ display: 'block', transformOrigin: 'bottom' }}
                                >
                                    {line}
                                </motion.span>
                            ))}
                        </h1>

                        {/* Subtext + buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.45 }}
                            className="space-y-4 md:space-y-5 shrink-0 md:w-64 lg:w-72 md:pb-1"
                        >
                            <p className="text-white/55 text-sm leading-relaxed font-light">
                                Resources suggested by Peers and Community Partners
                            </p>
                            <div className="flex flex-col gap-2.5">
                                <Link
                                    to="/add-resource?mode=recommend"
                                    className="w-full bg-[#e57c6e] hover:bg-[#cf6a5e] text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-[0_8px_24px_-6px_rgba(229,124,110,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                                >
                                    {ICONS.Plus} Recommend
                                </Link>
                                <Link
                                    to="/add-resource?mode=apply"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 border border-white/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                                >
                                    {ICONS.Users} Become a Partner
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

/**
 * Full-width loading experience shown while Google Sheets data hot-swaps.
 * Uses the murmuration photo as background + animated starling silhouettes.
 */
const MurmurationSyncBanner: React.FC<{ syncing: boolean; count: number; mobile?: boolean }> = ({ syncing, count, mobile = false }) => {
    const [phase, setPhase] = useState<'idle' | 'syncing' | 'done'>('idle');

    useEffect(() => {
        if (syncing) {
            setPhase('syncing');
        } else if (phase === 'syncing') {
            setPhase('done');
            const t = setTimeout(() => setPhase('idle'), 2600);
            return () => clearTimeout(t);
        }
    }, [syncing]);

    if (mobile) {
        return (
            <AnimatePresence>
                {phase !== 'idle' && (
                    <motion.div
                        key={phase}
                        role="status"
                        aria-live="polite"
                        className="fixed inset-x-4 bottom-4 z-[4500] flex min-h-16 items-center gap-3 rounded-2xl bg-[#17342e] px-4 py-3 text-white shadow-[0_8px_28px_-10px_rgba(23,52,46,0.62)] md:hidden"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                    >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dcece8] text-[#1e3a34]" aria-hidden="true">
                            {phase === 'syncing' ? (
                                <>
                                    <span className="absolute h-2 w-2 -translate-x-2 -translate-y-1 rounded-full bg-[#448a7d] animate-pulse" />
                                    <span className="absolute h-2 w-2 translate-x-2 translate-y-1 rounded-full bg-[#e57c6e] animate-pulse [animation-delay:180ms]" />
                                    <span className="h-px w-5 -rotate-[24deg] bg-[#1e3a34]/25" />
                                </>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                                    <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-sm font-black leading-tight break-words">
                                {phase === 'syncing' ? 'Refreshing community picks' : 'Resources are up to date'}
                            </p>
                            <p className="mt-1 text-[11px] font-medium leading-snug text-[#c7ddd8] break-words">
                                {phase === 'syncing' ? 'You can start browsing while we check for new additions.' : count > 0 ? `${count} live resources ready to explore.` : 'Live resources are ready.'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {phase === 'syncing' && (
                <motion.div
                    key="sync-banner"
                    className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] mb-10 md:mb-16 flex items-center gap-8 md:gap-14 px-7 md:px-12"
                    initial={{ opacity: 0, y: -24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                    style={{ background: '#1e3a34', minHeight: 'clamp(168px, 22vw, 240px)' }}
                    aria-live="polite"
                    aria-label="Loading live community resources"
                >
                    {/* Subtle dot texture */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.06]"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                    />
                    {/* Right-side coral glow */}
                    <div
                        className="absolute right-0 inset-y-0 w-1/2 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(229,124,110,0.08) 0%, transparent 70%)' }}
                    />

                    {/* Book loader — primary visual, left side (hidden on very small screens) */}
                    <motion.div
                        className="hidden sm:flex flex-shrink-0 items-end justify-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.6, ease: EASE_OUT_EXPO }}
                        aria-hidden="true"
                    >
                        <div className="cr-book-loader">
                            <div>
                                <ul>
                                    {/* Page 1 — static front cover */}
                                    <li>
                                        <svg viewBox="0 0 90 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="90" height="120" rx="4" fill="currentColor" />
                                            <rect x="12" y="18" width="52" height="5" rx="2.5" fill="rgba(30,58,52,0.18)" />
                                            <rect x="12" y="30" width="40" height="4" rx="2" fill="rgba(30,58,52,0.12)" />
                                            <rect x="12" y="42" width="48" height="4" rx="2" fill="rgba(30,58,52,0.12)" />
                                            <rect x="12" y="54" width="36" height="4" rx="2" fill="rgba(30,58,52,0.12)" />
                                            <rect x="12" y="66" width="44" height="4" rx="2" fill="rgba(30,58,52,0.12)" />
                                            <rect x="12" y="78" width="30" height="4" rx="2" fill="rgba(30,58,52,0.10)" />
                                        </svg>
                                    </li>
                                    {/* Pages 2-5 — animated flip pages */}
                                    {[2, 3, 4, 5].map((n) => (
                                        <li key={n}>
                                            <svg viewBox="0 0 90 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="90" height="120" rx="4" fill="currentColor" />
                                                <rect x="12" y="18" width={52 - n * 4} height="5" rx="2.5" fill="rgba(30,58,52,0.15)" />
                                                <rect x="12" y="30" width={40 - n * 2} height="4" rx="2" fill="rgba(30,58,52,0.10)" />
                                                <rect x="12" y="42" width={48 - n * 3} height="4" rx="2" fill="rgba(30,58,52,0.10)" />
                                                <rect x="12" y="54" width={36 + n * 2} height="4" rx="2" fill="rgba(30,58,52,0.10)" />
                                                <rect x="12" y="66" width={44 - n} height="4" rx="2" fill="rgba(30,58,52,0.10)" />
                                            </svg>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <span>Gathering…</span>
                        </div>
                    </motion.div>

                    {/* Text content — right side */}
                    <motion.div
                        className="relative z-10 flex-1 min-w-0 py-8 md:py-10"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.65, ease: EASE_OUT_EXPO }}
                    >
                        <div className="inline-flex items-center gap-2.5 mb-4 select-none">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-[#7ec8ba] animate-spin flex-shrink-0" aria-hidden="true" />
                            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7ec8ba]">
                                Loading resources
                            </span>
                        </div>

                        <h3 className="font-cabinet font-black text-white leading-tight tracking-tight mb-5"
                            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)' }}>
                            Gathering live<br className="hidden sm:block" /> community resources.
                        </h3>

                        {/* Indeterminate progress bar */}
                        <div className="relative h-1.5 rounded-full overflow-hidden max-w-[240px]"
                            style={{ background: 'rgba(255,255,255,0.12)' }}>
                            <motion.div
                                className="absolute inset-y-0 rounded-full"
                                style={{ width: '42%', background: 'linear-gradient(90deg, #448a7d, #7ec8ba)' }}
                                animate={{ x: ['-42%', '280%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], repeatDelay: 0.1 }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {phase === 'done' && (
                <motion.div
                    key="sync-done"
                    className="flex justify-center mb-10 md:mb-16"
                    initial={{ opacity: 0, scale: 0.82, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                >
                    <div className="inline-flex items-center gap-3 px-5 py-3.5 bg-[#1e3a34] text-white rounded-full shadow-[0_12px_36px_-8px_rgba(30,58,52,0.6)]">
                        <div className="w-6 h-6 rounded-full bg-[#448a7d] flex items-center justify-center flex-shrink-0">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M2.5 6l2.5 2.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="font-black text-sm tracking-tight">
                            {count > 0 ? `${count} live resources loaded` : 'Live data loaded'}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ResourcesView: React.FC = () => {
    const isMobileViewport = useMediaQuery('(max-width: 767px)');
    const [resources, setResources] = useState<Resource[]>([]);
    const [reflections, setReflections] = useState<ReflectionItem[]>([]);
    const [loading, setLoading] = useState(true);
    /** Tracks the background Google Sheets hot-swap — drives the LoadingBar + MurmurationSyncBanner */
    const [syncing, setSyncing] = useState(false);
    /** Captured when sync completes — passed to the banner for the "N resources loaded" message */
    const [syncedCount, setSyncedCount] = useState(0);
    const [activeCommunityIndex, setActiveCommunityIndex] = useState<string | null>(null);
    const [activeGeneralIndex, setActiveGeneralIndex] = useState<number>(0);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Scroll-driven screenshot pan — Community Partners desktop accordion
    const cpAccordionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: cpScrollProgress } = useScroll({
        target: cpAccordionRef,
        offset: ['start end', 'end start'],
    });
    // Pan starts at 50% scroll progress through the section, completes at 80%
    const cpScreenshotPct = useTransform(cpScrollProgress, [0.5, 0.80], [0, 100], { clamp: true });
    const cpScreenshotPos = useMotionTemplate`center ${cpScreenshotPct}%`;

    useEffect(() => {
        const fetchResources = async () => {
            // Show seed resources immediately so the page is never blank.
            const seedResources = SEED_RESOURCES.map(r => ({ ...r, alias: r.alias || apiService.generateAlias() })) as Resource[];
            setResources(seedResources);
            setLoading(false);

            // Background hot-swap with live Google Sheets data.
            // LoadingBar + MurmurationSyncBanner both track this state.
            setSyncing(true);
            try {
                const data = await apiService.getApprovedResources(true);
                setSyncedCount(data.length);
                // Preserve the immediately rendered fallback if a malformed
                // response ever slips through; an empty sync is not an update.
                if (data.length > 0) setResources(data);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            } finally {
                setSyncing(false);
            }

            // Approved reflections — fetched separately, non-blocking. Safe to
            // fail silently (returns []) until the backend's getReflections
            // route is deployed; see docs/backend/Code.gs.js.
            try {
                setReflections(await apiService.getApprovedReflections());
            } catch (error) {
                console.error('Failed to fetch reflections', error);
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
        { id: ResourceType.VIDEO, label: 'Videos', icon: <Video className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-rose-500', bg: 'bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-500/30' },
        { id: ResourceType.PUBLICATION, label: 'Publications', icon: <FileText className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-indigo-500', bg: 'bg-gradient-to-br from-indigo-400 to-indigo-700 shadow-indigo-500/30' },
        { id: ResourceType.TOOL, label: 'Tools', icon: <Wrench className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-cyan-600', bg: 'bg-gradient-to-br from-cyan-400 to-cyan-700 shadow-cyan-500/30' },
        { id: ResourceType.BOOK, label: 'Books', icon: <Book className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' },
        { id: ResourceType.PODCAST, label: 'Podcasts', icon: <Headphones className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/30' },
        { id: ResourceType.SONG, label: 'Songs', icon: <Music className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-pink-500', bg: 'bg-gradient-to-br from-pink-400 to-pink-600 shadow-pink-500/30' },
        { id: ResourceType.SOCIAL_MEDIA, label: 'Social Media', icon: <Share2 className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30' },
        { id: ResourceType.WEBSITE, label: 'Websites', icon: <Globe className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-teal-500', bg: 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-500/30' },
        { id: ResourceType.MEME, label: 'Memes & Images', icon: <ImageIcon className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30' },
        { id: OTHER_BUCKET_ID, label: 'Other Resources', icon: <Shapes className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-slate-500', bg: 'bg-gradient-to-br from-slate-400 to-slate-700 shadow-slate-500/30' },
        { id: MAP_BASED_BUCKET_ID, label: 'Map-Based Resources', icon: <MapPin className="w-8 h-8 xl:w-10 xl:h-10" />, bgIcon: <div />, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-400 to-teal-700 shadow-emerald-500/30' },
    ];

    // MEMOIZED: Compute bucket resources only when resources array changes
    //
    // Format and location are independent ways to browse. A located website,
    // book, or video belongs in its format bucket AND Map-Based Resources.
    // Other Resources only catches unknown formats without a map location.
    const communityBucketResources = useMemo(() => {
        const result: Record<string, Resource[]> = {};
        COMMUNITY_BUCKETS.forEach(bucket => {
            result[bucket.id] = resources
                .filter(r => {
                    if (r.category !== 'community') return false;
                    const isKnownType = KNOWN_RESOURCE_TYPES.has(String(r.type));
                    if (bucket.id === MAP_BASED_BUCKET_ID) return hasMapLocation(r);
                    if (bucket.id === OTHER_BUCKET_ID) return !isKnownType && !hasMapLocation(r);
                    return isKnownType && r.type === bucket.id;
                })
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
            {/* Page-level loading bar — tracks the background Google Sheets hot-swap */}
            {!isMobileViewport && (
                <LoadingBar
                    isLoading={syncing}
                    className="fixed top-0 left-0 right-0 z-[5001]"
                    statusPillClassName="fixed bottom-5 right-5 z-[5002]"
                />
            )}

            <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 py-5 md:overflow-visible md:py-12 animate-reveal">

                {isMobileViewport ? <MobileResourcesHero /> : <DesktopResourcesHero />}

                {/* Murmuration loading experience — slides in while Google Sheets data loads */}
                <MurmurationSyncBanner syncing={syncing} count={syncedCount} mobile={isMobileViewport} />

                {resources.length === 0 ? (
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

                            {/* ── MOBILE: text zone keeps the live flashlight background; card
                                 zone below breaks full-bleed black — two visually distinct
                                 bands instead of one unified panel ── */}
                            {isMobileViewport && <div className="md:hidden">

                                {/* TOP: eyebrow / heading / description — flashlight bg, now
                                     full-bleed (matches the card band below) and taller, so the
                                     animation actually gets room to read. A bottom gradient fades
                                     the overlay toward black so the seam with the card band melts
                                     together instead of cutting hard. */}
                                <div className="relative -mx-4 overflow-hidden">
                                    {/* Flashlight background — fills this zone only */}
                                    <div className="cp-flashlight" aria-hidden="true" />
                                    {/* Dark overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: 'rgba(7,16,12,0.88)' }}
                                    />
                                    {/* Fade to black at the bottom — blends into the card band */}
                                    <div
                                        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                                        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
                                        aria-hidden="true"
                                    />

                                    <div className="relative z-10 px-4 pt-7 pb-10">

                                        {/* One quiet metadata line that belongs to the background. */}
                                        <div className="mb-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[#7ec5b8]/70">
                                            <span>Peer &amp; Community Resources</span>
                                            <span className="h-1 w-1 rounded-full bg-[#448a7d]" aria-hidden="true" />
                                            <span>{communityPartners.length} verified</span>
                                        </div>

                                        {/* Heading */}
                                        <h2
                                            className="mb-3 text-center font-cabinet font-black leading-[1.06] tracking-tight text-white"
                                            style={{ fontSize: 'clamp(1.9rem, 7.2vw, 2.6rem)' }}
                                        >
                                            <span className="block">Starlings&#8209;trained</span>
                                            <span className="block text-[#e57c6e] italic">care partner</span>
                                        </h2>

                                        <div className="mx-auto mb-4 h-px w-10" style={{ background: 'rgba(68,138,125,0.35)' }} />

                                        {/* Description — fuller copy, matches the desktop version */}
                                        <p className="text-[13px] font-medium leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '94%' }}>
                                            Starlings&#8209;trained organizations offering{' '}
                                            <span className="font-semibold" style={{ color: '#7ec5b8' }}>specialized, verified care</span>{' '}
                                            for youth and adults who have grown up with parental substance use.
                                            Listed by location — each partner is independent and responsible for their care.
                                        </p>

                                        {/* Verified badge + become-a-partner CTA */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-block text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[#448a7d] text-white rounded-full">
                                                ✓ Verified
                                            </span>
                                            <Link
                                                to="/add-resource?mode=apply"
                                                className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-200"
                                            >
                                                Become a partner
                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM: accordion cards — solid black, full-bleed edge-to-edge */}
                                <div className="relative -mx-4 bg-black overflow-hidden">
                                    <div className="px-4 pt-4 pb-5">

                                        {/* Divider */}
                                        <div className="mb-3" style={{ height: '1px', background: 'rgba(68,138,125,0.18)' }} />

                                        {/* Accordion cards — macOS browser window style */}
                                        <div className="flex flex-col gap-2.5">
                                        {communityPartners.map((resource, index) => {
                                            const config = typeConfig[resource.type] || typeConfig.website;
                                            const isActive = activeGeneralIndex === index;
                                            const idx = String(index + 1).padStart(2, '0');
                                            let recommender = null;
                                            let cleanDescription = resource.description || '';
                                            const recMatch = cleanDescription.match(/^Recommended by '([^']+)':\s*(.*)/);
                                            if (recMatch) { recommender = recMatch[1]; cleanDescription = recMatch[2]; }
                                            let mobDomain = '';
                                            try { mobDomain = resource.url ? new URL(resource.url).hostname.replace('www.', '') : ''; } catch { mobDomain = ''; }

                                            return (
                                                <div
                                                    key={resource.id}
                                                    className="rounded-[1.2rem] overflow-hidden cursor-pointer"
                                                    style={{
                                                        background: isActive ? 'rgba(5,12,10,0.96)' : 'rgba(255,255,255,0.035)',
                                                        border: isActive ? '1px solid rgba(68,138,125,0.32)' : '1px solid rgba(255,255,255,0.07)',
                                                        boxShadow: isActive ? '0 14px 40px -12px rgba(0,0,0,0.65)' : 'none',
                                                        transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
                                                    }}
                                                    onClick={() => setActiveGeneralIndex(isActive ? -1 : index)}
                                                >
                                                    {/* ── macOS chrome bar — always visible, primary tap target ── */}
                                                    <div
                                                        className="flex items-center gap-2.5 px-3.5 py-2.5"
                                                        style={{
                                                            background: isActive ? 'rgba(3,9,7,0.98)' : 'rgba(8,20,15,0.65)',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        }}
                                                    >
                                                        {/* Traffic lights */}
                                                        <div className="flex items-center gap-[5px] flex-shrink-0">
                                                            <div className="w-[10px] h-[10px] rounded-full" style={{ background: '#ff5f57' }} />
                                                            <div className="w-[10px] h-[10px] rounded-full" style={{ background: '#febc2e' }} />
                                                            <div className="w-[10px] h-[10px] rounded-full" style={{ background: '#28c840' }} />
                                                        </div>
                                                        {/* URL bar */}
                                                        <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2.5 py-[5px] rounded-[6px]" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                            <svg className="w-[9px] h-[9px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2.5}>
                                                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                            <span className="text-[10px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                                                {mobDomain || resource.title}
                                                            </span>
                                                        </div>
                                                        {/* Index + chevron */}
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className="text-[10px] font-black tabular-nums" style={{ color: isActive ? '#448a7d' : 'rgba(255,255,255,0.18)', fontFeatureSettings: '"tnum"' }}>
                                                                {idx}
                                                            </span>
                                                            <motion.div
                                                                animate={{ rotate: isActive ? 180 : 0 }}
                                                                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                                                style={{ background: 'rgba(255,255,255,0.06)' }}
                                                            >
                                                                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {/* Collapsed label only. When open, the screenshot connects
                                                        directly to the browser chrome and the title appears once below. */}
                                                    {!isActive && (
                                                        <div className="flex items-center gap-2.5 px-3.5 py-3">
                                                            <span
                                                                className="text-[8px] font-black uppercase tracking-widest flex-shrink-0 px-2 py-0.5 rounded-full"
                                                                style={{ background: 'rgba(68,138,125,0.10)', color: 'rgba(126,197,184,0.72)' }}
                                                            >
                                                                {config.label}
                                                            </span>
                                                            <span className="flex-1 min-w-0 truncate text-[13px] font-black leading-snug text-white">
                                                                {resource.title}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Expandable: screenshot + info — grid-rows GPU trick */}
                                                    <div
                                                        className="grid overflow-hidden transition-[grid-template-rows] duration-500"
                                                        style={{ gridTemplateRows: isActive ? '1fr' : '0fr', transitionTimingFunction: EASE_OUT_EXPO_CSS }}
                                                    >
                                                        <div className="min-h-0">
                                                            {/* Screenshot 16:9 */}
                                                            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                                                {resource.imageUrl ? (
                                                                    <img src={resource.imageUrl} alt={resource.title} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0c2420 0%, #081410 100%)' }}>
                                                                        <div className="text-[#448a7d]/25 scale-[3]">{ICONS.Heart}</div>
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(3,9,7,0.95))' }} />
                                                            </div>

                                                            {/* Info strip */}
                                                            <div className="px-4 pt-3 pb-4" style={{ background: 'rgba(3,9,7,0.95)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                                {recommender && <p className="text-[9px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>by {recommender}</p>}
                                                                <p className="text-white font-black text-sm leading-snug mb-1">{resource.title}</p>
                                                                <p className="text-[11px] font-medium leading-relaxed mb-3.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.40)' }}>{cleanDescription}</p>
                                                                <a
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-white w-full py-3.5 rounded-[0.85rem] active:scale-[0.98] transition-transform"
                                                                    style={{ background: 'linear-gradient(135deg, #448a7d 0%, #2d5a52 100%)', boxShadow: '0 6px 20px -6px rgba(68,138,125,0.45)' }}
                                                                >
                                                                    Explore Resource
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {/* ── DESKTOP: Full-width side-by-side flashlight panel ── */}
                            {!isMobileViewport && <div
                                ref={cpAccordionRef}
                                className="hidden md:block relative overflow-hidden"
                                style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
                            >
                                {/* Flashlight city scan — fills the entire panel */}
                                <div className="cp-flashlight" aria-hidden="true" />

                                {/* Gradient — stronger on left for text legibility, lighter on right for the cards */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'linear-gradient(105deg, rgba(6,14,11,0.92) 0%, rgba(8,18,14,0.72) 35%, rgba(8,18,14,0.42) 100%)' }}
                                />

                                {/* Content wrapper */}
                                <div
                                    className="relative z-10"
                                    style={{ padding: 'clamp(2.5rem,4.5vw,4rem) clamp(2.5rem,5.5vw,7rem)' }}
                                >
                                {/* Top bar: page eyebrow LEFT | count badge RIGHT */}
                                <div className="flex items-center justify-between mb-8 lg:mb-10">
                                    <div className="flex items-center gap-3">
                                        <span className="block w-6 h-px bg-[#448a7d]/55 flex-shrink-0" />
                                        <span className="text-[#7ec5b8]/65 text-[10px] font-black uppercase tracking-[0.38em]">
                                            Peer &amp; Community Resources
                                        </span>
                                    </div>
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em]"
                                        style={{ background: 'rgba(68,138,125,0.14)', border: '1px solid rgba(68,138,125,0.26)', color: 'rgba(126,197,184,0.65)' }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#448a7d] inline-block" />
                                        {communityPartners.length} verified
                                    </span>
                                </div>

                                {/* Main row — intro LEFT + accordion RIGHT */}
                                <div className="flex items-stretch gap-10 lg:gap-14 xl:gap-20">

                                    {/* LEFT: intro text, vertically centred */}
                                    <div
                                        className="flex flex-col justify-center flex-shrink-0"
                                        style={{ width: 'clamp(240px, 29%, 400px)' }}
                                    >
                                        <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#448a7d]/75 mb-3">
                                            Community Partners
                                        </p>
                                        <h2
                                            className="font-cabinet font-black text-white italic tracking-tight leading-[1.05]"
                                            style={{ fontSize: 'clamp(1.85rem, 2.6vw, 3.1rem)' }}
                                        >
                                            Starlings&#8209;trained{' '}
                                            <span className="cp-words-slot">
                                                <span className="cp-words-word">care partner</span>
                                                <span className="cp-words-word">care organization</span>
                                                <span className="cp-words-word">youth specialist</span>
                                                <span className="cp-words-word">trusted partner</span>
                                                <span className="cp-words-word">community leader</span>
                                                <span className="cp-words-word">care partner</span>
                                            </span>
                                        </h2>
                                        <div className="w-10 h-px my-5" style={{ background: 'rgba(68,138,125,0.35)' }} />
                                        <p className="text-white/45 text-[13px] font-medium leading-relaxed mb-5">
                                            Starlings-trained organizations offering{' '}
                                            <span className="text-[#7ec5b8] font-semibold">specialized, verified care</span>{' '}
                                            for youth and adults who have grown up with parental substance use.
                                            Listed by location — each partner is independent and responsible for their care.
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-block text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[#448a7d] text-white rounded-full">
                                                ✓ Verified
                                            </span>
                                            <Link
                                                to="/add-resource?mode=apply"
                                                className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/65 text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-200"
                                            >
                                                Become a partner
                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* RIGHT: accordion, fills remaining width */}
                                    <div className="flex-1 min-w-0 flex items-center">
                                    <div className="flex w-full gap-3" style={{ height: 'clamp(320px, 48vh, 460px)' }}>
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
                                        let deskDomain = '';
                                        try { deskDomain = resource.url ? new URL(resource.url).hostname.replace('www.', '') : ''; } catch { deskDomain = ''; }

                                        return (
                                            <div
                                                key={resource.id}
                                                onMouseEnter={() => setActiveGeneralIndex(index)}
                                                onClick={() => setActiveGeneralIndex(index)}
                                                className={`overflow-hidden rounded-[1.5rem] md:rounded-[2rem] transition-all duration-[700ms] ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer flex flex-col
                                                    ${isActive
                                                        ? 'flex-[10] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]'
                                                        : 'flex-[1] border border-white/[0.09] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.4)] hover:flex-[1.6] hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,0.5)] hover:border-white/[0.16]'
                                                    }`}
                                                style={isActive ? { background: '#040b09', border: '1px solid rgba(68,138,125,0.20)' } : { background: 'rgba(4,11,9,0.55)', backdropFilter: 'blur(8px)' }}
                                            >
                                                {isActive ? (
                                                    <>
                                                        {/* Chrome bar — in flow, nothing overlaps it */}
                                                        <motion.div
                                                            key={`chrome-${resource.id}`}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.15, duration: 0.25 }}
                                                            className="flex-shrink-0 flex items-center gap-3 px-5 md:px-6 py-2.5 border-b border-white/[0.07]"
                                                            style={{ background: 'rgba(4,10,8,0.95)' }}
                                                        >
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setActiveGeneralIndex(-1); }}
                                                                    className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all flex items-center justify-center group/dot"
                                                                    title="Close"
                                                                >
                                                                    <svg className="w-1.5 h-1.5 text-[#820000]/80 opacity-0 group-hover/dot:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                                <button onClick={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all">
                                                                    <span className="sr-only">Minimize</span>
                                                                </button>
                                                                <a
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all flex items-center justify-center group/dot"
                                                                    title="Open site"
                                                                >
                                                                    <svg className="w-2 h-2 text-[#006500]/80 opacity-0 group-hover/dot:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                                                </a>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="bg-white/[0.08] rounded-md px-3 py-1 flex items-center gap-2 max-w-xs mx-auto">
                                                                    <svg className="w-2.5 h-2.5 text-white/30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                                    <span className="text-[10px] font-medium text-white/45 truncate">{deskDomain}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>

                                                        {/* Screenshot — flex-1, fills between chrome and info; objectPosition driven by scroll */}
                                                        <div className="flex-1 min-h-0 overflow-hidden">
                                                            {resource.imageUrl ? (
                                                                <motion.img
                                                                    initial={{ opacity: 0, scale: 1.04 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                                    src={resource.imageUrl}
                                                                    alt={resource.title}
                                                                    className="w-full h-full object-cover"
                                                                    style={{ objectPosition: cpScreenshotPos }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f2e28 0%, #0d1a17 100%)' }}>
                                                                    <div className="text-[#448a7d]/20 scale-[4]">{ICONS.Heart}</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Info panel — flex-shrink-0, always below screenshot */}
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                            className="flex-shrink-0 flex items-center gap-4 px-5 md:px-7 py-3.5 md:py-4 border-t border-white/[0.07]"
                                                            style={{ background: '#040b09' }}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[9px] text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#448a7d]">
                                                                        {config.label}
                                                                    </span>
                                                                    {recommender && (
                                                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-wide truncate">by {recommender}</span>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-white font-black text-base md:text-lg leading-tight tracking-tight truncate">
                                                                    {resource.title}
                                                                </h3>
                                                                <p className="text-white/35 font-medium text-[11px] leading-relaxed line-clamp-1 mt-0.5">
                                                                    {cleanDescription}
                                                                </p>
                                                            </div>
                                                            <a
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex-shrink-0 inline-flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.18em] px-5 md:px-6 py-2.5 rounded-full transition-all active:scale-95 group/btn"
                                                                style={{
                                                                    background: '#448a7d',
                                                                    border: '1px solid rgba(90,158,145,0.5)',
                                                                    boxShadow: '0 6px 20px -6px rgba(68,138,125,0.55)',
                                                                }}
                                                            >
                                                                Explore
                                                                <svg className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                </svg>
                                                            </a>
                                                        </motion.div>
                                                    </>
                                                ) : (
                                                    /* Inactive — dark glass card with teal accent + vertical title */
                                                    <>
                                                        <div className="w-full h-[3px] flex-shrink-0 bg-gradient-to-r from-[#448a7d]/60 via-[#448a7d]/15 to-transparent" />
                                                        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                                                            <div className="-rotate-90 whitespace-nowrap text-white/30 font-black uppercase tracking-[0.35em] text-[9px]">
                                                                {resource.title}
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 pb-4 flex justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#448a7d]/40" />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                        })}
                                    </div>{/* closes accordion flex */}
                                    </div>{/* closes right column */}
                                </div>{/* closes main row */}
                                </div>{/* closes content wrapper */}
                            </div>}{/* closes flashlight panel */}
                        </section>
                        )}

                        {/* COMMUNITY RESOURCES SECTION (BUCKETS) */}
                        <section className="relative w-full pb-16">

                            {/* ── Contextual sync bar — visible even when user scrolls past the page-level bar ── */}
                            <AnimatePresence>
                                {syncing && (
                                    <motion.div
                                        className="absolute top-0 left-0 right-0 h-[2.5px] overflow-hidden rounded-full pointer-events-none"
                                        style={{ background: 'rgba(68,138,125,0.12)' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.div
                                            className="absolute inset-y-0 rounded-full"
                                            style={{ width: '38%', background: 'linear-gradient(90deg, #448a7d 0%, #7ec5b8 50%, #e57c6e 100%)' }}
                                            animate={{ x: ['-42%', '290%'] }}
                                            transition={{ duration: 1.55, repeat: Infinity, ease: [0.4, 0, 0.6, 1], repeatDelay: 0.08 }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-8 pt-3">
                                {/* Icon — pulse ring on sync */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-md">
                                        {ICONS.Users}
                                    </div>
                                    <AnimatePresence>
                                        {syncing && (
                                            <motion.span
                                                className="absolute inset-0 rounded-[1rem] md:rounded-[1.5rem] border-2 border-[#448a7d]"
                                                initial={{ opacity: 0.7, scale: 1 }}
                                                animate={{ opacity: 0, scale: 1.28 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-4xl font-black text-[#1e3a34] italic tracking-tight leading-tight">Community Suggested Resources</h2>
                                    <AnimatePresence mode="wait">
                                        {syncing ? (
                                            <motion.div
                                                key="syncing-label"
                                                className="flex items-center gap-1.5 mt-1"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <span className="w-3 h-3 rounded-full border-[1.5px] border-[#448a7d]/30 border-t-[#448a7d] animate-spin flex-shrink-0" aria-hidden="true" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#448a7d]">Syncing live data…</span>
                                            </motion.div>
                                        ) : (
                                            <motion.p
                                                key="normal-label"
                                                className="text-gray-500 font-medium text-xs md:text-lg mt-0.5 md:mt-1"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                Peer-recommended by the community.
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>



                            {/* APP STORE EXPANDABLE CARDS For Mid-Screens (Tablet / 13inch) - 768px to 1245px */}
                            {!isMobileViewport && <div className="hidden md:block xl:hidden mt-8 mb-16 px-2">
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
                                                    {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8 text-white" })}
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


                            </div>}
                            {/* MOBILE: Horizontal Pill Rail + Content Panel */}
                            {isMobileViewport && <div className="md:hidden mt-6">

                                <div className="mb-2 flex items-center justify-between px-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1e3a34]/55">Browse by type</p>
                                    <p className="text-[10px] font-bold text-[#448a7d]">Swipe →</p>
                                </div>

                                {/* One-thumb category rail keeps the directory compact and preserves a visible next-card cue. */}
                                <div className="no-scrollbar -mx-4 mb-4 flex max-w-[calc(100%+2rem)] snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2" role="group" aria-label="Resource categories">
                                    {COMMUNITY_BUCKETS.map((bucket) => {
                                        const count = communityBucketResources[bucket.id].length;
                                        const isActive = activeCommunityIndex === bucket.id;
                                        return (
                                            <motion.button
                                                key={bucket.id}
                                                onClick={() => setActiveCommunityIndex(isActive ? null : bucket.id)}
                                                aria-pressed={isActive}
                                                animate={{ scale: isActive ? 1.04 : 1 }}
                                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                                className={`relative flex min-h-14 min-w-[8.25rem] snap-start items-center justify-start gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors duration-200 ${
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
                                                <div className={`${isActive ? 'text-white scale-105' : bucket.color} transition-transform duration-200`}>
                                                    {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                                                </div>
                                                <span className={`pr-2 text-[10px] font-black leading-tight ${isActive ? 'text-white' : 'text-gray-600'}`}>
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
                                                            {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5 text-white' })}
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
                                                            {React.cloneElement(activeBucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-white' })}
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
                                                        className="min-h-11 min-w-11 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 active:scale-95 transition-colors shadow-sm"
                                                        aria-label="Close category"
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
                                                            to={activeCommunityIndex === MAP_BASED_BUCKET_ID
                                                                ? '/add-resource?mode=recommend&mapBased=1'
                                                                : activeCommunityIndex === OTHER_BUCKET_ID
                                                                    ? '/add-resource?mode=recommend'
                                                                : `/add-resource?mode=recommend&type=${activeCommunityIndex}`}
                                                            className="inline-flex min-h-11 items-center px-6 py-2.5 rounded-full bg-[#e8f3f1] text-[#448a7d] font-black uppercase tracking-widest text-[10px] hover:bg-[#d5e8e4] transition-colors"
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
                                                                <ResourceCard resource={res} reflections={reflections} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </div>}

                            {/* DESKTOP XL: restored side-by-side rail design */}
                            {!isMobileViewport && <div className="hidden xl:flex gap-10 mt-10 items-start min-h-[760px]">
                                <div className="w-[230px] flex-shrink-0">
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
                                                        className={`relative w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 text-left group ${isActive ? 'bg-[#e8f3f1]/70' : 'hover:bg-gray-50'}`}
                                                    >
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="railIndicator"
                                                                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#448a7d] rounded-r-full"
                                                            />
                                                        )}
                                                        <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${isActive ? `bg-white shadow-sm border border-gray-100 ${bucket.color}` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                            <motion.div
                                                                animate={{ y: [0, -7, 0], scale: [1, 1.16, 1] }}
                                                                transition={{
                                                                    duration: 1.8,
                                                                    repeat: Infinity,
                                                                    ease: [0.45, 0, 0.55, 1],
                                                                    delay: COMMUNITY_BUCKETS.indexOf(bucket) * 0.18,
                                                                    repeatDelay: 0.6,
                                                                }}
                                                            >
                                                                {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
                                                            </motion.div>
                                                        </div>
                                                        <span className={`text-sm font-black flex-grow leading-tight ${isActive ? 'text-[#1e3a34]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                                            {bucket.label}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center ${isActive ? 'bg-[#448a7d] text-white' : count > 0 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-300'}`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <Link
                                        to="/add-resource?mode=recommend"
                                        className="mt-4 px-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#448a7d]/60 hover:text-[#448a7d] transition-colors group"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-[#448a7d]/10 group-hover:bg-[#448a7d]/20 flex items-center justify-center">{ICONS.Plus}</span>
                                        Suggest a resource
                                    </Link>
                                </div>

                                <div className="flex-grow min-w-0">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {!activeBucket ? (
                                            <motion.div
                                                key="xl-empty"
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -12 }}
                                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                                className="relative min-h-[540px] flex items-center justify-center px-8 text-center"
                                            >
                                                <motion.div
                                                    aria-hidden="true"
                                                    className="absolute left-[10%] right-[10%] top-1/2 h-32 -translate-y-1/2 rounded-[100%] bg-[#448a7d]/5 blur-3xl"
                                                    animate={{ scaleX: [0.85, 1.08, 0.85], opacity: [0.35, 0.7, 0.35] }}
                                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                                />

                                                <div className="relative flex max-w-3xl flex-col items-center">
                                                    <div className="relative mb-14 flex items-center justify-center px-8" aria-hidden="true">
                                                        <motion.div
                                                            className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#448a7d]/25 to-transparent"
                                                            animate={{ scaleX: [0.72, 1, 0.72], opacity: [0.25, 0.75, 0.25] }}
                                                            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                                                        />

                                                        <div className="relative flex items-center gap-3">
                                                            {COMMUNITY_BUCKETS.slice(0, 9).map((bucket, i) => (
                                                                <motion.div
                                                                    key={bucket.id}
                                                                    className="relative"
                                                                    animate={{
                                                                        y: [0, -16, -4, 9, 0],
                                                                    }}
                                                                    transition={{
                                                                        duration: 3.6,
                                                                        repeat: Infinity,
                                                                        delay: i * 0.12,
                                                                        ease: [0.45, 0, 0.55, 1],
                                                                    }}
                                                                >
                                                                    <motion.div
                                                                        className={`relative z-10 h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-[0_14px_24px_-14px_rgba(30,58,52,0.65)] ${bucket.bg}`}
                                                                        animate={{
                                                                            scale: [1, 1.08, 1, 0.97, 1],
                                                                            rotate: [0, -2, 0, 2, 0],
                                                                        }}
                                                                        transition={{
                                                                            duration: 3.6,
                                                                            repeat: Infinity,
                                                                            delay: i * 0.12,
                                                                            ease: [0.45, 0, 0.55, 1],
                                                                        }}
                                                                    >
                                                                        {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-white' })}
                                                                    </motion.div>
                                                                    <motion.div
                                                                        className="absolute left-1/2 top-full mt-3 h-1.5 w-7 -translate-x-1/2 rounded-full bg-[#1e3a34]/10 blur-[2px]"
                                                                        animate={{ scaleX: [1, 0.55, 0.8, 1.15, 1], opacity: [0.32, 0.12, 0.2, 0.38, 0.32] }}
                                                                        transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.12 }}
                                                                    />
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <motion.p
                                                        className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#448a7d]"
                                                        animate={{ opacity: [0.55, 1, 0.55] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                                    >
                                                        Shared by the community
                                                    </motion.p>
                                                    <h3 className="text-4xl font-black text-[#1e3a34] italic tracking-tight">
                                                        Explore community resources.
                                                    </h3>
                                                    <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-[#1e3a34]/55">
                                                        Books, tools, media, and local support—organized so you can find what feels useful right now.
                                                    </p>
                                                    <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#448a7d]">
                                                        <motion.span
                                                            className="h-px w-8 bg-[#448a7d]/30"
                                                            animate={{ scaleX: [0.5, 1, 0.5] }}
                                                            transition={{ duration: 2.4, repeat: Infinity }}
                                                        >
                                                        </motion.span>
                                                        Choose a category on the left
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={activeBucket.id}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -18 }}
                                                transition={{ duration: 0.32 }}
                                            >
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg ${activeBucket.bg}`}>
                                                            {React.cloneElement(activeBucket.icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7 text-white' })}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">{activeBucket.label}</h3>
                                                            <p className="text-sm text-gray-500 font-medium">
                                                                {activeResources.length} peer-recommended resource{activeResources.length !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveCommunityIndex(null)}
                                                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                                    >
                                                        {ICONS.X}
                                                    </button>
                                                </div>

                                                {activeResources.length === 0 ? (
                                                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                                                        <p className="text-gray-400 font-bold text-xl mb-4">No {activeBucket.label.toLowerCase()} yet.</p>
                                                        <Link
                                                            to={activeCommunityIndex === MAP_BASED_BUCKET_ID
                                                                ? '/add-resource?mode=recommend&mapBased=1'
                                                                : activeCommunityIndex === OTHER_BUCKET_ID
                                                                    ? '/add-resource?mode=recommend'
                                                                    : `/add-resource?mode=recommend&type=${activeCommunityIndex}`}
                                                            className="inline-flex px-8 py-3.5 rounded-full bg-[#e8f3f1] text-[#448a7d] font-black tracking-widest uppercase text-xs"
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
                                                                transition={{ delay: i * 0.07, duration: 0.38 }}
                                                            >
                                                                <ResourceCard resource={res} reflections={reflections} />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>}
                        </section>

                        {/* PARTNERS SECTION */}
                        {alignedPartners.length > 0 && (
                            <section className="[content-visibility:auto] [contain-intrinsic-size:1px_900px]">
                                <div className="mb-8 md:mb-16 lg:mb-20">
                                    {/* Accent bar */}
                                    <div className="h-1.5 md:h-2 w-20 md:w-32 bg-gradient-to-r from-[#e57c6e] to-[#d46a5c] rounded-full mb-6 md:mb-8" />
                                    
                                    <div className="space-y-3 md:space-y-6">
                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1e3a34] italic tracking-tight leading-tight max-w-4xl break-words [overflow-wrap:anywhere]">
                                            Starlings-Aligned Partners
                                        </h2>
                                        
                                        <div className="space-y-3 md:space-y-4 max-w-3xl">
                                            <p className="text-base md:text-xl text-gray-700 font-semibold leading-relaxed">
                                                Organizations reviewed by Starlings that offer <span className="text-[#e57c6e] font-black">resources and support</span> for youth and adults affected by parental substance use.
                                            </p>
                                            <p className="text-sm md:text-lg text-gray-600 font-medium leading-relaxed">
                                                They are independent and not affiliated with or trained by Starlings. <span className="font-black">Inclusion does not imply endorsement</span> — we encourage you to explore what feels right for you.
                                            </p>
                                            <div className="flex items-center gap-2 pt-2">
                                                <span className="inline-block text-xs md:text-sm font-black uppercase tracking-widest px-4 md:px-5 py-2 md:py-2.5 bg-[#e57c6e] text-white rounded-full shadow-md">◆ Reviewed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                                    {alignedPartners.map((resource) => {
                                        const config = typeConfig[resource.type] || typeConfig.website;
                                        return (
                                            <a
                                                key={resource.id}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative bg-white rounded-2xl shadow-sm md:rounded-[3rem] md:shadow-[0_20px_50px_-15px_rgba(229,124,110,0.15)] md:hover:shadow-[0_30px_60px_-15px_rgba(229,124,110,0.25)] md:hover:-translate-y-2 transition-all duration-300 md:duration-500 border border-[#e57c6e]/15 md:border-2 md:border-[#e57c6e]/10 group flex flex-col sm:flex-row h-full overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_430px]"
                                            >
                                                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex gap-2">
                                                    <div className="bg-white/90 text-[#e57c6e] shadow-sm text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-1.5 rounded-full">
                                                        {ICONS.ShieldCheck} Verified
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-2/5 sm:min-w-[240px] aspect-[16/9] sm:aspect-auto sm:h-auto bg-[#f0f7f5] flex-shrink-0 relative overflow-hidden">
                                                    {resource.imageUrl ? (
                                                        <img src={resource.imageUrl} alt={resource.title} loading="lazy" decoding="async" className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-out" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-[#e57c6e]/20">
                                                            <div className="scale-150">{ICONS.Heart}</div>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:to-black/5"></div>
                                                </div>

                                                <div className="p-5 md:p-8 sm:p-10 flex flex-col flex-grow justify-center relative z-10 bg-white sm:-ml-6 sm:rounded-l-[3rem] sm:shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
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
                                                    <h3 className="text-[#1e3a34] font-black text-2xl md:text-3xl tracking-tight mb-3 md:mb-4 group-hover:text-[#e57c6e] transition-colors leading-tight break-words [overflow-wrap:anywhere]">
                                                        {resource.title}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm leading-relaxed flex-grow font-medium">
                                                        {resource.description}
                                                    </p>
                                                    <div className="mt-5 md:mt-8 flex min-h-11 items-center gap-2 text-[#e57c6e] font-bold text-xs md:text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
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
                            const bucketResources = communityBucketResources[bucket.id] || [];

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
                                                {React.cloneElement(bucket.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6 md:w-8 md:h-8 text-white" })}
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
                                                <Link
                                                    to={bucket.id === MAP_BASED_BUCKET_ID
                                                        ? '/add-resource?mode=recommend&mapBased=1'
                                                        : bucket.id === OTHER_BUCKET_ID
                                                            ? '/add-resource?mode=recommend'
                                                        : `/add-resource?mode=recommend&type=${bucket.id}`}
                                                    onClick={() => setExpandedCategory(null)}
                                                    className="inline-flex px-10 py-4 mt-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black tracking-widest uppercase hover:bg-indigo-100 hover:shadow-md transition-all active:scale-95"
                                                >
                                                    Be the first to share
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
                                                {bucketResources.map(res => <ResourceCard key={res.id} resource={res} reflections={reflections} />)}
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
