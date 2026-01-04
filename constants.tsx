
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
    alias: "Quiet North",
    flagged: false
  },
  {
    id: "1b",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Toronto",
    lat: 43.6532,
    lng: -79.3832,
    message: "Peer support groups reminded me I wasn't alone. If you can, lean on the people who show up for you.",
    what_helped: ["Peer support", "Support group"],
    alias: "Harbor Finch",
    flagged: false
  },
  {
    id: "1c",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Toronto",
    lat: 43.6532,
    lng: -79.3832,
    message: "A trusted friend helped me keep going on the hard days. You deserve people who listen.",
    what_helped: ["Trusted friend", "Boundaries"],
    alias: "River Ember",
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
    alias: "Rain Glass",
    flagged: false
  },
  {
    id: "2b",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Vancouver",
    lat: 49.2827,
    lng: -123.1207,
    message: "Therapy and small routines helped me build steadier days. You deserve care that fits you.",
    what_helped: ["Therapy", "Routine / hobbies"],
    alias: "Sky Cedar",
    flagged: false
  },
  {
    id: "2c",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Vancouver",
    lat: 49.2827,
    lng: -123.1207,
    message: "A school counsellor helped me find words for what I was feeling. It's okay to ask for help.",
    what_helped: ["School counsellor"],
    alias: "Harbor Mist",
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
    alias: "Prairie Leaf",
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
    alias: "Blue Lantern",
    flagged: false
  },
  {
    id: "4b",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Montreal",
    lat: 45.5017,
    lng: -73.5673,
    message: "A support group gave me a place to be honest. You are not alone in this.",
    what_helped: ["Support group", "Peer support"],
    alias: "Stone Maple",
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
    alias: "Harbor Pine",
    flagged: false
  },
  {
    id: "5b",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Halifax",
    lat: 44.6488,
    lng: -63.5752,
    message: "Routine and hobbies gave my days structure again. Little steps still count.",
    what_helped: ["Routine / hobbies"],
    alias: "Salt Glow",
    flagged: false
  },
  {
    id: "6",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Montreal",
    lat: 45.5017,
    lng: -73.5673,
    message: "Setting boundaries with family and leaning on a trusted friend gave me space to breathe.",
    what_helped: ["Trusted friend", "Boundaries"],
    alias: "Quiet Bloom",
    flagged: false
  },
  {
    id: "7",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Calgary",
    lat: 51.0447,
    lng: -114.0719,
    message: "Peer support and therapy helped me rebuild trust in myself. You are stronger than you feel.",
    what_helped: ["Peer support", "Therapy"],
    alias: "Prairie Star",
    flagged: false
  },
  {
    id: "7b",
    timestamp: new Date().toISOString(),
    status: "approved",
    country: "Canada",
    city: "Calgary",
    lat: 51.0447,
    lng: -114.0719,
    message: "A trusted friend and clear boundaries helped me feel safe again.",
    what_helped: ["Trusted friend", "Boundaries"],
    alias: "Amber Ridge",
    flagged: false
  }
];
