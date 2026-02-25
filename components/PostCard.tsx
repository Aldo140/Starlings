import React from 'react';
import { Post } from '../types.ts';
import { ICONS, COLORS } from '../constants.tsx';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  selected?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, selected }) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-[32px] transition-all duration-300 cursor-pointer border-2 group ${selected
          ? 'border-[#448a7d] bg-[#448a7d]/5 shadow-xl -translate-y-1'
          : 'border-transparent bg-white hover:border-gray-100 hover:shadow-lg hover:-translate-y-1'
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-[#1e3a34]">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-[#448a7d] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
            {ICONS.Users}
          </div>
          <div>
            <span className="font-black text-sm block tracking-tight">{post.alias || 'Anonymous'}</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 italic font-light">
        "{post.message}"
      </p>

      <div className="flex flex-wrap gap-2">
        {post.what_helped.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="px-3 py-1.5 rounded-full bg-[#f9fbfa] text-[#448a7d] text-[9px] font-black uppercase tracking-widest border border-gray-100"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PostCard;
