import { Post, PostStatus, LocationSearchResult } from '../types.ts';
import { MOCK_POSTS, BANNED_PATTERNS } from '../constants.tsx';

/**
 * High-priority Canadian cities for instant, zero-latency suggestions.
 */
export const CANADIAN_HUBS = [
  { name: "Toronto", prov: "ON", pop: 2794356, lat: 43.6532, lng: -79.3832 },
  { name: "Montreal", prov: "QC", pop: 1762949, lat: 45.5017, lng: -73.5673 },
  { name: "Vancouver", prov: "BC", pop: 662248, lat: 49.2827, lng: -123.1207 },
  { name: "Calgary", prov: "AB", pop: 1306784, lat: 51.0447, lng: -114.0719 },
  { name: "Edmonton", prov: "AB", pop: 1010899, lat: 53.5461, lng: -113.4938 },
  { name: "Ottawa", prov: "ON", pop: 1017449, lat: 45.4215, lng: -75.6972 },
  { name: "Winnipeg", prov: "MB", pop: 749607, lat: 49.8951, lng: -97.1384 },
  { name: "Quebec City", prov: "QC", pop: 549459, lat: 46.8139, lng: -71.2082 },
  { name: "Hamilton", prov: "ON", pop: 569353, lat: 43.2557, lng: -79.8711 },
  { name: "London", prov: "ON", pop: 422324, lat: 42.9849, lng: -81.2453 },
  { name: "Victoria", prov: "BC", pop: 91861, lat: 48.4284, lng: -123.3656 },
  { name: "Halifax", prov: "NS", pop: 439819, lat: 44.6488, lng: -63.5752 },
];

/**
 * Haversine formula for calculating distance between two points in KM.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const apiService = {
  async getApprovedPosts(): Promise<Post[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const localApproved = JSON.parse(localStorage.getItem('starlings_approved') || '[]');
        resolve([...MOCK_POSTS, ...localApproved] as Post[]);
      }, 500);
    });
  },

  async submitPost(postData: Partial<Post>): Promise<{ success: boolean; flagged: boolean }> {
    let flagged = false;
    const combinedText = postData.message || '';
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(combinedText)) {
        flagged = true;
        break;
      }
    }
    const newPost: Post = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status: PostStatus.PENDING,
      country: postData.country || 'Unknown',
      city: postData.city || 'Unknown',
      lat: postData.lat || 0,
      lng: postData.lng || 0,
      message: combinedText,
      what_helped: postData.what_helped || [],
      flagged: flagged,
    } as Post;
    const pending = JSON.parse(localStorage.getItem('starlings_pending') || '[]');
    localStorage.setItem('starlings_pending', JSON.stringify([...pending, newPost]));
    return { success: true, flagged };
  },

  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return CANADIAN_HUBS
      .filter(hub => hub.name.toLowerCase().includes(q))
      .sort((a, b) => b.pop - a.pop)
      .slice(0, 5)
      .map(hub => ({
        display_name: `${hub.name}, ${hub.prov}, Canada`,
        lat: hub.lat.toString(),
        lon: hub.lng.toString(),
        address: { city: hub.name, country: 'Canada' }
      }));
  },

  async deepSearchLocation(query: string): Promise<LocationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 3) return [];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&countrycodes=ca&featuretype=settlement`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  }
};