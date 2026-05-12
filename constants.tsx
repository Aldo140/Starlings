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
  // --- BOOKS ---
  {
    id: 'ex_book_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.BOOK, category: 'community', isExample: true,
    title: 'Example Book Resource',
    url: '#',
    description: 'Sample entry. Peer-recommended books will appear here once submitted and approved through the backend.',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ex_book_2', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.BOOK, category: 'community', isExample: true,
    title: 'Example Book — Lived Experience',
    url: '#',
    description: 'Sample entry. This spot is reserved for a real peer-recommended book.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
  },
  // --- PODCASTS ---
  {
    id: 'ex_podcast_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.PODCAST, category: 'community', isExample: true,
    title: 'Example Podcast Resource',
    url: '#',
    description: 'Sample entry. Community-recommended podcasts will appear here after review.',
  },
  {
    id: 'ex_podcast_2', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.PODCAST, category: 'community', isExample: true,
    title: 'Example Podcast — Healing & Recovery',
    url: '#',
    description: 'Sample entry. Add your podcast recommendations through the form.',
  },
  // --- SONGS ---
  {
    id: 'ex_song_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.SONG, category: 'community', isExample: true,
    title: 'Example Song — Comfort & Connection',
    url: '#',
    description: 'Sample entry. Songs that help the community will appear here once added.',
  },
  {
    id: 'ex_song_2', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.SONG, category: 'community', isExample: true,
    title: 'Example Song — Shared Playlist',
    url: '#',
    description: 'Sample entry. Share songs that have helped you on your journey.',
  },
  // --- SOCIAL MEDIA ---
  {
    id: 'ex_social_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.SOCIAL_MEDIA, category: 'community', isExample: true,
    title: 'Example Social Account',
    url: '#',
    description: 'Sample entry. Peer-recommended social accounts will appear here after review.',
  },
  // --- WEBSITES ---
  {
    id: 'ex_web_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE, category: 'community', isExample: true,
    title: 'Example Website Resource',
    url: '#',
    description: 'Sample entry. Community-recommended websites will appear here after review.',
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ex_web_2', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE, category: 'community', isExample: true,
    title: 'Example Online Support Tool',
    url: '#',
    description: 'Sample entry. Add resources through the recommendation form.',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
  },
  // --- MEMES / IMAGES ---
  {
    id: 'ex_meme_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.MEME, category: 'community', isExample: true,
    title: 'Example Image or Meme',
    url: '',
    description: 'Sample entry. Community images and memes will appear here once added.',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800'
  },
  // --- COMMUNITY PARTNERS (category: general) ---
  {
    id: 'ex_general_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE, category: 'general', isExample: true,
    title: 'Example Community Partner A',
    url: '#',
    description: 'Sample partner entry. Starlings-trained community organizations will be listed here once verified.',
    location: 'Calgary, AB',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ex_general_2', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE, category: 'general', isExample: true,
    title: 'Example Community Partner B',
    url: '#',
    description: 'Sample partner entry. This spot is reserved for a verified community organization.',
    location: 'Edmonton, AB',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'
  },
  // --- ALIGNED PARTNERS (category: partner) ---
  {
    id: 'ex_aligned_1', timestamp: new Date().toISOString(), status: PostStatus.APPROVED,
    type: ResourceType.WEBSITE, category: 'partner', isExample: true,
    title: 'Example Aligned Organization',
    url: '#',
    description: 'Sample entry. Organizations reviewed by Starlings will be listed here. Inclusion does not imply endorsement.',
    location: 'Alberta',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800'
  },
];
