import { Post, PostStatus, LocationSearchResult, Resource, ResourceType } from '../types.ts';
import { MOCK_POSTS, BANNED_PATTERNS, MOCK_RESOURCES } from '../constants.tsx';

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

const GAS_URL = "https://script.google.com/macros/s/AKfycbwvjawoH1h5oij_-MfoPQBUFZtxFpvmHY3BOhCP5-zXDQoGmvpC2fajwiszsh5Escsa/exec";

// Cache management
const CACHE_KEY = 'starlings_approved_posts_v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

let inFlightRequest: Promise<Post[]> | null = null;

const getCachedPosts = (): { data: Post[], timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    if (age < CACHE_TTL) return parsed;
    // Cache expired, clear it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (e) {
    console.error('Error reading cache:', e);
    return null;
  }
};

const setCachedPosts = (posts: Post[]): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: posts,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error writing cache:', e);
  }
};

const getCachedResources = (): { data: Resource[], timestamp: number } | null => {
  try {
    const cached = localStorage.getItem('starlings_approved_resources_v2');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    if (age < CACHE_TTL) return parsed;
    localStorage.removeItem('starlings_approved_resources_v2');
    return null;
  } catch (e) {
    return null;
  }
};

const setCachedResources = (resources: Resource[]): void => {
  try {
    localStorage.setItem('starlings_approved_resources_v2', JSON.stringify({
      data: resources,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error writing resource cache:', e);
  }
};

// ----------------------------------------------------
// ANTI-ABUSE GUARDRAIL: Rate Limiter (Max 5 POSTs per 10s)
// ----------------------------------------------------
const actionHistory: number[] = [];
const checkRateLimit = (): boolean => {
  const now = Date.now();
  // Clear actions older than 10 seconds
  while (actionHistory.length > 0 && actionHistory[0] < now - 10000) {
    actionHistory.shift();
  }
  // Cap at 5 actions per 10 second window
  if (actionHistory.length >= 5) {
    return false; // Block actions
  }
  actionHistory.push(now);
  return true; // Allow actions
};

export const apiService = {
  generateAlias(): string {
    const adjectives = [
      "Quiet", "Brave", "Golden", "Soft", "True",
      "Bright", "Gentle", "Steady", "Kind", "Clear",
    ];
    const nouns = [
      "River", "Harbor", "Meadow", "Cedar", "Sparrow",
      "Lantern", "Willow", "Ember", "Prairie", "North",
    ];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${pick(adjectives)} ${pick(nouns)} ${suffix}`;
  },

  ensureAlias(post: Post): Post {
    if (post.alias && post.alias.trim()) return post;
    return { ...post, alias: apiService.generateAlias() };
  },

  async getApprovedPosts(skipCache?: boolean): Promise<Post[]> {
    // Return cached data immediately if valid (unless skipping cache for manual refresh or running locally)
    if (!skipCache && !isLocalhost) {
      const cached = getCachedPosts();
      if (cached) {
        return cached.data;
      }
    }

    // Deduplicate: if a request is already in flight, return that promise
    if (inFlightRequest) {
      return inFlightRequest;
    }

    // Make new request and cache the promise to prevent duplicate requests
    inFlightRequest = (async () => {
      try {
        const res = await fetch(`${GAS_URL}?action=getStories`);
        const data = await res.json();

        const approvedPosts = Array.isArray(data) ? data : [];
        const normalizedApproved = approvedPosts.map(p => {
          const post = apiService.ensureAlias(p) as Post;
          // Protect against users typing plaintext strings into the 'what_helped' tags column
          const rawTags: unknown = post.what_helped;
          if (typeof rawTags === 'string') {
            try {
              post.what_helped = JSON.parse(rawTags);
            } catch (e) {
              // If it's a comma separated string, split it, otherwise wrap it
              post.what_helped = rawTags.includes(',')
                ? rawTags.split(',').map((s: string) => s.trim())
                : [rawTags];
            }
          }
          if (!Array.isArray(post.what_helped)) {
            post.what_helped = [];
          }
          return post;
        });

        if (normalizedApproved.length > 0) {
          const uniquePostsMap = new Map<string, Post>();
          normalizedApproved.forEach(post => uniquePostsMap.set(post.id, post));

          // Inject MOCK_POSTS for demonstration purposes so the Map always has rich examples
          const fallback = MOCK_POSTS.map(apiService.ensureAlias) as Post[];
          fallback.forEach(mock => {
            if (!uniquePostsMap.has(mock.id)) {
              uniquePostsMap.set(mock.id, mock);
            }
          });

          const uniquePosts = Array.from(uniquePostsMap.values());
          const result = uniquePosts.map(apiService.ensureAlias) as Post[];
          setCachedPosts(result);
          return result;
        }

        // Fallback to mock posts
        const fallback = MOCK_POSTS.map(apiService.ensureAlias) as Post[];
        setCachedPosts(fallback);
        return fallback;
      } catch (error) {
        console.error("Error fetching approved posts from Google Sheets:", error);
        const fallback = MOCK_POSTS.map(apiService.ensureAlias) as Post[];
        setCachedPosts(fallback);
        return fallback;
      } finally {
        inFlightRequest = null;
      }
    })();

    return inFlightRequest;
  },

  async submitPost(postData: Partial<Post>): Promise<{ success: boolean; flagged: boolean }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: true, flagged: false }; // Silently drop, UI acts like success
    }

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
      alias: apiService.generateAlias(),
      flagged: flagged,
    } as Post;

    try {
      const payload = { ...newPost, action: "addStory" };
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      return { success: result.success, flagged: result.flagged !== undefined ? result.flagged : flagged };
    } catch (error) {
      console.error("Error submitting post, network issue detected:", error);
      apiService.queueOfflinePost(newPost);
      // Return success true so the UI thinks it succeeded and transitions to success state
      // The post is safely stored and will be synced later
      return { success: true, flagged };
    }
  },

  queueOfflinePost(post: Post): void {
    try {
      const queueStr = localStorage.getItem('starlings_sync_queue');
      const queue: Post[] = queueStr ? JSON.parse(queueStr) : [];
      queue.push(post);
      localStorage.setItem('starlings_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to queue post offline", e);
    }
  },

  async syncOfflinePosts(): Promise<void> {
    try {
      const queueStr = localStorage.getItem('starlings_sync_queue');
      if (!queueStr) return;

      let queue: Post[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`Attempting to sync ${queue.length} offline posts...`);
      const remainingQueue: Post[] = [];

      for (const post of queue) {
        try {
          const payload = { ...post, action: "addStory" };
          const res = await fetch(GAS_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
          });
          const result = await res.json();
          if (!result.success) {
            console.error("Failed to sync post with server:", result);
            remainingQueue.push(post);
          }
        } catch (error) {
          console.error("Network still unavailable, keeping post in queue", error);
          remainingQueue.push(post);
        }
      }

      if (remainingQueue.length === 0) {
        localStorage.removeItem('starlings_sync_queue');
        console.log("All offline posts synced successfully.");
      } else {
        localStorage.setItem('starlings_sync_queue', JSON.stringify(remainingQueue));
        console.log(`${remainingQueue.length} posts remain in offline queue.`);
      }
    } catch (e) {
      console.error("Error syncing offline posts", e);
    }
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
  },

  async getApprovedResources(skipCache?: boolean): Promise<Resource[]> {
    const cached = getCachedResources();
    if (cached && !skipCache && !isLocalhost) {
      // Fire and forget background sync
      (async () => {
        try {
          const res = await fetch(`${GAS_URL}?action=getResources`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedData: Resource[] = data.map(r => ({
              ...r,
              type: r.resource_type || r.type,
              imageUrl: r.image_url || r.imageUrl,
              submitterEmail: r.submitter_email || r.submitterEmail,
              category: 'community', // FORCE to community accordion
            }));
            const unique = new Map<string, Resource>();
            // Put mappedData in FIRST, then inject mocks if they don't overwrite
            mappedData.forEach(r => unique.set(r.id, r));
            MOCK_RESOURCES.forEach(m => {
              if (!unique.has(m.id)) unique.set(m.id, m as Resource);
            });
            setCachedResources(Array.from(unique.values()));
          }
        } catch (e) { }
      })();
      return cached.data;
    }

    try {
      console.log("Fetching live resources from Google Sheets...");
      const res = await fetch(`${GAS_URL}?action=getResources`);
      const data = await res.json();
      console.log("RAW GOOGLE SHEETS payload:", data);

      if (Array.isArray(data) && data.length > 0) {
        const mappedData: Resource[] = data.map(r => ({
          ...r,
          type: r.resource_type || r.type,
          imageUrl: r.image_url || r.imageUrl,
          submitterEmail: r.submitter_email || r.submitterEmail,
          category: 'community', // FORCE to community accordion
        }));

        // Put Live Google Sheets data in FIRST entirely!
        const finalArr = [...mappedData];

        // Then append mock data ONLY if ID doesn't already exist
        MOCK_RESOURCES.forEach(m => {
          if (!finalArr.find(r => r.id === m.id)) {
            finalArr.push(m as Resource);
          }
        });

        console.log("Mapped Final Resources Array:", finalArr);
        setCachedResources(finalArr);
        return finalArr;
      }
      setCachedResources(MOCK_RESOURCES as Resource[]);
      return MOCK_RESOURCES as Resource[];
    } catch (err) {
      console.error("Failed to fetch Live_Resources:", err);
      return MOCK_RESOURCES as Resource[];
    }
  },

  async submitResource(resourceData: Partial<Resource>): Promise<{ success: boolean }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: true };
    }

    const payload = {
      action: "addResource",
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status: PostStatus.PENDING,
      resource_type: resourceData.type || ResourceType.WEBSITE,
      title: resourceData.title || '',
      url: resourceData.url || '',
      description: resourceData.description || '',
      alias: resourceData.alias || '',
      submitterEmail: resourceData.submitterEmail || '',
      qualifications: resourceData.qualifications || '',
      city: 'Unknown'
    };

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      return { success: result.success };
    } catch (e) {
      console.error(e);
      return { success: true }; // Optimistic fail
    }
  },

  async submitQuestion(question: string): Promise<{ success: boolean; flagged: boolean }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: true, flagged: false };
    }

    let flagged = false;
    const qLower = question.toLowerCase();
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(question)) {
        flagged = true;
        break;
      }
    }
    const FLAGGED_WORDS = ['spam', 'abuse', 'slur', 'hate', 'suicide', 'self-harm'];
    if (FLAGGED_WORDS.some(w => qLower.includes(w))) {
      flagged = true;
    }

    const payload = {
      action: "addQA",
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status: "PENDING",
      question,
      flagged
    };

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      return { success: result.success, flagged: result.flagged !== undefined ? result.flagged : flagged };
    } catch (e) {
      console.error(e);
      return { success: true, flagged };
    }
  },

  async incrementInsight(resourceId: string, reactionType: 'helpful' | 'supportive' | 'exploring'): Promise<{ success: boolean }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: true }; // Predict true so UI doesn't crash, but it won't persist to GS
    }

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "incrementInsight", resourceId, reactionType })
      });
      const result = await res.json();
      return { success: result.success };
    } catch (e) {
      console.error("Failed to increment insight", e);
      return { success: false };
    }
  }
};
