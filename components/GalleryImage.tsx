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
            <span className="inline-block px-3.5 py-2 bg-[#e8f3f1]/90 backdrop-blur-md border border-[#448a7d]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1e3a34] shadow-sm">
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
          <span className="inline-block px-3 py-1.5 bg-white/55 backdrop-blur-sm border border-white/28 rounded-xl text-[8.5px] font-bold uppercase tracking-widest text-[#1e3a34]">
            {label}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GalleryImage;
