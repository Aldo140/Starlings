import React from 'react';
import { motion } from 'framer-motion';

const MURMURATION_BIRDS: [number, number, number][] = [
  [52, 178, -25], [68, 167, -20], [85, 158, -15],
  [102, 150, -9], [118, 146, -3], [134, 148, 4],
  [148, 155, 11], [160, 166, 17], [168, 180, 22],
  [62, 128, -22], [79, 118, -16], [96, 110, -9],
  [114, 106, -2], [130, 108, 6], [145, 116, 13],
  [157, 128, 19], [80, 82, -18], [97, 74, -10],
  [114, 70, -1], [130, 73, 8], [145, 82, 15],
  [42, 102, -28], [178, 98, 28], [108, 50, -2],
  [38, 150, -30], [184, 162, 28], [65, 54, -20], [155, 48, 18],
];

const MURMURATION_STARS: [number, number][] = [
  [35, 45], [180, 35], [196, 80], [25, 90],
  [108, 28], [165, 58], [48, 178],
];

export type IllustrationVariant = 'envelope' | 'hands' | 'pin' | 'murmuration';

const CardIllustration: React.FC<{ variant: IllustrationVariant; animated?: boolean }> = ({ variant, animated = true }) => {
  const svgBase = {
    viewBox: '0 0 220 220' as const,
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    className: 'w-full h-full max-w-[175px] max-h-[175px]',
    'aria-hidden': true as const,
  };

  return (
    <motion.div
      className="flex items-center justify-center w-full h-full p-3 md:p-8"
      animate={animated ? { scale: [1, 1.03, 1] } : undefined}
      transition={animated ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {variant === 'envelope' && (
        <svg {...svgBase}>
          {/* Envelope body */}
          <rect x="28" y="88" width="164" height="105" rx="5" stroke="#448a7d" strokeWidth="1.8"/>
          {/* Inner V crease */}
          <path d="M28 88 L110 136 L192 88" stroke="#448a7d" strokeWidth="1.4" opacity="0.65"/>
          {/* Open flap */}
          <path d="M28 88 C28 52 66 36 110 47 C154 36 192 52 192 88"
            stroke="#1e3a34" strokeWidth="1.8" fill="rgba(30,58,52,0.04)"/>
          {/* Wax seal */}
          <circle cx="110" cy="168" r="12" stroke="#1e3a34" strokeWidth="1.5" fill="rgba(68,138,125,0.10)"/>
          <circle cx="110" cy="168" r="7"  stroke="#1e3a34" strokeWidth="1"   fill="rgba(68,138,125,0.14)"/>
          {/* Central stem */}
          <line x1="110" y1="135" x2="110" y2="62" stroke="#1e3a34" strokeWidth="1.2"/>
          {/* Side branch — left */}
          <path d="M110 105 C103 97 96 90 98 78" stroke="#1e3a34" strokeWidth="1" opacity="0.8"/>
          {/* Side branch — right */}
          <path d="M110 90 C117 82 124 77 122 65" stroke="#1e3a34" strokeWidth="1" opacity="0.8"/>
          {/* Leaf pair 1 */}
          <path d="M104 103 C94 92 90 78 98 68 C100 80 104 92 104 103Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          <path d="M116 90 C126 79 130 65 122 55 C120 67 116 79 116 90Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.12)"/>
          {/* Leaf pair 2 */}
          <path d="M108 72 C100 62 99 50 106 42 C107 52 108 62 108 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          <path d="M112 72 C120 62 121 50 114 42 C113 52 112 62 112 72Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.10)"/>
          {/* Top bud */}
          <path d="M110 56 C106 45 107 34 110 27 C113 34 114 45 110 56Z"
            stroke="#448a7d" strokeWidth="1.4" fill="rgba(68,138,125,0.16)"/>
        </svg>
      )}

      {variant === 'hands' && (
        <svg {...svgBase}>
          {/* Lens circle */}
          <circle cx="96" cy="96" r="58" stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.06)"/>
          {/* Inner lens ring */}
          <circle cx="96" cy="96" r="51" stroke="#448a7d" strokeWidth="0.7" opacity="0.3"/>
          {/* Handle */}
          <line x1="140" y1="140" x2="178" y2="178" stroke="#1e3a34" strokeWidth="4" strokeLinecap="round"/>
          <line x1="140" y1="140" x2="178" y2="178" stroke="#448a7d" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          {/* Stem inside lens */}
          <line x1="96" y1="146" x2="96" y2="56" stroke="#1e3a34" strokeWidth="1.4"/>
          {/* Lower leaf pair */}
          <path d="M96 120 C86 108 83 94 90 83 C93 95 96 108 96 120Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.14)"/>
          <path d="M96 120 C106 108 109 94 102 83 C99 95 96 108 96 120Z"
            stroke="#448a7d" strokeWidth="1.5" fill="rgba(68,138,125,0.14)"/>
          {/* Upper leaf pair */}
          <path d="M96 90 C89 81 88 70 94 63 C95 71 96 81 96 90Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
          <path d="M96 90 C103 81 104 70 98 63 C97 71 96 81 96 90Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.10)"/>
        </svg>
      )}

      {variant === 'pin' && (
        <svg {...svgBase}>
          {/* Pin body — large teardrop */}
          <path d="M56 92 C56 44 164 44 164 92 C164 126 136 154 110 184 C84 154 56 126 56 92 Z"
            stroke="#448a7d" strokeWidth="1.8" fill="rgba(68,138,125,0.08)"/>
          {/* Inner marker circle */}
          <circle cx="110" cy="90" r="22" stroke="#1e3a34" strokeWidth="1.5" fill="rgba(30,58,52,0.10)"/>
          {/* Inner marker dot */}
          <circle cx="110" cy="90" r="7" stroke="#448a7d" strokeWidth="1" fill="rgba(68,138,125,0.20)"/>
          {/* Small sprout at pin crown */}
          <line x1="110" y1="44" x2="110" y2="22" stroke="#1e3a34" strokeWidth="1.3"/>
          <path d="M110 36 C103 28 103 18 110 14 C110 22 110 30 110 36Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.14)"/>
          <path d="M110 36 C117 28 117 18 110 14 C110 22 110 30 110 36Z"
            stroke="#448a7d" strokeWidth="1.3" fill="rgba(68,138,125,0.14)"/>
        </svg>
      )}

      {variant === 'murmuration' && (
        <svg {...svgBase}>
          {MURMURATION_STARS.map(([cx, cy], i) => (
            <circle key={`s${i}`} cx={cx} cy={cy} r={1.8} fill="#448a7d" opacity={0.35}/>
          ))}
          {MURMURATION_BIRDS.map(([cx, cy, rotate], i) => (
            <path
              key={`b${i}`}
              d="M7,0 C4,-1 0,-4 -4,-5 C-7,-3 -7,0 -5,0 C-7,0 -7,3 -4,5 C0,4 4,1 7,0 Z"
              fill="#448a7d"
              opacity={0.3 + (i % 4) * 0.12}
              transform={`translate(${cx},${cy}) rotate(${rotate}) scale(${0.7 + (i % 3) * 0.2})`}
            />
          ))}
        </svg>
      )}
    </motion.div>
  );
};

export default CardIllustration;
