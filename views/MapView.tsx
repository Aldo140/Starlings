import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportMap from '../components/Map.tsx';
import PostCard from '../components/PostCard.tsx';
import { apiService, calculateDistance } from '../services/api.ts';
import { Post } from '../types.ts';
import { ICONS, MOCK_POSTS } from '../constants.tsx';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';

interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  posts: Post[];
  topTags: string[];
}

const MapView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'stories' | 'resources'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      // Show mock data instantly - ZERO loading wait on first visit
      setPosts(MOCK_POSTS.map(p => ({ ...p, alias: p.alias || apiService.generateAlias() })));
      setLoading(false);

      // Fetch real data in background
      setRefreshing(true);
      try {
        const realData = await apiService.getApprovedPosts();
        setPosts(realData);
      } catch (error) {
        console.error('Fetch failed:', error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchPosts();
  }, []);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const freshData = await apiService.getApprovedPosts();
      setPosts(freshData);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const groupedPosts = useMemo<CityGroup[]>(() => {
    const groups = new globalThis.Map<string, CityGroup>();
    posts.forEach((post) => {
      const key = `${post.city}||${post.country}`;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          id: key,
          city: post.city,
          country: post.country,
          lat: post.lat,
          lng: post.lng,
          count: 1,
          posts: [post],
          topTags: []
        });
      } else {
        existing.count += 1;
        existing.posts.push(post);
        existing.lat = (existing.lat * (existing.count - 1) + post.lat) / existing.count;
        existing.lng = (existing.lng * (existing.count - 1) + post.lng) / existing.count;
      }
    });

    groups.forEach((group) => {
      const tagCounts = new globalThis.Map<string, number>();
      group.posts.forEach((post) => {
        const tags = Array.isArray(post.what_helped) ? post.what_helped : [];
        tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      group.topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
    });

    return Array.from(groups.values());
  }, [posts]);

  const filteredGroups = useMemo(() => {
    let result = groupedPosts.map(group => {
      // Filter the posts inside the group directly based on filterMode
      let filteredPosts = group.posts;
      if (filterMode === 'stories') {
        filteredPosts = group.posts.filter((p: any) => p.message && !p.message.startsWith('[RESOURCE'));
      } else if (filterMode === 'resources') {
        filteredPosts = group.posts.filter((p: any) => p.message && p.message.startsWith('[RESOURCE'));
      }

      return {
        ...group,
        posts: filteredPosts,
        count: filteredPosts.length
      };
    }).filter(group => {
      const matchesSearch = group.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.posts.some(post =>
          (post.message && post.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (Array.isArray(post.what_helped) && post.what_helped.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );

      return matchesSearch && group.count > 0;
    });

    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      result = [...result].sort((a, b) => b.count - a.count);
    }

    return result;
  }, [groupedPosts, searchTerm, userLocation, filterMode]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groupedPosts.find(group => group.id === selectedGroupId) || null;
  }, [groupedPosts, selectedGroupId]);

  const mapFocus = selectedGroup
    ? { lat: selectedGroup.lat, lng: selectedGroup.lng }
    : userLocation || undefined;

  const [isListVisible, setIsListVisible] = useState(false);

  return (
    <div className="flex-grow h-full flex flex-col md:flex-row overflow-hidden relative bg-[#f0f4f3] w-full">

      {/* FLOATING TOP BAR (Mobile Only) */}
      <div className="md:hidden absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">

        {/* Floating Search */}
        <div className="relative flex-grow shadow-lg rounded-xl pointer-events-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {ICONS.Search}
          </div>
          <input
            type="text"
            placeholder="Search city or tag..."
            className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-[#448a7d] transition-all text-sm border-0 font-medium text-[#1e3a34] placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-40 border border-gray-100 flex flex-col pointer-events-auto">
              {filteredGroups.length > 0 ? (
                <div className="overflow-y-auto max-h-48 divide-y divide-gray-50 flex flex-col">
                  {filteredGroups.slice(0, 5).map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setSearchTerm(''); // clear after selecting
                      }}
                      className="flex items-center justify-between p-3 hover:bg-teal-50 text-left active:bg-teal-100 transition-colors w-full"
                    >
                      <span className="font-bold text-sm text-[#1e3a34]">{group.city}</span>
                      <span className="text-[10px] text-white font-black uppercase tracking-widest bg-[#448a7d] px-2 py-0.5 rounded-full">
                        {group.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 flex flex-col items-center justify-center text-center opacity-70 bg-gray-50/50">
                  <div className="text-gray-400 mb-2">{ICONS.Search}</div>
                  <p className="font-bold text-[#1e3a34] text-xs">No cities found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Near Me Right */}
        <button
          onClick={handleNearMe}
          disabled={isLocating}
          className={`shrink-0 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center pointer-events-auto transition-colors active:scale-95 ${userLocation ? 'bg-[#448a7d] text-white' : 'bg-white/95 backdrop-blur-md text-[#1e3a34]'}`}
        >
          {isLocating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : ICONS.Navigation}
        </button>
      </div>

      {/* DESKTOP SPLIT DASHBOARD */}
      <aside className={`hidden md:flex flex-row bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_30px_60px_-15px_rgba(30,58,52,0.15)] z-20 overflow-hidden absolute top-6 left-6 bottom-6 rounded-[2.5rem] transition-all duration-300 ${selectedGroup ? 'w-[760px] lg:w-[840px] xl:w-[960px]' : 'w-[380px] lg:w-[420px] xl:w-[460px]'}`}>

        {/* Ambient Glowing Blobs Behind Sidebar */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#448a7d]/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e57c6e]/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />

        {/* LEFT PANEL - CITIES LIST & DASHBOARD */}
        <div className="w-[380px] lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col border-r border-[#448a7d]/10 bg-white/40 relative z-20">

          {/* Top Dashboard Actions & Stats */}
          <div className="p-6 pb-5 border-b border-gray-100 flex flex-col gap-5 bg-white/60">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1e3a34] tracking-tight italic leading-none mb-2">Support Map.</h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#448a7d] uppercase tracking-widest bg-[#e8f3f1] px-3 py-1.5 rounded-full inline-flex">
                  <span>{groupedPosts.length} Cities</span>
                  <span className="text-[#1e3a34]/20">•</span>
                  <span>{posts.length} Stories & Resources</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => navigate('/share')} className="h-10 w-10 rounded-xl bg-[#1e3a34] text-white flex items-center justify-center hover:bg-[#2d5a52] transition-colors shadow-sm active:scale-95" title="Share your light">
                  {ICONS.Plus}
                </button>
                <button onClick={handleRefresh} disabled={refreshing} className="h-10 w-10 rounded-xl bg-gray-100 text-[#1e3a34] flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm active:scale-95 disabled:opacity-50" title="Refresh">
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={handleNearMe} disabled={isLocating} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm active:scale-95 ${userLocation ? 'bg-[#448a7d] text-white' : 'bg-[#e8f3f1] text-[#448a7d] hover:bg-[#cde4df]'}`} title="My Location">
                  {isLocating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : ICONS.Navigation}
                </button>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</div>
              <input
                type="text"
                placeholder="Search cities or tags..."
                className="w-full bg-white border border-gray-200/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#448a7d] focus:border-transparent focus:outline-none transition-all placeholder:text-gray-400 text-[#1e3a34] font-medium shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Framer Motion Segmented Filter */}
            <div className="relative flex p-1.5 bg-gray-100/80 rounded-2xl">
              {['all', 'stories', 'resources'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterMode(tab as any)}
                  className={`flex-1 relative py-2.5 text-[11px] font-black uppercase tracking-widest z-10 transition-colors ${filterMode === tab ? 'text-[#1e3a34]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {filterMode === tab && (
                    <motion.div
                      layoutId="filter-pill-desktop"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List of Cities */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#1e3a34]/30 font-bold text-[10px] uppercase tracking-widest">Loading...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-56 px-6 opacity-60">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">{ICONS.Search}</div>
                <p className="font-black text-[#1e3a34] text-lg mb-2">No Cities Found</p>
                <p className="text-sm text-gray-500 font-medium">We couldn't find any items matching "{searchTerm}". Try adjusting your search.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredGroups.map(group => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`p-5 rounded-2xl transition-all duration-300 cursor-pointer border-2 group relative overflow-hidden ${selectedGroupId === group.id
                      ? 'border-[#448a7d] bg-[#448a7d] text-white shadow-md'
                      : 'border-transparent bg-white shadow-sm hover:border-[#448a7d]/20 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedGroupId === group.id ? 'bg-white/20 text-white' : 'bg-[#e8f3f1] text-[#448a7d]'}`}>
                          {ICONS.MapPin}
                        </div>
                        <div>
                          <span className={`font-black text-base block tracking-tight ${selectedGroupId === group.id ? 'text-white' : 'text-[#1e3a34]'}`}>{group.city}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedGroupId === group.id ? 'text-white/70' : 'text-gray-400'}`}>{group.country}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${selectedGroupId === group.id ? 'bg-white text-[#448a7d]' : 'bg-[#1e3a34] text-white'}`}>
                        {group.count}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.topTags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedGroupId === group.id ? 'border-white/30 bg-white/10 text-white' : 'border-[#448a7d]/10 bg-[#f9fbfa] text-[#448a7d]'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - SELECTED NOTE DETAIL */}
        {selectedGroup && (
          <div className="flex-1 flex flex-col bg-[#f9fbfa] relative z-10 min-w-[380px]">
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className="flex-shrink-0 bg-white px-8 py-6 border-b border-gray-100 shadow-sm z-10 sticky top-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e8f3f1] text-[#448a7d] rounded-2xl flex flex-shrink-0 items-center justify-center">
                      {ICONS.MapPin}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-[#1e3a34] tracking-tight">{selectedGroup.city}</h3>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{selectedGroup.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white font-black uppercase tracking-widest bg-[#448a7d] px-4 py-2 rounded-full shadow-md">
                      {selectedGroup.count} Items
                    </span>
                    <button onClick={() => setSelectedGroupId(null)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" title="Close">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-8 space-y-5 no-scrollbar bg-gray-50/30">
                <AnimatePresence mode="popLayout">
                  {selectedGroup.posts.map((post, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={`${post.id}`}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* VAUL MOBILE BOTTOM SHEET */}
      <div className="md:hidden">
        <Drawer.Root
          open={isListVisible}
          onOpenChange={setIsListVisible}
          shouldScaleBackground
          snapPoints={[0.5, 1]}
          fadeFromIndex={0}
        >
          {/* FAB button triggers the Drawer when closed */}
          {!isListVisible && (
            <Drawer.Trigger asChild>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000]">
                <button className="bg-[#1e3a34] text-white px-8 py-4 rounded-full shadow-2xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all outline-none">
                  {ICONS.Menu} Browse List
                </button>
              </div>
            </Drawer.Trigger>
          )}

          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/20 z-[3000]" />
            <Drawer.Content className="bg-[#f0f4f3] flex flex-col rounded-t-[32px] mt-24 h-[96%] fixed bottom-0 left-0 right-0 z-[3100] outline-none shadow-2xl">

              <div className="p-4 bg-[#f0f4f3] rounded-t-[32px] w-full flex-shrink-0 sticky top-0 z-10 border-b border-gray-200/50">
                {/* Pull Handle */}
                <div className="mx-auto w-12 h-1.5 bg-gray-300 rounded-full mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-xl text-[#1e3a34]">Explore</h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{posts.length} Total</span>
                </div>

                {/* Mobile Segmented Filter */}
                <div className="relative flex p-1 bg-gray-100 rounded-2xl mb-2">
                  {['all', 'stories', 'resources'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterMode(tab as any)}
                      className={`flex-1 relative py-2.5 text-[11px] font-black uppercase tracking-widest z-10 transition-colors ${filterMode === tab ? 'text-[#1e3a34]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {filterMode === tab && (
                        <motion.div
                          layoutId="filter-pill-mobile"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="px-4 py-4 overflow-y-auto flex-grow no-scrollbar space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[#1e3a34]/30 font-bold text-[10px] uppercase tracking-widest">Loading...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
                    <div className="w-16 h-16 bg-white shadow-sm text-gray-400 rounded-full flex items-center justify-center mb-4">{ICONS.Search}</div>
                    <p className="font-black text-[#1e3a34] text-lg mb-1">No Cities Found</p>
                    <p className="text-xs text-gray-500 font-medium">We couldn't find any items matching "{searchTerm}".</p>
                  </div>
                ) : filteredGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setIsListVisible(false); // Close list to show overlay
                    }}
                    className="p-5 rounded-3xl bg-white shadow-sm border border-gray-50 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 text-[#1e3a34]">
                        <div className="w-10 h-10 rounded-2xl bg-[#e8f3f1] text-[#448a7d] flex items-center justify-center">
                          {ICONS.MapPin}
                        </div>
                        <div>
                          <span className="font-black text-base block tracking-tight">{group.city}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.country}</span>
                        </div>
                      </div>
                      <span className="text-[12px] text-white font-black uppercase tracking-widest bg-[#1e3a34] px-4 py-1.5 rounded-full">
                        {group.count}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {group.topTags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="px-3 py-1.5 rounded-full bg-[#f9fbfa] text-[#448a7d] text-[10px] font-black uppercase tracking-widest border border-gray-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* MAP FULL SCREEN */}
      <div className="flex-grow relative z-10 w-full h-full overflow-hidden bg-[#e8f3f1]">
        <SupportMap
          groups={filteredGroups}
          onMarkerClick={(group) => setSelectedGroupId(group.id)}
          selectedGroupId={selectedGroupId || undefined}
          flyToLocation={mapFocus}
        />

        <div className="absolute bottom-8 right-6 z-30 md:hidden">
          <button onClick={() => navigate('/share')} className="w-14 h-14 bg-[#448a7d] text-white rounded-full shadow-[0_8px_30px_rgba(68,138,125,0.4)] flex items-center justify-center flex-shrink-0 active:scale-90 transition-all border-2 border-white">
            {ICONS.Plus}
          </button>
        </div>
      </div>

      {/* MOBILE FULL PAGE CITY OVERLAY */}
      {selectedGroup && (
        <div className="md:hidden absolute inset-0 z-[4000] bg-[#f0f4f3] flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Glass Header */}
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 pt-safe relative z-20 shadow-sm">
            <div className="p-4 flex flex-col gap-4">
              <button
                onClick={() => setSelectedGroupId(null)}
                className="self-start inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[#448a7d] font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors border border-gray-200/50 active:scale-95"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e8f3f1] flex flex-shrink-0 items-center justify-center text-[#448a7d]">
                  {ICONS.MapPin}
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                  <h4 className="font-black text-2xl text-[#1e3a34] leading-tight truncate">{selectedGroup.city}</h4>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{selectedGroup.country}</span>
                </div>
                <span className="flex-shrink-0 text-[11px] text-white font-black uppercase tracking-widest bg-[#1e3a34] px-3 py-1.5 rounded-full shadow-sm">
                  {selectedGroup.count} Items
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-grow overflow-y-auto px-4 pt-6 pb-28 space-y-4 relative z-10 no-scrollbar">
            <AnimatePresence mode="popLayout">
              {selectedGroup.posts.map((post, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  key={`${post.id}`}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Floating Add Note Action */}
          <div className="absolute bottom-6 left-4 right-4 z-30 flex justify-center pointer-events-none pb-safe">
            <button
              onClick={() => navigate('/share')}
              className="w-full max-w-sm bg-[#1e3a34] pointer-events-auto text-white py-4 rounded-[1.5rem] shadow-[0_12px_24px_-8px_rgba(30,58,52,0.6)] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all outline-none border border-white/10"
            >
              {ICONS.Plus} Share to {selectedGroup.city}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapView;
