import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.ts';
import { Resource } from '../types.ts';
import { ICONS } from '../constants.tsx';

const ResourcesView: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await apiService.getApprovedResources();
                setResources(data);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            } finally {
                setLoading(false);
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
                        A carefully curated, community-driven collection of tools, publications, videos, and professional platforms for youth impacted by parental substance use. Discover resources or add your own light to help others on their journey.
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
                            {ICONS.Users} Apply to Post
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
                                <h2 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">General Resources</h2>
                                <p className="text-gray-500 font-medium">National platforms, helplines, and core organizations supporting youth.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {resources.filter(r => r.category === 'general').map((resource) => {
                                const config = typeConfig[resource.type] || typeConfig.website;
                                return (
                                    <a
                                        key={resource.id}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(68,138,125,0.15)] hover:-translate-y-1.5 transition-all duration-500 border border-gray-100 group flex flex-col h-full overflow-hidden"
                                    >
                                        <div className="w-full h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
                                            {resource.imageUrl ? (
                                                <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#e8f3f1] to-[#cde4df] flex items-center justify-center text-[#448a7d]/20">
                                                    <div className="scale-150">{ICONS.Heart}</div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                                                <span className={`text-[10px] text-white shadow-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#448a7d] transition-colors">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-[#1e3a34] font-black text-2xl tracking-tight mb-3 group-hover:text-[#448a7d] transition-colors leading-tight">
                                                {resource.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm leading-relaxed flex-grow font-medium">
                                                {resource.description}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </section>

                    {/* COMMUNITY RESOURCES SECTION */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                                <div className="scale-125">{ICONS.Users}</div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">Community Resources</h2>
                                <p className="text-gray-500 font-medium">User-recommended videos, tools, and local support networks.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {resources.filter(r => r.category === 'community').map((resource) => {
                                const config = typeConfig[resource.type] || typeConfig.website;
                                return (
                                    <a
                                        key={resource.id}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] hover:-translate-y-1.5 transition-all duration-500 border border-gray-100 group flex flex-col h-full overflow-hidden"
                                    >
                                        <div className="w-full h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
                                            {resource.imageUrl ? (
                                                <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-500/20">
                                                    <div className="scale-150">{ICONS.Heart}</div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                                                <span className={`text-[10px] text-white shadow-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-[#1e3a34] font-black text-2xl tracking-tight mb-3 group-hover:text-indigo-500 transition-colors leading-tight">
                                                {resource.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm leading-relaxed flex-grow font-medium">
                                                {resource.description}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
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
                                    <h2 className="text-3xl font-black text-[#1e3a34] italic tracking-tight">Partner Resources</h2>
                                    <p className="text-gray-500 font-medium">Verified professional clinics providing specialized care, categorized by location.</p>
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
