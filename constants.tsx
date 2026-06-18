import React from 'react';
import { Resource, ResourceType, PostStatus } from './types.ts';
import {
  Heart,
  MapPin,
  ShieldCheck,
  Users,
  MessageCircle,
  Info,
  AlertCircle,
  Menu,
  X,
  Plus,
  ArrowRight,
  Filter,
  Search,
  Navigation
} from 'lucide-react';

/** Signature easing curve — Expo Out. Use for all entrance reveals. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** CSS string form for use in `transitionTimingFunction` inline styles. */
export const EASE_OUT_EXPO_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const COLORS = {
  teal900: '#1e3a34',
  teal700: '#2d5a52',
  teal500: '#448a7d',
  mint: '#e8f3f1',
  sky500: '#6c949f',
  coral400: '#e57c6e',
  coral200: '#fbd6d1',
  ink900: '#0f172a',
  surface: '#ffffff',
  surfaceMuted: '#f9fbfa',
};

export const ICONS = {
  Heart: <Heart className="w-5 h-5" />,
  MapPin: <MapPin className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  MessageCircle: <MessageCircle className="w-5 h-5" />,
  Info: <Info className="w-5 h-5" />,
  AlertCircle: <AlertCircle className="w-5 h-5 text-red-500" />,
  Menu: <Menu className="w-6 h-6" />,
  X: <X className="w-6 h-6" />,
  Plus: <Plus className="w-5 h-5" />,
  ArrowRight: <ArrowRight className="w-5 h-5" />,
  Filter: <Filter className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Navigation: <Navigation className="w-5 h-5" />,
};

export const BANNED_PATTERNS = [
  /https?:\/\/\S+/gi, // URLs
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Emails
  /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // Phone numbers (US/CAN)
  /\b(?:suicide|kill myself|hurt myself|end my life|die|self harm|self-harm|cut myself|overdose|OD)\b/gi // Crisis keywords
];

export const HELP_OPTIONS = [
  "Peer support",
  "Therapy",
  "School counsellor",
  "Trusted friend",
  "Routine / hobbies",
  "Boundaries",
  "Support group",
  "Other"
];


export const SEED_RESOURCES: Resource[] = [
  {
    id: "starlings_ca",
    timestamp: new Date().toISOString(),
    status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE,
    title: "Starlings Community",
    url: "https://www.starlings.ca/",
    description: "Support for youth impacted by parental substance use through caregiver supports, youth leadership, and peer connection.",
    category: 'general',
    imageUrl: `${import.meta.env.BASE_URL}images/starlingsWebsite.webp`,
  },
  {
    id: "kickstand_connect",
    timestamp: new Date().toISOString(),
    status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE,
    title: "Kickstand Connect",
    url: "https://mykickstand.ca/connect/",
    description: "A youth-focused virtual clinic and support hub connecting young people with mental health, substance use, peer support, and wellness services.",
    category: 'general',
    imageUrl: `${import.meta.env.BASE_URL}images/partners/kickstand.webp`,
  },
  {
    id: "usay",
    timestamp: new Date().toISOString(),
    status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE,
    title: "Urban Society for Aboriginal Youth",
    url: "https://usay.ca/",
    description: "Calgary-based programs and resources supporting Indigenous youth through culture, connection, learning, and community.",
    category: 'general',
    imageUrl: `${import.meta.env.BASE_URL}images/partners/usay.webp`,
  },
  {
    id: "roots_of_hope_laronge",
    timestamp: new Date().toISOString(),
    status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE,
    title: "Roots of Hope La Ronge",
    url: "https://www.rootsofhope.ca/",
    description: "A community-led suicide prevention and life promotion initiative focused on hope, connection, and locally grounded support.",
    category: 'general',
    imageUrl: `${import.meta.env.BASE_URL}images/partners/roots-of-hope.webp`,
  },
];
