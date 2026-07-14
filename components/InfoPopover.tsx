import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { EASE_OUT_EXPO } from '../constants.tsx';

/**
 * Small "i" info affordance — opens on hover for mouse users, and on tap for
 * touch users (no hover event exists there), via a single click-to-toggle
 * handler layered under hover handlers. Closes on outside click/tap or Escape.
 * Shared across any form field that needs a short "how do I get this?" tip
 * (e.g. resource/reflection image links) — don't duplicate this per-view.
 */
const InfoPopover: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e: MouseEvent | TouchEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <span
            ref={wrapperRef}
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-label={label}
                aria-expanded={open}
                className="flex-shrink-0 w-4 h-4 rounded-full bg-[#e8f3f1] text-[#448a7d] flex items-center justify-center hover:bg-[#448a7d] hover:text-white transition-colors"
            >
                <Info className="w-2.5 h-2.5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                        className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-60 max-w-[80vw] p-3.5 rounded-xl bg-[#1e3a34] text-white text-[11px] font-medium leading-relaxed shadow-[0_18px_40px_-14px_rgba(30,58,52,0.55)]"
                        role="tooltip"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};

export default InfoPopover;
