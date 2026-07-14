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

// ────────────────────────────────────────────────────────────────────────
// Answer auto-formatter
// ────────────────────────────────────────────────────────────────────────
// Community answers are typed as flowing prose into a spreadsheet cell, but
// often *contain* real structure — "1. ... 2. ... 3. ..." style steps, or
// "• ... • ..." bullets — that gets flattened into one dense paragraph once
// rendered flat. This detects that structure from the raw text (whether or
// not the source actually has line breaks) and reflows it into proper
// lists, so peer answers read like something a person took care to write,
// not a wall of text. Detection is intentionally conservative — it only
// acts on unambiguous signals (bullet glyphs, a "1." sequence starting at
// 1, or ≥2 short "Label: advice" clauses) so normal prose is never touched.

export type AnswerBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'ordered'; items: string[] }
  | { type: 'unordered'; items: string[] }
  | { type: 'labeled'; items: { label: string; text: string }[] }
  | { type: 'attribution'; text: string };

/** Splits `text` into sentences, keeping the terminating punctuation. */
const splitSentences = (text: string): string[] => {
  const matches = text.match(/[^.?!]+[.?!]+(?:\s+|$)/g);
  return matches ? matches.map(s => s.trim()).filter(Boolean) : [];
};

/**
 * A list's last item can run on into unrelated closing prose that was never
 * meant to be part of the list (e.g. "...stay safe? You can also talk to a
 * trusted adult..."). If the last item is made of several sentences and its
 * first sentence is roughly the same size as its siblings, peel the rest
 * off into trailing paragraph text instead of stretching the list.
 */
const splitTrailingProseFromLastItem = (items: string[]): { items: string[]; trailing: string | null } => {
  if (items.length === 0) return { items, trailing: null };
  const last = items[items.length - 1];
  const sentences = splitSentences(last);
  if (sentences.length < 2) return { items, trailing: null };

  const others = items.slice(0, -1);
  const avgOtherLen = others.length > 0
    ? others.reduce((sum, s) => sum + s.length, 0) / others.length
    : sentences[0].length;
  const firstSentence = sentences[0];

  if (firstSentence.length <= avgOtherLen * 2.5 + 40) {
    const trailing = sentences.slice(1).join(' ').trim();
    return { items: [...others, firstSentence], trailing: trailing || null };
  }
  return { items, trailing: null };
};

/** Bulleted list — "•" is an unambiguous marker, so ≥2 occurrences is enough. */
const detectBulletList = (paragraph: string): AnswerBlock[] | null => {
  const bulletCount = (paragraph.match(/•/g) || []).length;
  if (bulletCount < 2) return null;

  const [lead, ...rawItems] = paragraph.split('•').map(s => s.trim()).filter(Boolean);
  const { items, trailing } = splitTrailingProseFromLastItem(rawItems);

  const blocks: AnswerBlock[] = [];
  if (lead) blocks.push({ type: 'paragraph', text: lead });
  blocks.push({ type: 'unordered', items });
  if (trailing) blocks.push({ type: 'paragraph', text: trailing });
  return blocks;
};

/** Numbered list — requires a strictly sequential "1. 2. 3. ..." run. */
const detectNumberedList = (paragraph: string): AnswerBlock[] | null => {
  const markers = [...paragraph.matchAll(/(?:^|\s)(\d{1,2})\.\s+/g)];
  if (markers.length < 2) return null;

  const numbers = markers.map(m => parseInt(m[1], 10));
  const isSequential = numbers.every((n, i) => (i === 0 ? n === 1 : n === numbers[i - 1] + 1));
  if (!isSequential) return null;

  const lead = paragraph.slice(0, markers[0].index ?? 0).trim();
  const rawItems = markers.map((marker, i) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : paragraph.length;
    return paragraph.slice(start, end).trim();
  });
  const { items, trailing } = splitTrailingProseFromLastItem(rawItems);

  const blocks: AnswerBlock[] = [];
  if (lead) blocks.push({ type: 'paragraph', text: lead });
  blocks.push({ type: 'ordered', items });
  if (trailing) blocks.push({ type: 'paragraph', text: trailing });
  return blocks;
};

/**
 * "Label: advice" clauses — e.g. "If noise keeps you awake: try earplugs."
 * Requires ≥2 short (≤60 char), colon-terminated clauses sitting at a
 * sentence boundary (start of paragraph, or right after ". " / ": ") so a
 * single incidental "Note: ..." elsewhere in the text never triggers this.
 */
