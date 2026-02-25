import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportMap from '../components/Map.tsx';
import PostCard from '../components/PostCard.tsx';
import { apiService, calculateDistance } from '../services/api.ts';
import { Post } from '../types.ts';
import { ICONS } from '../constants.tsx';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await apiService.getApprovedPosts();
      setPosts(data);
      setLoading(false);
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
        // Map will respond to userLocation changes if we pass it as a flyTo prop
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true }
    );
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
        post.what_helped.forEach((tag) => {
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
    let result = groupedPosts.filter(group =>
      group.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.posts.some(post =>
        post.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.what_helped.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );

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
  }, [groupedPosts, searchTerm, userLocation]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groupedPosts.find(group => group.id === selectedGroupId) || null;
  }, [groupedPosts, selectedGroupId]);

  const mapFocus = selectedGroup
    ? { lat: selectedGroup.lat, lng: selectedGroup.lng }
    : userLocation || undefined;

  return (
    <div className="h-[calc(100vh-124px)] max-[400px]:h-[calc(100vh-104px)] flex flex-col md:flex-row overflow-hidden relative bg-[#f0f4f3] w-full">
      <aside className="hidden md:flex flex-col w-[440px] bg-white border-r border-gray-100 h-full overflow-hidden shadow-xl z-20">
        <div className="p-8 space-y-6 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-[#1e3a34] tracking-tight italic">Support Map.</h2>
            <div className="flex gap-2">
              <button
                onClick={handleNearMe}
                disabled={isLocating}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${userLocation ? 'bg-[#448a7d] text-white' : 'bg-[#e8f3f1] text-[#1e3a34] hover:bg-teal-100'}`}
              >
                {isLocating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : ICONS.Navigation}
              </button>
              <button onClick={() => navigate('/share')} className="w-12 h-12 bg-[#e8f3f1] rounded-2xl hover:bg-[#1e3a34] hover:text-white transition-all flex items-center justify-center text-[#1e3a34] shadow-sm">
                {ICONS.Plus}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-teal-100 bg-[#f5fbf9] p-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em]">Cities</p>
              <p className="text-2xl font-black text-[#1e3a34]">{groupedPosts.length}</p>
            </div>
            <div className="rounded-2xl border border-[#fbd6d1] bg-[#fff6f5] p-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em]">Notes</p>
              <p className="text-2xl font-black text-[#1e3a34]">{posts.length}</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{ICONS.Search}</div>
            <input
              type="text" placeholder="Search by city..."
              className="w-full pl-12 pr-6 py-4 bg-[#f9fbfa] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#448a7d]/10 transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {userLocation && (
            <div className="flex items-center justify-between px-2 py-1 bg-teal-50 rounded-xl">
              <span className="text-[10px] font-black text-[#448a7d] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#448a7d] rounded-full animate-pulse" />
                Nearest First
              </span>
              <button onClick={() => setUserLocation(null)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest">Clear</button>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-gray-400">City Pulse</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#448a7d] bg-teal-50 px-3 py-1 rounded-full">
              Tap a city
            </span>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#1e3a34]/30 font-bold text-[10px] uppercase tracking-widest">Loading light...</p>
            </div>
          ) : filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`p-6 rounded-[32px] transition-all duration-300 cursor-pointer border-2 group ${selectedGroupId === group.id
                  ? 'border-[#448a7d] bg-[#448a7d]/5 shadow-xl -translate-y-1'
                  : 'border-transparent bg-white hover:border-gray-100 hover:shadow-lg hover:-translate-y-1'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-[#1e3a34]">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selectedGroupId === group.id ? 'bg-[#448a7d] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                    {ICONS.MapPin}
                  </div>
                  <div>
                    <span className="font-black text-sm block tracking-tight">{group.city}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.country}</span>
                  </div>
                </div>
                <span className="text-[10px] text-white font-black uppercase tracking-widest bg-[#1e3a34] px-3 py-1 rounded-full">
                  {group.count} Notes
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.topTags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="px-3 py-1.5 rounded-full bg-[#f9fbfa] text-[#448a7d] text-[9px] font-black uppercase tracking-widest border border-gray-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-grow h-full relative z-10 w-full overflow-hidden">
        <SupportMap
          groups={filteredGroups}
          onMarkerClick={(group) => setSelectedGroupId(group.id)}
          selectedGroupId={selectedGroupId || undefined}
          flyToLocation={mapFocus}
        />

        <div className="md:hidden absolute top-4 right-4 ui-overlay flex flex-col gap-3">
          <button onClick={handleNearMe} className={`${userLocation ? 'bg-[#448a7d] text-white' : 'bg-white text-[#1e3a34]'} w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90`}>
            {ICONS.Navigation}
          </button>
          <button onClick={() => navigate('/share')} className="bg-[#1e3a34] text-white w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90">
            {ICONS.Plus}
          </button>
        </div>

        {selectedGroup && (
          <div className="absolute bottom-8 left-4 right-4 md:left-auto md:right-8 ui-overlay max-w-xl md:w-[420px]">
            <div className="glass-panel rounded-[2rem] shadow-2xl p-6 max-[400px]:p-4 relative animate-reveal border border-white/60">
              <button onClick={() => setSelectedGroupId(null)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-800">{ICONS.X}</button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">{ICONS.MapPin}</div>
                <div>
                  <h4 className="font-black text-lg text-[#1e3a34]">{selectedGroup.city}</h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedGroup.country}</span>
                </div>
                <span className="ml-auto text-[10px] text-white font-black uppercase tracking-widest bg-[#1e3a34] px-3 py-1 rounded-full">
                  {selectedGroup.count} Notes
                </span>
              </div>
              {selectedGroup.topTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedGroup.topTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="px-3 py-1.5 rounded-full bg-[#f9fbfa] text-[#448a7d] text-[9px] font-black uppercase tracking-widest border border-gray-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {selectedGroup.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <div className="mt-6">
                <button onClick={() => navigate('/share')} className="w-full py-4 max-[400px]:py-3 bg-[#1e3a34] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                  Share your light {ICONS.ArrowRight}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedGroup && (
          <div className="md:hidden absolute bottom-6 left-6 right-6 ui-overlay max-[400px]:left-4 max-[400px]:right-4">
            <button onClick={() => setIsMobileListOpen(true)} className="w-full bg-[#1e3a34] text-white py-4 max-[400px]:py-3 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-xs max-[400px]:text-[10px]">
              List View ({filteredGroups.length})
            </button>
          </div>
        )}
      </div>

      {isMobileListOpen && (
        <div className="md:hidden fixed inset-0 z-[3000] bg-white flex flex-col animate-reveal">
          <div className="p-6 max-[400px]:p-4 border-b flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-black text-[#1e3a34] italic">Support Map.</h2>
            <button onClick={() => setIsMobileListOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">{ICONS.X}</button>
          </div>
          <div className="p-6 max-[400px]:p-4 overflow-y-auto flex-grow space-y-6">
            {filteredGroups.map(group => (
              <div
                key={group.id}
                onClick={() => { setSelectedGroupId(group.id); setIsMobileListOpen(false); }}
                className="p-6 rounded-[32px] transition-all duration-300 cursor-pointer border-2 border-transparent bg-white hover:border-gray-100 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-[#1e3a34]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400">
                      {ICONS.MapPin}
                    </div>
                    <div>
                      <span className="font-black text-sm block tracking-tight">{group.city}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.country}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white font-black uppercase tracking-widest bg-[#1e3a34] px-3 py-1 rounded-full">
                    {group.count} Notes
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.topTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="px-3 py-1.5 rounded-full bg-[#f9fbfa] text-[#448a7d] text-[9px] font-black uppercase tracking-widest border border-gray-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
