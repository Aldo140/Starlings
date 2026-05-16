import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportMap from '../components/Map.tsx';
import PostCard from '../components/PostCard.tsx';
import ResourceMapCard from '../components/ResourceMapCard.tsx';
import { apiService, calculateDistance, CANADIAN_HUBS } from '../services/api.ts';
import { Post, MapItem, Resource } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingBar from '../components/LoadingBar.tsx';

/** Shimmer skeleton cards shown during initial data fetch */
const CitySkeleton: React.FC = () => (
  <>
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="p-5 rounded-2xl bg-white border border-gray-100 animate-pulse"
        style={{ animationDelay: `${i * 120}ms` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3f1]" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-[#e8f3f1] rounded-lg" />
              <div className="h-2.5 w-16 bg-[#e8f3f1]/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-10 rounded-full bg-[#e8f3f1]" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-[#e8f3f1]/70" />
          <div className="h-5 w-12 rounded-full bg-[#e8f3f1]/50" />
          <div className="h-5 w-20 rounded-full bg-[#e8f3f1]/60" />
        </div>
      </div>
    ))}
  </>
);

interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  items: MapItem[];
  topTags: string[];
}

const getCityCoordinates = (city: string, fallbackLat: number, fallbackLng: number) => {
  const normalizedCity = city.trim().toLowerCase();
  const hub = CANADIAN_HUBS.find((place) => place.name.toLowerCase() === normalizedCity);

  return hub
    ? { lat: hub.lat, lng: hub.lng }
    : { lat: fallbackLat, lng: fallbackLng };
};

