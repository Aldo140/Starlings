import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map.tsx';
import PostCard from '../components/PostCard.tsx';
import { apiService } from '../services/api.ts';
import { Post } from '../types.ts';
import { ICONS, COLORS } from '../constants.tsx';

const MapView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await apiService.getApprovedPosts();
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.what_helped.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, searchTerm]);

  return (
    <div className="h-[calc(100vh-124px)] flex flex-col md:flex-row overflow-hidden relative bg-[#f0f4f3] w-full">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-[420px] bg-white border-r border-gray-100 h-full overflow-hidden shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] z-20">
        <div className="p-8 space-y-6 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-[#1e3a34] tracking-tight italic">Support Map.</h2>
            <button 
              onClick={() => navigate('/share')}
              className="w-12 h-12 bg-[#e8f3f1] rounded-[1rem] hover:bg-[#1e3a34] hover:text-white transition-all flex items-center justify-center text-[#1e3a34] shadow-sm active:scale-90"
            >
              {ICONS.Plus}
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 scale-110">
              {ICONS.Search}
            </div>
            <input 
              type="text" 
              placeholder="Search by city..."
              className="w-full pl-12 pr-6 py-4 bg-[#f9fbfa] border-none rounded-[1.25rem] text-base focus:outline-none focus:ring-4 focus:ring-[#448a7d]/10 focus:bg-white transition-all placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar bg-gray-50/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
               <div className="w-8 h-8 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin" />
               <p className="text-[#1e3a34]/30 font-bold text-[10px] uppercase tracking-widest">Gathering light...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="text-gray-100 mb-6 flex justify-center scale-150">{ICONS.MapPin}</div>
              <p className="text-gray-400 text-sm font-light">No notes found for your search.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-[#448a7d] text-xs font-black uppercase tracking-widest hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                selected={selectedPost?.id === post.id}
                onClick={() => setSelectedPost(post)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Map Experience */}
      <div className="flex-grow h-full relative z-10 w-full overflow-hidden">
        <Map 
          posts={filteredPosts} 
          onMarkerClick={(post) => {
            setSelectedPost(post);
            setIsMobileListOpen(false);
            setIsFocusMode(false);
          }}
          selectedPostId={selectedPost?.id}
        />
        
        {/* Mobile FAB Overlays */}
        <div className="md:hidden absolute top-4 right-4 ui-overlay flex flex-col gap-3">
          <button 
            onClick={() => navigate('/share')}
            className="bg-[#1e3a34] text-white w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90"
            title="Share Now"
          >
            {ICONS.Plus}
          </button>
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`${isFocusMode ? 'bg-[#448a7d] text-white' : 'bg-white text-[#1e3a34]'} w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-colors`}
            title="Toggle Focus"
          >
            {isFocusMode ? ICONS.Search : ICONS.Filter}
          </button>
        </div>

        {/* Selected Note Drawer */}
        {selectedPost && !isFocusMode && (
          <div className="absolute bottom-8 left-4 right-4 md:left-auto md:right-8 ui-overlay max-w-lg md:w-full">
            <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] p-6 md:p-10 animate-fade-up relative">
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all"
              >
                {ICONS.X}
              </button>
              
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#e8f3f1] flex items-center justify-center text-[#448a7d]">
                  {ICONS.MapPin}
                </div>
                <div>
                  <h4 className="font-black text-lg md:text-xl text-[#1e3a34] tracking-tight">{selectedPost.city}</h4>
                  <p className="text-[9px] md:text-[10px] font-black text-[#448a7d] uppercase tracking-[0.2em]">{selectedPost.country}</p>
                </div>
              </div>

              <div className="relative mb-6 md:mb-8 max-h-[35vh] overflow-y-auto no-scrollbar">
                <p className="text-gray-800 leading-relaxed italic text-base md:text-2xl font-light">
                  "{selectedPost.message}"
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-6 md:mb-10">
                {selectedPost.what_helped.map((tag, idx) => (
                  <span key={idx} className="px-3 md:px-4 py-1 md:py-1.5 bg-[#448a7d]/10 text-[#1e3a34] text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => navigate('/share')}
                className="w-full py-4 md:py-5 bg-[#1e3a34] text-white rounded-[1.25rem] md:rounded-[1.5rem] font-bold text-base md:text-lg hover:bg-[#2d5a52] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl active:scale-95"
              >
                Share your light {ICONS.ArrowRight}
              </button>
            </div>
          </div>
        )}

        {/* Mobile View Toggle Bar */}
        {!isFocusMode && !selectedPost && (
          <div className="md:hidden absolute bottom-6 left-6 right-6 ui-overlay">
            <button 
              onClick={() => setIsMobileListOpen(true)}
              className="w-full bg-[#1e3a34] text-white py-4 rounded-[1.5rem] shadow-2xl font-black flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[9px] active:scale-95"
            >
              {ICONS.Menu} List View ({filteredPosts.length})
            </button>
          </div>
        )}

        {/* Focus Mode Exit UI */}
        {isFocusMode && (
          <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 ui-overlay w-[90%] flex flex-col items-center gap-3">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg text-[9px] font-bold text-[#448a7d] uppercase tracking-[0.2em]">Map Focus Active</div>
            <button 
              onClick={() => setIsFocusMode(false)}
              className="bg-[#1e3a34] text-white px-8 py-4 rounded-full shadow-2xl font-black text-[9px] uppercase tracking-widest border border-gray-100 flex items-center gap-2 active:scale-95"
            >
              {ICONS.X} Exit Map Focus
            </button>
          </div>
        )}
      </div>

      {/* Mobile Modal List View */}
      {isMobileListOpen && (
        <div className="md:hidden fixed inset-0 z-[3000] bg-white flex flex-col animate-fade-up">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-xl font-black text-[#1e3a34] italic">Support Map.</h2>
            <button onClick={() => setIsMobileListOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-90">{ICONS.X}</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow space-y-6 bg-gray-50/20">
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onClick={() => {
                  setSelectedPost(post);
                  setIsMobileListOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;