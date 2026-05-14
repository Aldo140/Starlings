import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { EASE_OUT_EXPO } from '../constants.tsx';

interface GalleryImageProps {
  src: string;
  label: string;
  h: string;
  delay: number;
  inView: boolean;
  flat?: boolean;
}

const GalleryLabelIcon: React.FC<{ label: string }> = ({ label }) => {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  const normalized = label.toLowerCase();

  if (normalized.includes('hope') || normalized.includes('growth')) {
    return (
      <svg {...common}>
        <path d="M12 19V5" />
        <path d="M7 10c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4Z" />
        <path d="M17 10c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4Z" />
        <path d="M12 14c-3 0-5-2-5-5" />
        <path d="M12 14c3 0 5-2 5-5" />
      </svg>
    );
  }

  if (normalized.includes('community') || normalized.includes('together') || normalized.includes('support')) {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M2 21v-2a4 4 0 0 1 3-3.87" />
      </svg>
    );
  }

  if (normalized.includes('peace') || normalized.includes('reflection') || normalized.includes('self')) {
    return (
      <svg {...common}>
        <path d="M12 21s-7-4.35-7-11a7 7 0 0 1 14 0c0 6.65-7 11-7 11Z" />
        <path d="M12 7v5" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
};

const GalleryImage: React.FC<GalleryImageProps> = ({ src, label, h, delay, inView, flat }) => {
  // Per-card mouse-tracking 3D tilt (desktop)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 260, damping: 26 });
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 260, damping: 26 });
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };
  const onMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5); };

  if (flat) {
    // Flat illustration treatment — clean white card, object-contain, no dark overlay
    return (
      <div style={{ perspective: '900px' }}>
        <motion.div
          className={`relative ${h} overflow-hidden rounded-[2rem] bg-white group cursor-pointer shadow-[0_24px_60px_-16px_rgba(30,58,52,0.18)] border border-[#e8f3f1]`}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
          animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : {}}
          transition={{ duration: 0.95, delay, ease: EASE_OUT_EXPO }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {/* Soft mint tint on the white — grounds it in the brand palette */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f3f1]/30 to-white/0 pointer-events-none z-10" />
          <motion.img
            src={src}
            loading="lazy"
            className="w-full h-full object-contain p-3"
            alt={label}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
          />
          {/* Subtle bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10" />
          <motion.div
            className="absolute bottom-4 left-4 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: delay + 0.48, ease: EASE_OUT_EXPO }}
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#1e3a34]">
              <GalleryLabelIcon label={label} />
              {label}
            </span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        className={`relative ${h} overflow-hidden rounded-[2rem] shadow-[0_16px_48px_-22px_rgba(30,58,52,0.22)] group cursor-pointer`}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 }}
        animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : {}}
        transition={{ duration: 0.95, delay, ease: EASE_OUT_EXPO }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <motion.img
          src={src}
          loading="lazy"
          className="w-full h-full object-cover"
          alt={label}
          whileHover={{ scale: 1.09 }}
          transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a34]/55 via-[#1e3a34]/08 to-transparent opacity-22 group-hover:opacity-60 transition-opacity duration-500" />
        <motion.div
          className="absolute bottom-4 left-4"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + 0.48, ease: EASE_OUT_EXPO }}
        >
          <span className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
            <GalleryLabelIcon label={label} />
            {label}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GalleryImage;
