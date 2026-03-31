import React, { useState } from 'react';
import { Post } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  selected?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if this post is actually a formatted Resource
  const isResource = post.message.startsWith('[RESOURCE');
  let resourceType = '';
  let resourceTitle = '';
  let resourceUrl = '';
  let resourceDesc = post.message;

  if (isResource) {
    const typeMatch = post.message.match(/^\[RESOURCE - (.*?)\]/);
    if (typeMatch) resourceType = typeMatch[1];

    // Attempt to split title | link | desc
    const lines = post.message.split('\n\n');
    const header = lines[0] || '';

    // Extract title and URL from header: [RESOURCE - Type] Title | Link: url
    const headerWithoutTag = header.replace(/^\[RESOURCE - .*?\]\s*/, '');
    const headerParts = headerWithoutTag.split(' | Link: ');
    if (headerParts.length === 2) {
      resourceTitle = headerParts[0];
      resourceUrl = headerParts[1];
    } else {
      resourceTitle = headerWithoutTag;
    }

    // Rest is description
    resourceDesc = lines.slice(1).join('\n\n');
  }

  const isLong = resourceDesc.length > 120; // Arbitrary threshold

  if (isResource) {
    return (
      <div
        onClick={onClick}
        className={`p-6 rounded-[32px] transition-all duration-300 cursor-pointer border-2 group ${selected
          ? 'border-[#448a7d] bg-[#448a7d]/5 shadow-xl -translate-y-1'
          : 'border-transparent bg-white hover:border-[#448a7d]/20 hover:shadow-lg hover:-translate-y-1'
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-[#1e3a34]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-[#448a7d] text-white' : 'bg-[#e8f3f1] text-[#448a7d] group-hover:bg-[#448a7d]/20'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <span className="font-black text-sm block tracking-tight truncate max-w-[180px] sm:max-w-xs">{resourceTitle}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{resourceType}</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
            {new Date(post.timestamp).toLocaleDateString()}
          </span>
        </div>

        <p className={`text-gray-600 text-sm leading-relaxed whitespace-pre-line ${isExpanded ? 'mb-6' : (isLong ? 'mb-2' : 'mb-6')} ${isExpanded ? '' : 'line-clamp-3'} font-medium`}>
          {resourceDesc}
        </p>

        {!isExpanded && isLong && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className="text-[#448a7d] text-xs font-bold uppercase tracking-widest hover:underline mb-6 block"
          >
            Read more
          </button>
        )}

        {isExpanded && isLong && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            className="text-[#448a7d] text-xs font-bold uppercase tracking-widest hover:underline mb-6 block"
          >
            Show less
          </button>
        )}

        <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 bg-[#1e3a34] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2d5a52] transition-colors shadow-sm inline-flex flex-shrink-0"
          >
            Visit Resource
          </a>
        </div>
      </div>
    );
  }

  // Standard Note Render
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

      <p className={`text-gray-600 text-sm leading-relaxed ${isExpanded ? 'mb-6' : (isLong ? 'mb-2' : 'mb-6')} ${isExpanded ? '' : 'line-clamp-3'} italic font-light`}>
        "{resourceDesc}"
      </p>

      {!isExpanded && isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          className="text-[#448a7d] text-xs font-bold uppercase tracking-widest hover:underline mb-6 block"
        >
          Read more
        </button>
      )}

      {isExpanded && isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="text-[#448a7d] text-xs font-bold uppercase tracking-widest hover:underline mb-6 block"
        >
          Show less
        </button>
      )}

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

export default React.memo(PostCard, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id && prevProps.selected === nextProps.selected;
});
