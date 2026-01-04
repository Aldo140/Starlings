import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map.tsx';
import PostCard from '../components/PostCard.tsx';
import { apiService, calculateDistance } from '../services/api.ts';
import { Post } from '../types.ts';
import { ICONS } from '../constants.tsx';

const MapView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
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

  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => 
      post.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.what_helped.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      result = [...result].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return result;
  }, [posts, searchTerm, userLocation]);

  return (
    <div className="h-[calc(100vh-124px)] flex flex-col md:flex-row overflow-hidden relative bg-[#f0f4f3] w-full">
      <aside className="hidden md:flex flex-col w-[420px] bg-white border-r border-gray-100 h-full overflow-hidden shadow-xl z-20">
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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
               <div className="w-8 h-8 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
               <p className="text-[#1e3a34]/30 font-bold text-[10px] uppercase tracking-widest">Loading light...</p>
            </div>
          ) : filteredPosts.map(post => (
            <PostCard key={post.id} post={post} selected={selectedPost?.id === post.id} onClick={() => setSelectedPost(post)} />
          ))}
        </div>
      </aside>

      <div className="flex-grow h-full relative z-10 w-full overflow-hidden">
        <Map 
          posts={filteredPosts} 
          onMarkerClick={(post) => setSelectedPost(post)} 
          selectedPostId={selectedPost?.id}
          flyToLocation={userLocation || undefined}
        />
        
        <div className="md:hidden absolute top-4 right-4 ui-overlay flex flex-col gap-3">
          <button onClick={handleNearMe} className={`${userLocation ? 'bg-[#448a7d] text-white' : 'bg-white text-[#1e3a34]'} w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90`}>
            {ICONS.Navigation}
          </button>
          <button onClick={() => navigate('/share')} className="bg-[#1e3a34] text-white w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90">
            {ICONS.Plus}
          </button>
        </div>

        {selectedPost && (
          <div className="absolute bottom-8 left-4 right-4 md:left-auto md:right-8 ui-overlay max-w-lg md:w-[400px]">
            <div className="glass-panel rounded-[2rem] shadow-2xl p-6 relative animate-reveal">
              <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-800">{ICONS.X}</button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">{ICONS.MapPin}</div>
                <h4 className="font-black text-lg text-[#1e3a34]">{selectedPost.city}</h4>
              </div>
              <p className="text-gray-800 leading-relaxed italic text-lg mb-6">"{selectedPost.message}"</p>
              <button onClick={() => navigate('/share')} className="w-full py-4 bg-[#1e3a34] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                Share your light {ICONS.ArrowRight}
              </button>
            </div>
          </div>
        )}

        {!selectedPost && (
          <div className="md:hidden absolute bottom-6 left-6 right-6 ui-overlay">
            <button onClick={() => setIsMobileListOpen(true)} className="w-full bg-[#1e3a34] text-white py-4 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-xs">
              List View ({filteredPosts.length})
            </button>
          </div>
        )}
      </div>

      {isMobileListOpen && (
        <div className="md:hidden fixed inset-0 z-[3000] bg-white flex flex-col animate-reveal">
          <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-black text-[#1e3a34] italic">Support Map.</h2>
            <button onClick={() => setIsMobileListOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">{ICONS.X}</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow space-y-6">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onClick={() => { setSelectedPost(post); setIsMobileListOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;