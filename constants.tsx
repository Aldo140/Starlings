import React from 'react';
import { Post, Resource, ResourceType, PostStatus } from './types.ts';
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

export const SEED_POSTS: Post[] = [];

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
    imageUrl: `${import.meta.env.BASE_URL}images/starlingsWebsite.png`,
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
  },
];