const getItemPreview = (item: MapItem) => {
  if (item.kind === 'resource') {
    return {
      type: item.data.type,
      title: item.data.title,
      body: item.data.description || 'Community resource',
    };
  }
  const cleanBody = (v: string) => v.replace(/^[\s,"']+/, '').trim();
  return {
    type: 'Story',
    title: item.data.alias || 'Anonymous',
    body: cleanBody(item.data.message),
  };
};

const MapView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mappableResources, setMappableResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'stories' | 'resources'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDesktopPreviewVisible, setIsDesktopPreviewVisible] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  const selectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedPostId(null);
    setIsDesktopPreviewVisible(false);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setPosts([]);
      setLoading(false);

      // Fetch real data in background
      setRefreshing(true);
      try {
        const [realPosts, realResources] = await Promise.all([
          apiService.getApprovedPosts(),
          apiService.getApprovedResources(),
        ]);
        setPosts(realPosts);
        const withCoords = realResources.filter(r => r.lat && r.lng);
        setMappableResources(withCoords);
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
      const freshData = await apiService.getApprovedPosts(true);
      setPosts(freshData);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const groupedItems = useMemo<CityGroup[]>(() => {
    const map = new globalThis.Map<string, CityGroup>();

    // First pass: posts
    posts.forEach(post => {
      const key = post.city || post.country || 'Unknown';
      if (!map.has(key)) {
        const coords = getCityCoordinates(post.city, post.lat, post.lng);
        map.set(key, {
          id: key,
          city: post.city || '',
          country: post.country || '',
          lat: coords.lat,
          lng: coords.lng,
          count: 0,
          items: [],
          topTags: [],
        });
      }
      const group = map.get(key)!;
      group.items.push({ kind: 'post', data: post });
      group.count = group.items.length;
    });

    // Second pass: resources (already filtered to those with lat/lng)
    mappableResources.forEach(resource => {
      const key = resource.city || resource.country || 'Unknown';
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          city: resource.city || '',
          country: resource.country || '',
          lat: resource.lat!,
          lng: resource.lng!,
          count: 0,
          items: [],
          topTags: [],
        });
      }
      const group = map.get(key)!;
      group.items.push({ kind: 'resource', data: resource });
      group.count = group.items.length;
    });

    // Compute topTags from post items only
    const result = Array.from(map.values());
    result.forEach(group => {
      const tagCounts: Record<string, number> = {};
      group.items.forEach(item => {
        if (item.kind === 'post') {
          item.data.what_helped.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      group.topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
    });

    return result;
  }, [posts, mappableResources]);

  const filteredGroups = useMemo(() => {
    let result = groupedItems.map((group: CityGroup): CityGroup => {
      let filteredItems: MapItem[] = group.items;
      if (filterMode === 'stories') {
        filteredItems = group.items.filter((i: MapItem) => i.kind === 'post');
      } else if (filterMode === 'resources') {
        filteredItems = group.items.filter((i: MapItem) => i.kind === 'resource');
      }

      return {
        ...group,
        items: filteredItems,
        count: filteredItems.length,
      };
    }).filter((group: CityGroup) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 ||
        group.city.toLowerCase().includes(normalizedSearch) ||
        group.country.toLowerCase().includes(normalizedSearch) ||
        group.items.some((item: MapItem) => {
          if (item.kind === 'post') {
            return (
              (item.data.alias && item.data.alias.toLowerCase().includes(normalizedSearch)) ||
              (Array.isArray(item.data.what_helped) && item.data.what_helped.some((tag: string) => tag.toLowerCase().includes(normalizedSearch)))
            );
          }
          return (
            item.data.title.toLowerCase().includes(normalizedSearch) ||
            (item.data.description && item.data.description.toLowerCase().includes(normalizedSearch))
          );
        });

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
  }, [groupedItems, searchTerm, userLocation, filterMode]);

  const hasActiveSearch = searchTerm.trim().length > 0;
  const visiblePostCount = filteredGroups.reduce((sum, group) => sum + group.count, 0);
  const emptyStateTitle = filterMode === 'resources'
    ? 'No Resources Yet'
    : filterMode === 'stories'
      ? 'No Stories Yet'
      : 'No Cities Found';
  const emptyStateDescription = hasActiveSearch
    ? `No results for "${searchTerm.trim()}". Try a city, author, or tag.`
    : filterMode === 'resources'
      ? 'No resource posts match this view yet.'
      : filterMode === 'stories'
        ? 'No story posts match this view yet.'
        : 'Try adjusting the filters or refresh the map.';

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return filteredGroups.find(group => group.id === selectedGroupId) || null;
  }, [filteredGroups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedPostId(null);
      setIsDesktopPreviewVisible(false);
      return;
    }

    const hasSelectedItem = selectedGroup.items.some((item: MapItem) => item.data.id === selectedPostId);
    if (!hasSelectedItem) {
      setSelectedPostId(null);
      setIsDesktopPreviewVisible(false);
    }
  }, [selectedGroup, selectedPostId]);

  const selectedItem = useMemo((): MapItem | null => {
    if (!selectedGroup || !selectedPostId) return null;
    return selectedGroup.items.find((item: MapItem) => item.data.id === selectedPostId) || null;
  }, [selectedGroup, selectedPostId]);

  const selectedItemIndex = selectedGroup && selectedItem
    ? selectedGroup.items.findIndex((item: MapItem) => item.data.id === selectedItem.data.id)
    : -1;

  const selectAdjacentItem = (direction: 1 | -1) => {
    if (!selectedGroup || selectedItemIndex < 0) return;
    const nextIndex = (selectedItemIndex + direction + selectedGroup.items.length) % selectedGroup.items.length;
    setSelectedPostId(selectedGroup.items[nextIndex]?.data.id || null);
    setIsDesktopPreviewVisible(true);
  };

  const mapFocus = selectedGroup
    ? { lat: selectedGroup.lat, lng: selectedGroup.lng }
    : userLocation || undefined;

  const [isListVisible, setIsListVisible] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-grow flex-col overflow-hidden bg-[#f0f4f3] md:flex-row">

      {/* Global loading bar — fixed above nav, covers mobile + desktop */}
      <LoadingBar isLoading={refreshing} className="fixed top-0 left-0 right-0 z-[5001]" />

      {/* FLOATING TOP BAR (Mobile Only) */}
      <div className="md:hidden absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">

        {/* Floating Search */}
        <div className="relative flex-grow shadow-lg rounded-xl pointer-events-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {ICONS.Search}
          </div>
          <input
            type="text"
            placeholder="Search city, author, or tag..."
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
                        selectGroup(group.id);
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
                  <p className="font-bold text-[#1e3a34] text-xs">{emptyStateTitle}</p>
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
      <aside className={`relative hidden h-full min-h-0 shrink-0 flex-row overflow-hidden border-r border-white/70 bg-white/84 shadow-[18px_0_48px_-36px_rgba(30,58,52,0.42)] backdrop-blur-3xl transition-all duration-300 md:flex ${selectedGroup ? 'w-[680px] lg:w-[760px] xl:w-[860px]' : 'w-[380px] lg:w-[420px] xl:w-[460px]'}`}>

        {/* Ambient Glowing Blobs Behind Sidebar */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#448a7d]/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e57c6e]/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />

        {/* LEFT PANEL - CITIES LIST & DASHBOARD */}
        <div className="relative z-20 flex min-h-0 w-[380px] shrink-0 flex-col border-r border-[#448a7d]/10 bg-white/40 lg:w-[420px] xl:w-[460px]">

          {/* Top Dashboard Actions & Stats */}
          <div className="p-6 pb-5 border-b border-gray-100 flex flex-col gap-5 bg-white/60">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1e3a34] tracking-tight italic leading-none mb-2">Support Map.</h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#448a7d] uppercase tracking-widest bg-[#e8f3f1] px-3 py-1.5 rounded-full inline-flex">
                  <span>{groupedItems.length} Cities</span>
                  <span className="text-[#1e3a34]/20">•</span>
                  <span>{posts.length} Stories & Resources</span>
                  {refreshing && posts.length > 0 && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-[#448a7d] ml-0.5 shrink-0"
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
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
                placeholder="Search city, author, or tag..."
                className="w-full bg-white border border-gray-200/80 rounded-2xl py-3 pl-12 pr-11 text-sm focus:ring-2 focus:ring-[#448a7d] focus:border-transparent focus:outline-none transition-all placeholder:text-gray-500 text-[#1e3a34] font-medium shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {hasActiveSearch && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-[#1e3a34]/55 transition-colors hover:bg-[#e8f3f1] hover:text-[#1e3a34]"
                  aria-label="Clear search"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-[#1e3a34]/60">
              <span>{visiblePostCount} posts in {filteredGroups.length} cities</span>
              {(hasActiveSearch || filterMode !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMode('all');
                  }}
                  className="text-[#448a7d] hover:text-[#1e3a34]"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Framer Motion Segmented Filter */}
            <div className="relative flex p-1.5 bg-gray-100/80 rounded-2xl">
              {['all', 'stories', 'resources'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterMode(tab as any)}
                  className={`flex-1 relative py-2.5 text-[11px] font-black uppercase tracking-widest z-10 transition-colors ${filterMode === tab ? 'text-[#1e3a34]' : 'text-[#1e3a34]/50 hover:text-[#1e3a34]/72'}`}
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
          <div className="min-h-0 flex-grow overflow-y-auto p-4 space-y-3">
            {refreshing && posts.length === 0 ? (
              <CitySkeleton />
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-56 px-6">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">{ICONS.Search}</div>
                <p className="font-black text-[#1e3a34] text-lg mb-2">{emptyStateTitle}</p>
                <p className="text-sm text-[#1e3a34]/58 font-medium">{emptyStateDescription}</p>
                {(hasActiveSearch || filterMode !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterMode('all');
                    }}
                    className="mt-5 rounded-full bg-[#448a7d] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    Clear filter
                  </button>
                )}
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
                    onClick={() => selectGroup(group.id)}
                    className={`p-5 rounded-2xl transition-all duration-300 cursor-pointer border-2 group relative overflow-hidden ${selectedGroupId === group.id
                      ? 'border-[#448a7d] bg-white text-[#1e3a34] shadow-md'
                      : 'border-transparent bg-white shadow-sm hover:border-[#448a7d]/20 hover:shadow-md'
                      }`}
                  >
                    {selectedGroupId === group.id && <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[#448a7d]" />}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedGroupId === group.id ? 'bg-[#448a7d] text-white' : 'bg-[#e8f3f1] text-[#448a7d]'}`}>
                          {ICONS.MapPin}
                        </div>
                        <div>
                          <span className="font-black text-base block tracking-tight text-[#1e3a34]">{group.city}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a34]/52">{group.country}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${selectedGroupId === group.id ? 'bg-[#448a7d] text-white' : 'bg-[#1e3a34] text-white'}`}>
                        {group.count}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.topTags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#448a7d]/10 bg-[#f9fbfa] text-[#448a7d]">
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

        {/* RIGHT PANEL - DESKTOP NOTE MANAGER */}
        {selectedGroup && (
          <div className="min-h-0 flex-1 flex flex-col bg-[#f9fbfa] relative z-10 min-w-[300px]">
            <div className="flex h-full min-h-0 flex-col animate-in fade-in duration-500">
              <div className="flex-shrink-0 bg-white px-6 py-5 border-b border-gray-100 shadow-sm z-10 sticky top-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 bg-[#e8f3f1] text-[#448a7d] rounded-2xl flex flex-shrink-0 items-center justify-center">
                      {ICONS.MapPin}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#2f7a70]">Notes in view</p>
                      <h3 className="font-black text-xl text-[#1e3a34] tracking-tight truncate">{selectedGroup.city}</h3>
                      <p className="text-[10px] text-[#1e3a34]/52 font-bold uppercase tracking-widest mt-1">{selectedGroup.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest bg-[#448a7d] px-3 py-1.5 rounded-full shadow-md">
                      {selectedGroup.count}
                    </span>
                    <button onClick={() => setSelectedGroupId(null)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" title="Close">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1e3a34]/8 pt-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a34]/62">
                    Select an item to preview on the map
                  </span>
                  <span className="rounded-full bg-[#e8f3f1] px-2.5 py-1 text-[10px] font-black text-[#448a7d]">{selectedGroup.items.length}</span>
                </div>
              </div>
              <div className="min-h-0 flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                <AnimatePresence mode="popLayout">
                  {selectedGroup.items.map((item: MapItem, idx: number) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={item.data.id}
                    >
                      {item.kind === 'post' ? (
                        <PostCard
                          post={item.data}
                          selected={selectedPostId === item.data.id}
                          onClick={() => {
                            setSelectedPostId(item.data.id);
                            setIsDesktopPreviewVisible(true);
                          }}
                        />
                      ) : (
                        <ResourceMapCard
                          resource={item.data}
                          selected={selectedPostId === item.data.id}
                          onClick={() => {
                            setSelectedPostId(item.data.id);
                            setIsDesktopPreviewVisible(true);
                          }}
                        />
                      )}
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
                      className={`flex-1 relative py-2.5 text-[11px] font-black uppercase tracking-widest z-10 transition-colors ${filterMode === tab ? 'text-[#1e3a34]' : 'text-[#1e3a34]/50 hover:text-[#1e3a34]/72'}`}
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
                {refreshing && posts.length === 0 ? (
                  <CitySkeleton />
                ) : filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-16 h-16 bg-white shadow-sm text-gray-400 rounded-full flex items-center justify-center mb-4">{ICONS.Search}</div>
                    <p className="font-black text-[#1e3a34] text-lg mb-1">{emptyStateTitle}</p>
                    <p className="text-xs text-[#1e3a34]/58 font-medium">{emptyStateDescription}</p>
                  </div>
                ) : filteredGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => {
                      selectGroup(group.id);
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

      {/* MAP */}
      <div className="relative z-10 h-full w-full min-w-0 flex-grow overflow-hidden bg-[#e8f3f1] md:w-auto">
        <SupportMap
          groups={filteredGroups}
          onMarkerClick={(group) => {
            selectGroup(group.id);
          }}
          selectedGroupId={selectedGroupId || undefined}
          flyToLocation={mapFocus}
        />

        <AnimatePresence>
          {selectedGroup && selectedItem && isDesktopPreviewVisible && (
            <motion.div
              key={selectedItem.data.id}
              className="pointer-events-none absolute right-5 top-5 z-[1500] hidden md:flex justify-end"
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              {(() => {
                const preview = getItemPreview(selectedItem!);
                const isResource = selectedItem!.kind === 'resource';
                const tags = isResource ? [] : (selectedItem!.data as Post).what_helped || [];
                const timestamp = selectedItem!.data.timestamp;

                return (
                  <div className="pointer-events-auto w-[min(38rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_-34px_rgba(30,58,52,0.62)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-[#1e3a34]/8 px-5 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isResource ? 'bg-[#e57c6e]/12 text-[#a85240]' : 'bg-[#e8f3f1] text-[#448a7d]'}`}>
                          {isResource ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.8 10.2a4 4 0 0 0-5.6 0l-4 4a4 4 0 0 0 5.6 5.6l1.1-1.1" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.2 13.8a4 4 0 0 0 5.6 0l4-4a4 4 0 0 0-5.6-5.6l-1.1 1.1" />
                            </svg>
                          ) : ICONS.Users}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#448a7d]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#448a7d]">
                              {selectedGroup.city}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#1e3a34]/38">
                              {selectedItemIndex + 1} of {selectedGroup.items.length}
                            </span>
                          </div>
                          <h3 className="text-base font-black leading-snug tracking-tight text-[#1e3a34]">
                            {preview.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-[#1e3a34]/68">
                            {preview.body}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => selectAdjacentItem(-1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1e8] text-[#1e3a34] transition-colors hover:bg-[#e8f3f1]"
                          aria-label="Previous item"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => selectAdjacentItem(1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a34] text-white transition-colors hover:bg-[#2d5a52]"
                          aria-label="Next item"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setIsDesktopPreviewVisible(false)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a34] text-white ring-1 ring-[#1e3a34]/10 transition-colors hover:bg-[#2d5a52]"
                          aria-label="Hide preview"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="flex min-w-0 flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag, idx) => (
                          <span key={`${tag}-${idx}`} className="rounded-full border border-[#448a7d]/10 bg-[#f9fbfa] px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#448a7d]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.16em] text-[#1e3a34]/52">
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

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
              {selectedGroup.items.map((item: MapItem, idx: number) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  key={item.data.id}
                >
                  {item.kind === 'post'
                    ? <PostCard post={item.data} />
                    : <ResourceMapCard resource={item.data} />}
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