const detectLabeledList = (paragraph: string): AnswerBlock[] | null => {
  const labelRegex = /(?<=^|[.:]\s)([A-Z][^.:?!]{2,60}):\s+/g;
  const markers = [...paragraph.matchAll(labelRegex)];
  if (markers.length < 2) return null;

  let lead = paragraph.slice(0, markers[0].index ?? 0).trim();
  let rawItems = markers.map((marker, i) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : paragraph.length;
    return { label: marker[1].trim(), text: paragraph.slice(start, end).trim() };
  });

  // A marker sitting immediately before the next marker (no text between
  // them) is an intro phrase glued onto the real list, not an item itself —
  // e.g. "Here are some suggestions: If you stay awake because you're
  // worried: Keep a notebook...". Fold it back into the lead paragraph.
  while (rawItems.length > 0 && rawItems[0].text === '') {
    lead = `${lead} ${rawItems[0].label}:`.trim();
    rawItems = rawItems.slice(1);
  }
  if (rawItems.length < 2) return null;

  const { items: trimmedTexts, trailing } = splitTrailingProseFromLastItem(rawItems.map(r => r.text));
  const items = rawItems.map((r, i) => ({ label: r.label, text: trimmedTexts[i] }));

  const blocks: AnswerBlock[] = [];
  if (lead) blocks.push({ type: 'paragraph', text: lead });
  blocks.push({ type: 'labeled', items });
  if (trailing) blocks.push({ type: 'paragraph', text: trailing });
  return blocks;
};

const splitParagraphIntoBlocks = (paragraph: string): AnswerBlock[] => {
  if (!paragraph) return [];
  return (
    detectBulletList(paragraph) ??
    detectNumberedList(paragraph) ??
    detectLabeledList(paragraph) ??
    [{ type: 'paragraph', text: paragraph }]
  );
};

/** Parses a raw answer string into structured blocks — the public entry point. */
export const parseAnswerBlocks = (raw: string): AnswerBlock[] => {
  if (!raw) return [];
  let text = raw.trim();

  // Peel off a trailing "Written by: ..." attribution line so it renders
  // as a byline, not as the tail end of the last paragraph or list item.
  let attribution: string | null = null;
  const attributionMatch = text.match(/\s*(?:—|-)\s*Written by:\s*(.+)$|(?:^|\s)Written by:\s*(.+)$/i);
  if (attributionMatch) {
    attribution = (attributionMatch[1] ?? attributionMatch[2] ?? '').trim();
    text = text.slice(0, attributionMatch.index).trim();
  }

  const blocks = text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .flatMap(splitParagraphIntoBlocks);

  if (attribution) blocks.push({ type: 'attribution', text: attribution });
  return blocks;
};

// ── Inline rendering: auto-linkify bare URLs inside any block's text ──────

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Peels accidental trailing prose off a URL — sheet content sometimes runs
 * "...page.The good news is..." together with no space after the link, or
 * a URL sits at the end of a sentence with the period glued to it. Neither
 * belongs in the href.
 */
const trimUrlTail = (url: string): { href: string; suffix: string } => {
  const gluedWord = url.match(/^(.*?)(\.[A-Z][a-z].*)$/);
  if (gluedWord) return { href: gluedWord[1], suffix: gluedWord[2] };
  const trailingPunct = url.match(/^(.*[^.,!?;:])([.,!?;:]+)$/);
  if (trailingPunct) return { href: trailingPunct[1], suffix: trailingPunct[2] };
  return { href: url, suffix: '' };
};

const renderInline = (text: string, keyPrefix: string): React.ReactNode => {
  const parts = text.split(URL_REGEX);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const { href, suffix } = trimUrlTail(part);
      return (
        <React.Fragment key={`${keyPrefix}-u${i}`}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#448a7d] underline decoration-[#448a7d]/40 hover:decoration-[#448a7d] underline-offset-2 break-words"
          >
            {href}
          </a>
          {suffix}
        </React.Fragment>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>;
  });
};

/** Renders a parsed answer with real lists, labeled steps, links, and a byline. */
export const FormattedAnswer: React.FC<{ text: string }> = ({ text }) => {
  const blocks = parseAnswerBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const key = `block-${i}`;
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={key} className="text-[#1e3a34]/65 text-xs md:text-[13px] leading-relaxed">
                {renderInline(block.text, key)}
              </p>
            );
          case 'ordered':
            return (
              <ol key={key} className="space-y-1.5">
                {block.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[#448a7d]/12 text-[#448a7d] text-[9px] font-black flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="text-[#1e3a34]/65 text-xs md:text-[13px] leading-relaxed">
                      {renderInline(item, `${key}-${idx}`)}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case 'unordered':
            return (
              <ul key={key} className="space-y-1.5">
                {block.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#448a7d]/50" />
                    <span className="text-[#1e3a34]/65 text-xs md:text-[13px] leading-relaxed">
                      {renderInline(item, `${key}-${idx}`)}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'labeled':
            return (
              <div key={key} className="space-y-1.5 border-l-2 border-[#448a7d]/15 pl-3">
                {block.items.map((item, idx) => (
                  <p key={idx} className="text-[#1e3a34]/65 text-xs md:text-[13px] leading-relaxed">
                    <span className="font-bold text-[#1e3a34]/85">{item.label}:</span>{' '}
                    {renderInline(item.text, `${key}-${idx}`)}
                  </p>
                ))}
              </div>
            );
          case 'attribution':
            return (
              <p key={key} className="pt-1.5 text-[10px] font-bold italic text-[#448a7d]/70">
                — {block.text}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
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
            <FormattedAnswer text={item.answer || ''} />
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
