import React from 'react';
import { Resource } from '../types.ts';

interface ResourceMapCardProps {
  resource: Resource;
  selected?: boolean;
  onClick?: () => void;
}

const ResourceMapCard: React.FC<ResourceMapCardProps> = ({
  resource,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-[32px] border-2 transition-all duration-300 cursor-pointer group ${
        selected
          ? 'border-[#448a7d] bg-[#448a7d]/5 shadow-xl -translate-y-1'
          : 'border-transparent bg-white hover:border-[#448a7d]/20 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: icon + title + type badge */}
        <div className="flex items-center gap-3 text-[#1e3a34]">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              selected
                ? 'bg-[#448a7d] text-white'
                : 'bg-[#e8f3f1] text-[#448a7d] group-hover:bg-[#448a7d]/20'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <div>
            <span className="font-black text-sm block tracking-tight truncate max-w-[180px] sm:max-w-xs">
              {resource.title}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              {resource.type}
            </span>
          </div>
        </div>

        {/* Right side: "Resource" label */}
        <span className="text-[10px] text-[#1e3a34]/46 font-bold uppercase tracking-widest flex-shrink-0">
          Resource
        </span>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-gray-600 text-sm leading-relaxed font-medium mb-6 line-clamp-3">
          {resource.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 bg-[#1e3a34] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2d5a52] transition-colors shadow-sm inline-flex flex-shrink-0"
        >
          Open Resource →
        </a>
        {resource.city && (
          <span className="text-[10px] text-gray-400 font-medium italic">
            {resource.city}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(ResourceMapCard);
