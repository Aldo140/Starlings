import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../constants.tsx';
import { QAItem } from '../types.ts';

export const formatDate = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

export const QASkeleton: React.FC = () => (
  <div className="bg-white border border-[#c8e0da] rounded-[1.75rem] p-5 md:p-7 animate-pulse shadow-[0_4px_16px_-6px_rgba(30,58,52,0.1)]">
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#d4eae6] flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-2 bg-[#d4eae6] rounded-full w-16" />
          <div className="h-2 bg-[#d4eae6]/60 rounded-full w-20" />
        </div>
        <div className="h-3 bg-[#d4eae6] rounded-full w-4/5" />
        <div className="h-3 bg-[#d4eae6] rounded-full w-3/5" />
      </div>
    </div>
    <div className="ml-4 mt-3 mb-3 w-px h-4 bg-[#d4eae6]/60" />
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#d4eae6]/70 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2 bg-[#d4eae6]/70 rounded-full w-24" />
        <div className="h-2.5 bg-[#d4eae6]/60 rounded-full w-full" />
        <div className="h-2.5 bg-[#d4eae6]/60 rounded-full w-4/5" />
        <div className="h-2.5 bg-[#d4eae6]/60 rounded-full w-3/5" />
      </div>
    </div>
  </div>
);

export const QAThreadCard: React.FC<{ item: QAItem; index: number }> = ({ item, index }) => {
  const cardDelay = index * 0.13;

  return (
    <motion.div
      initial={{ opacity: 0, y: 44, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.65, delay: cardDelay, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
      className="relative bg-white border border-[#e8f3f1] rounded-[1.75rem] overflow-hidden group shadow-[0_4px_20px_-8px_rgba(30,58,52,0.08)]"
    >
      {/* Hover glow border */}
      <motion.div
        className="absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(68,138,125,0.25), 0 20px 60px -15px rgba(68,138,125,0.18)' }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-5 md:p-7">
        {/* Question row */}
        <div className="flex gap-3 items-start">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#448a7d]/50 to-[#2d5a52]/70 flex-shrink-0 mt-0.5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardDelay + 0.1, type: 'spring', stiffness: 400, damping: 22 }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="7" fontWeight="900" fontFamily="Inter, sans-serif" fill="rgba(255,255,255,0.75)">Q</text>
            </svg>
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#448a7d]/70">Anonymous</p>
              {item.timestamp && (
                <motion.span
                  className="text-[8px] font-medium text-[#1e3a34]/40 tracking-wide flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: cardDelay + 0.45, duration: 0.5 }}
                >
                  {formatDate(item.timestamp)}
                </motion.span>
              )}
            </div>
            <p className="text-[#1e3a34] font-bold italic text-sm md:text-[15px] leading-snug">{item.question}</p>
          </div>
        </div>

        {/* Thread connector — draws itself down */}
        <div className="ml-4 my-2.5 overflow-hidden w-px">
          <motion.div
            className="w-full bg-gradient-to-b from-[#e8f3f1] to-[#e8f3f1]/20"
            initial={{ height: 0 }}
            animate={{ height: 20 }}
            transition={{ delay: cardDelay + 0.3, duration: 0.4, ease: EASE_OUT_EXPO }}
          />
        </div>

        {/* Answer row */}
        <div className="flex gap-3 items-start">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f3f1]/10 to-[#448a7d]/20 flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#448a7d]/70"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: cardDelay + 0.35, type: 'spring', stiffness: 400, damping: 22 }}
          >
            ✦
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#1e3a34]/40 mb-1.5">Community Response</p>
            <p className="text-[#1e3a34]/65 text-xs md:text-[13px] leading-relaxed">{item.answer}</p>
          </div>
        </div>
      </div>

      {/* Animated bottom accent */}
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-[#448a7d]/0 to-transparent"
        animate={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0), transparent)' }}
        whileHover={{ background: 'linear-gradient(to right, transparent, rgba(68,138,125,0.35), transparent)' }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};
