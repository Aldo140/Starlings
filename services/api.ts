
import { Post, PostStatus, LocationSearchResult } from '../types';
import { MOCK_POSTS, BANNED_PATTERNS } from '../constants';

/**
 * High-priority Canadian cities for instant, zero-latency suggestions.
 * This ensures common searches like "Toronto", "Vancouver", or "High River" 
 * feel instantaneous even on slow networks.
 */
const CANADIAN_HUBS = [
  { name: "Toronto", prov: "ON", pop: 2794356, lat: 43.6532, lng: -79.3832 },
  { name: "Montreal", prov: "QC", pop: 1762949, lat: 45.5017, lng: -73.5673 },
  { name: "Vancouver", prov: "BC", pop: 662248, lat: 49.2827, lng: -123.1207 },
  { name: "Calgary", prov: "AB", pop: 1306784, lat: 51.0447, lng: -114.0719 },
  { name: "Edmonton", prov: "AB", pop: 1010899, lat: 53.5461, lng: -113.4938 },
  { name: "Ottawa", prov: "ON", pop: 1017449, lat: 45.4215, lng: -75.6972 },
  { name: "Winnipeg", prov: "MB", pop: 749607, lat: 49.8951, lng: -97.1384 },
  { name: "Quebec City", prov: "QC", pop: 549459, lat: 46.8139, lng: -71.2082 },
  { name: "Hamilton", prov: "ON", pop: 569353, lat: 43.2557, lng: -79.8711 },
  { name: "Kitchener", prov: "ON", pop: 256885, lat: 43.4516, lng: -80.4925 },
  { name: "London", prov: "ON", pop: 422324, lat: 42.9849, lng: -81.2453 },
  { name: "Victoria", prov: "BC", pop: 91861, lat: 48.4284, lng: -123.3656 },
  { name: "Halifax", prov: "NS", pop: 439819, lat: 44.6488, lng: -63.5752 },
  { name: "Oshawa", prov: "ON", pop: 175383, lat: 43.8971, lng: -78.8658 },
  { name: "Windsor", prov: "ON", pop: 229660, lat: 42.3149, lng: -83.0364 },
  { name: "Saskatoon", prov: "SK", pop: 266141, lat: 52.1332, lng: -106.6700 },
  { name: "Regina", prov: "SK", pop: 226403, lat: 50.4452, lng: -104.6189 },
  { name: "St. John's", prov: "NL", pop: 110525, lat: 47.5615, lng: -52.7126 },
  { name: "Kelowna", prov: "BC", pop: 142146, lat: 49.8871, lng: -119.4960 },
  { name: "Barrie", prov: "ON", pop: 147829, lat: 44.3894, lng: -79.6903 },
  { name: "Sherbrooke", prov: "QC", pop: 172985, lat: 45.4010, lng: -71.8922 },
  { name: "Guelph", prov: "ON", pop: 135474, lat: 43.5448, lng: -80.2482 },
  { name: "Abbotsford", prov: "BC", pop: 141397, lat: 49.0504, lng: -122.3045 },
  { name: "Kingston", prov: "ON", pop: 132485, lat: 44.2312, lng: -76.4860 },
  { name: "High River", prov: "AB", pop: 13584, lat: 50.5806, lng: -113.8745 },
  { name: "High Prairie", prov: "AB", pop: 2564, lat: 55.4334, lng: -116.4842 },
  { name: "Red Deer", prov: "AB", pop: 100844, lat: 52.2690, lng: -113.8116 },
  { name: "Lethbridge", prov: "AB", pop: 98406, lat: 49.6956, lng: -112.8451 },
  { name: "Nanaimo", prov: "BC", pop: 99863, lat: 49.1659, lng: -123.9401 },
  { name: "Kamloops", prov: "BC", pop: 97902, lat: 50.6745, lng: -120.3273 },
  { name: "Prince George", prov: "BC", pop: 74003, lat: 53.9171, lng: -122.7497 },
  { name: "Moncton", prov: "NB", pop: 71889, lat: 46.0878, lng: -64.7782 },
  { name: "Saint John", prov: "NB", pop: 67575, lat: 45.2733, lng: -66.0633 },
  { name: "Fredericton", prov: "NB", pop: 58220, lat: 45.9636, lng: -66.6431 },
  { name: "Charlottetown", prov: "PE", pop: 36094, lat: 46.2382, lng: -63.1311 },
  { name: "Whitehorse", prov: "YT", pop: 25085, lat: 60.7212, lng: -135.0568 },
  { name: "Yellowknife", prov: "NT", pop: 19563, lat: 62.4540, lng: -114.3718 },
  { name: "Iqaluit", prov: "NU", pop: 7740, lat: 63.7467, lng: -68.5170 },
];

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
      ...postData
    };

    const pending = JSON.parse(localStorage.getItem('starlings_pending') || '[]');
    localStorage.setItem('starlings_pending', JSON.stringify([...pending, newPost]));
    return { success: true, flagged };
  },

  /**
   * Hybrid Geocoding: Local Index + Global OSM API
   */
  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

    // 1. Instant Local Match (Smart Autocomplete)
    const localMatches: LocationSearchResult[] = CANADIAN_HUBS
      .filter(hub => hub.name.toLowerCase().includes(q))
      .sort((a, b) => {
        // Boost exact starts
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        // Then sort by population
        return b.pop - a.pop;
      })
      .slice(0, 5)
      .map(hub => ({
        display_name: `${hub.name}, ${hub.prov}, Canada`,
        lat: hub.lat.toString(),
        lon: hub.lng.toString(),
        address: { city: hub.name, country: 'Canada' }
      }));

    // If we have strong local matches, return them immediately for perceived speed
    // The UI will still trigger a background API fetch for smaller/niche towns
    return localMatches;
  },

  /**
   * Deep search using Nominatim for niche towns not in the local index
   */
  async deepSearchLocation(query: string): Promise<LocationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 3) return [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Tighten query: search in Canada only, specific to city/town types to reduce payload
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&countrycodes=ca&featuretype=settlement`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    } catch {
      return [];
    }
  }
};
