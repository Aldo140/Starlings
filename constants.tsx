
import React from 'react';
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
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers (US/CAN)
  /kill myself/gi,
  /suicide/gi,
  /self-harm/gi,
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

export const MOCK_POSTS = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Toronto",
    lat: 43.6532,
    lng: -79.3832,
    message: "Building a consistent morning routine really helped my mental health. Remember, you don't have to carry the weight of the world all at once.",
    what_helped: ["Routine / hobbies", "Peer support"],
    flagged: false
  },
  {
    id: "2",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Vancouver",
    lat: 49.2827,
    lng: -123.1207,
    message: "Connecting with others who understand exactly what I'm going through changed everything. You are worthy of peace and support.",
    what_helped: ["Support group", "Trusted friend"],
    flagged: false
  },
  {
    id: "3",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Calgary",
    lat: 51.0447,
    lng: -114.0719,
    message: "Journaling my thoughts helped me process the harder days. It's okay to not be okay, but it's even better to reach out when you're ready.",
    what_helped: ["Routine / hobbies", "Boundaries"],
    flagged: false
  },
  {
    id: "4",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Montreal",
    lat: 45.5017,
    lng: -73.5673,
    message: "Therapy gave me the tools to navigate my family situation. Asking for help is the bravest thing you can do.",
    what_helped: ["Therapy", "Boundaries"],
    flagged: false
  },
  {
    id: "5",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Halifax",
    lat: 44.6488,
    lng: -63.5752,
    message: "Talking to my school counsellor made me realize my voice matters. You are not alone in this journey.",
    what_helped: ["School counsellor", "Peer support"],
    flagged: false
  }
];
