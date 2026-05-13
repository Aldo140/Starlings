import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../constants.tsx';

interface LoadingBarProps {
  /** Whether the loading operation is in progress */
  isLoading: boolean;
  /**
   * Positioning + z-index classes — caller controls placement.
   * Default: absolute top-0 left-0 right-0 z-10 (sits at top of nearest relative parent)
   * For page-level fixed bar use: "fixed top-0 left-0 right-0 z-[4998]"
   */
  className?: string;
}

/**
 * YouTube / GitHub-style thin loading bar.
 *
 * Lifecycle:
 *  isLoading=true  → mount, crawl 0 → ~82 % (eased, never reaches 100)
 *  isLoading=false → snap to 100 %, fade out, unmount
 *
 * Uses scaleX on a full-width bar with transform-origin:left so the
 * animation is GPU-accelerated and never triggers layout.
 */
const LoadingBar: React.FC<LoadingBarProps> = ({
  isLoading,
  className = 'absolute top-0 left-0 right-0 z-10',
}) => {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);   // 0 – 1
  const [fading, setFading]   = useState(false);

  const crawlRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const mountedRef = useRef(false); // track without triggering re-renders

  const clearTimers = () => {
    if (crawlRef.current)  clearInterval(crawlRef.current);
    if (doneRef.current)   clearTimeout(doneRef.current);
  };

  useEffect(() => {
    if (isLoading) {
      clearTimers();
      setMounted(true);
      mountedRef.current = true;
      setFading(false);
      setProgress(0.06);

      // Crawl toward 0.82 with exponential deceleration — feels organic
      crawlRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + (0.82 - prev) * 0.045 + 0.003;
          if (next >= 0.82) {
            clearInterval(crawlRef.current!);
            return 0.82;
          }
          return next;
        });
      }, 200);

    } else {
      clearTimers();
      if (!mountedRef.current) return;

      // Fill to 100 %
      setProgress(1);

      // Fade out 300 ms after fill completes
      doneRef.current = setTimeout(() => {
        setFading(true);
        doneRef.current = setTimeout(() => {
          setMounted(false);
          mountedRef.current = false;
          setProgress(0);
          setFading(false);
        }, 450);
      }, 280);
    }

    return clearTimers;
  }, [isLoading]);

  if (!mounted) return null;

  return (
    <div
      className={`h-[3px] overflow-hidden pointer-events-none ${className}`}
      style={{ transition: 'opacity 0.45s ease', opacity: fading ? 0 : 1 }}
      aria-hidden="true"
    >
      {/* Gradient progress track — scaleX is GPU-accelerated */}
      <motion.div
        className="h-full w-full origin-left"
        animate={{ scaleX: progress }}
        transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
        style={{
          background: 'linear-gradient(90deg, #448a7d 0%, #5ba898 52%, #e57c6e 100%)',
        }}
      />

      {/* Moving shimmer highlight that sweeps across the filled portion */}
      {isLoading && (
        <motion.div
          className="absolute top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
          }}
          animate={{ x: ['-80px', '100vw'] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 0.4,
          }}
        />
      )}
    </div>
  );
};

export default LoadingBar;
