import { Post, PostStatus, LocationSearchResult, Resource, ResourceType, QAItem } from '../types.ts';
import { BANNED_PATTERNS, SEED_RESOURCES } from '../constants.tsx';

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
const EXPECTED_SPREADSHEET_ID = "18Vzy15shBjz0u3ei0n_eLSmMONplb66rC5XvDLyExXM";

// Cache management
const CACHE_KEY = 'starlings_approved_posts_v3';
const RESOURCE_CACHE_KEY = 'starlings_approved_resources_v5';
const QA_CACHE_KEY = 'starlings_approved_qa_v1';
const FLAGGED_WORDS_CACHE_KEY = 'starlings_flagged_words_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FLAGGED_WORDS_TTL = 30 * 60 * 1000; // 30 minutes — word list changes rarely
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// One-time cleanup of stale cache keys from previous versions
['starlings_approved_posts_v2', 'starlings_approved_resources_v2', 'starlings_approved_resources_v3', 'starlings_approved_resources_v4'].forEach(k => localStorage.removeItem(k));

let inFlightRequest: Promise<Post[]> | null = null;

// ── Dynamic flagged-word list (sheet-sourced) ────────────────────────────────
// Populated once on app boot via apiService.getFlaggedWords().
// Checked synchronously on every submission alongside the static BANNED_PATTERNS.

interface FlaggedWordEntry {
  term: string;
  category: string; // e.g. "Crisis Escalation", "Personal Identifier"
  severity: number; // 1 = soft flag, 2 = standard review, 3 = urgent/crisis
}

let dynamicFlaggedWords: FlaggedWordEntry[] = [];

const findDynamicMatch = (text: string): FlaggedWordEntry | null => {
  if (dynamicFlaggedWords.length === 0) return null;
  const lower = text.toLowerCase();
  return dynamicFlaggedWords.find(entry => lower.includes(entry.term.toLowerCase())) ?? null;
};

// Normalise raw API response (new object format OR old string format) into
// FlaggedWordEntry[]. Strips column-header values that the sheet includes in
// row 1 so they don't create false positives.
const HEADER_VALUES = new Set(['term', 'word', 'phrase', 'flagged_word']);

const normalizeWordEntries = (raw: unknown[]): FlaggedWordEntry[] =>
  raw
    .map((w): FlaggedWordEntry | null => {
      if (typeof w === 'string') {
        // Old string format — no severity info yet, default severity 2
        const t = w.trim();
        return t.length > 0 && !HEADER_VALUES.has(t.toLowerCase())
          ? { term: t, category: '', severity: 2 }
          : null;
      }
      if (w && typeof w === 'object') {
        const obj = w as Record<string, unknown>;
        const t = String(obj.term ?? '').trim();
        return t.length > 0 && !HEADER_VALUES.has(t.toLowerCase())
          ? {
              term: t,
              category: String(obj.category ?? '').trim(),
              severity: Number(obj.severity) || 2,
            }
          : null;
      }
      return null;
    })
    .filter((e): e is FlaggedWordEntry => e !== null);

const matchesBannedPattern = (text: string): boolean => {
  // 1. Static regex patterns (always-on, crisis/PII/phone)
  if (BANNED_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  })) return true;
  // 2. Dynamic sheet-sourced word list
  return findDynamicMatch(text) !== null;
};

/**
 * Returns match metadata for a submission — severity (0 = no match,
 * 1–3 from sheet, 3 implied for static regex hits) and the category label.
 * Use this to include flagging context in submission payloads.
 */
const getBannedMatchInfo = (text: string): { severity: number; category: string } | null => {
  // Static patterns always imply severity 3 (crisis / PII / phone)
  const staticHit = BANNED_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
  if (staticHit) return { severity: 3, category: 'Static Pattern' };

  const dynamic = findDynamicMatch(text);
  if (dynamic) return { severity: dynamic.severity, category: dynamic.category };

  return null;
};

export const normalizeResource = (resource: any): Resource => {
  const rawCategory = (resource.category || '').toLowerCase().trim();
  const category = rawCategory === 'general' || rawCategory === 'partner' ? rawCategory : 'community';
  return {
    ...resource,
    type: resource.resource_type || resource.type || ResourceType.WEBSITE,
    imageUrl: resource.image_url || resource.imageUrl,
    submitterEmail: resource.submitter_email || resource.submitterEmail,
    category,
    helpful_count: Number(resource.helpful_count || 0),
    supportive_count: Number(resource.supportive_count || 0),
    exploring_count: Number(resource.exploring_count || 0),
    city: resource.city && resource.city !== 'Unknown' ? String(resource.city) : undefined,
    country: resource.country || undefined,
    lat: resource.lat ? Number(resource.lat) : undefined,
    lng: resource.lng ? Number(resource.lng) : undefined,
  };
};

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
    const cached = localStorage.getItem(RESOURCE_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    if (age < CACHE_TTL) return parsed;
    localStorage.removeItem(RESOURCE_CACHE_KEY);
    return null;
  } catch (e) {
    return null;
  }
};

const setCachedResources = (resources: Resource[]): void => {
  try {
    localStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify({ data: resources, timestamp: Date.now() }));
  } catch (e) {
    console.error('Error writing resource cache:', e);
  }
};

const getCachedQA = (): { data: QAItem[], timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(QA_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
    localStorage.removeItem(QA_CACHE_KEY);
    return null;
  } catch (e) { return null; }
};

const setCachedQA = (items: QAItem[]): void => {
  try {
    localStorage.setItem(QA_CACHE_KEY, JSON.stringify({ data: items, timestamp: Date.now() }));
  } catch (e) { /* storage unavailable */ }
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

const parseJsonResponse = async (res: Response): Promise<any> => {
  const contentType = res.headers.get('content-type') || '';
  const bodyText = await res.text();

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON from Google Apps Script, got ${contentType || 'unknown content type'}: ${bodyText.slice(0, 120)}`);
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(`Invalid JSON from Google Apps Script: ${bodyText.slice(0, 120)}`);
  }
};

const verifyBackendTarget = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
  const publicError = 'Question submission is temporarily unavailable. Please try again later.';

  try {
    const res = await fetch(`${GAS_URL}?action=health&ts=${Date.now()}`, { cache: 'no-store' });
    const data = await parseJsonResponse(res);

    if (!res.ok || data.success !== true) {
      console.error('Google Sheets backend is outdated or did not return health diagnostics.', data);
      return {
        ok: false,
        error: publicError,
      };
    }

    if (data.spreadsheetId !== EXPECTED_SPREADSHEET_ID) {
      console.error('Google Sheets backend is connected to the wrong spreadsheet.', {
        expected: EXPECTED_SPREADSHEET_ID,
        actual: data.spreadsheetId,
      });
      return {
        ok: false,
        error: publicError,
      };
    }

    if (Array.isArray(data.expectedTabs) && !data.expectedTabs.includes('Pending_QA')) {
      console.error('Google Sheets backend health response is missing Pending_QA.', data);
      return {
        ok: false,
        error: publicError,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('Backend health check failed:', error);
    return {
      ok: false,
      error: publicError,
    };
  }
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

          const uniquePosts = Array.from(uniquePostsMap.values());
          const result = uniquePosts.map(apiService.ensureAlias) as Post[];
          setCachedPosts(result);
          return result;
        }

        setCachedPosts([]);
        return [];
      } catch (error) {
        console.error("Error fetching approved posts from Google Sheets:", error);
        setCachedPosts([]);
        return [];
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

    const combinedText = postData.message || '';
    const matchInfo = getBannedMatchInfo(combinedText);
    const flagged = matchInfo !== null;

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
      alias: postData.alias && String(postData.alias).trim() ? String(postData.alias).trim() : apiService.generateAlias(),
      flagged: flagged,
    } as Post;

    try {
      const payload = {
        ...newPost,
        action: "addStory",
        ...(matchInfo && { flagged_severity: matchInfo.severity, flagged_category: matchInfo.category }),
      };
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
      } else {
        localStorage.setItem('starlings_sync_queue', JSON.stringify(remainingQueue));
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
            const mappedData: Resource[] = data.map(normalizeResource);
            const unique = new Map<string, Resource>();
            // Put mappedData in FIRST, then inject launch seed resources if they don't overwrite
            mappedData.forEach(r => unique.set(r.id, r));
            SEED_RESOURCES.forEach(m => {
              if (!unique.has(m.id)) unique.set(m.id, m as Resource);
            });
            setCachedResources(Array.from(unique.values()));
          }
        } catch (e) { }
      })();
      return cached.data;
    }

    try {
      const res = await fetch(`${GAS_URL}?action=getResources`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const unique = new Map<string, Resource>();
        data.map(normalizeResource).forEach(r => unique.set(r.id, r));
        SEED_RESOURCES.forEach(m => { if (!unique.has(m.id)) unique.set(m.id, m as Resource); });
        const finalArr = Array.from(unique.values());
        setCachedResources(finalArr);
        return finalArr;
      }
      setCachedResources(SEED_RESOURCES as Resource[]);
      return SEED_RESOURCES as Resource[];
    } catch (err) {
      console.error("Failed to fetch Live_Resources:", err);
      return SEED_RESOURCES as Resource[];
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
      category: resourceData.category || 'community',
      location: resourceData.location || '',
      image_url: resourceData.imageUrl || '',
      city: resourceData.city || '',
      country: resourceData.country || '',
      lat: resourceData.lat ?? '',
      lng: resourceData.lng ?? '',
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

  async submitQuestion(question: string): Promise<{ success: boolean; flagged: boolean; error?: string }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: false, flagged: false, error: 'Too many submissions too quickly. Please wait a moment and try again.' };
    }

    const backendTarget = await verifyBackendTarget();
    if (!backendTarget.ok) {
      return { success: false, flagged: false, error: backendTarget.error };
    }

    const matchInfo = getBannedMatchInfo(question);
    const flagged = matchInfo !== null;

    const payload = {
      action: "addQA",
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status: "PENDING",
      question,
      flagged,
      ...(matchInfo && { flagged_severity: matchInfo.severity, flagged_category: matchInfo.category }),
    };

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await parseJsonResponse(res);
      if (!res.ok || result.success !== true) {
        return {
          success: false,
          flagged: result.flagged !== undefined ? result.flagged : flagged,
          error: result.error || 'The question could not be saved to the moderation sheet.',
        };
      }

      return { success: true, flagged: result.flagged !== undefined ? result.flagged : flagged };
    } catch (e) {
      console.error("Failed to submit question:", e);
      return {
        success: false,
        flagged,
        error: 'Network error while saving your question. Please try again.',
      };
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
  },

  async submitReflection(resourceId: string, reflection: string): Promise<{ success: boolean; flagged: boolean }> {
    if (!checkRateLimit()) {
      console.warn("Anti-abuse guardrail triggered: Action blocked due to rate limit.");
      return { success: true, flagged: false };
    }

    const cleanReflection = reflection.trim();
    const matchInfo = getBannedMatchInfo(cleanReflection);
    const flagged = matchInfo !== null;

    if (flagged) {
      return { success: false, flagged: true };
    }

    try {
      const payload = {
        action: "addReflection",
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        status: PostStatus.PENDING,
        resourceId,
        reflection: cleanReflection,
        flagged,
        ...(matchInfo && { flagged_severity: matchInfo.severity, flagged_category: matchInfo.category }),
      };
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      return { success: result.success, flagged: result.flagged !== undefined ? result.flagged : flagged };
    } catch (e) {
      console.error("Failed to submit reflection", e);
      return { success: false, flagged };
    }
  },

  hasBannedContent(text: string): boolean {
    return matchesBannedPattern(text);
  },

  /**
   * Returns severity (1–3) and category of the first matched banned term,
   * or null if nothing matched. Use this to include flagging context in
   * submission payloads and to decide whether to show the crisis modal.
   * Severity 3 = urgent (crisis language or static pattern) → show modal.
   * Severity 1–2 = flag for review but no modal needed.
   */
  getBannedMatchInfo(text: string) {
    return getBannedMatchInfo(text);
  },

  /**
   * Fetch the Flagged_Words sheet and populate the dynamic word list used by
   * matchesBannedPattern. Safe to call multiple times — returns the in-memory
   * list immediately on subsequent calls. Falls back silently to static
   * BANNED_PATTERNS if the sheet is unreachable.
   */
  async getFlaggedWords(): Promise<string[]> {
    // Already in memory — nothing to do
    if (dynamicFlaggedWords.length > 0) return dynamicFlaggedWords;

    // Try localStorage cache first (30-min TTL)
    try {
      const cached = localStorage.getItem(FLAGGED_WORDS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          Date.now() - parsed.timestamp < FLAGGED_WORDS_TTL &&
          Array.isArray(parsed.data) &&
          parsed.data.length > 0
        ) {
          dynamicFlaggedWords = normalizeWordEntries(parsed.data);
          if (dynamicFlaggedWords.length > 0) return dynamicFlaggedWords;
        }
        localStorage.removeItem(FLAGGED_WORDS_CACHE_KEY);
      }
    } catch { /* storage unavailable */ }

    // Fetch from sheet
    try {
      const res = await fetch(`${GAS_URL}?action=getFlaggedWords`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        dynamicFlaggedWords = normalizeWordEntries(data);
        try {
          localStorage.setItem(
            FLAGGED_WORDS_CACHE_KEY,
            JSON.stringify({ data: dynamicFlaggedWords, timestamp: Date.now() })
          );
        } catch { /* storage full */ }
      }
    } catch {
      // Non-fatal — static BANNED_PATTERNS remain active
      console.warn('[Starlings] Could not fetch Flagged_Words — using static patterns only.');
    }

    return dynamicFlaggedWords;
  },

  async getApprovedQA(): Promise<QAItem[]> {
    const cached = getCachedQA();
    if (cached && !isLocalhost) return cached.data;

    try {
      const res = await fetch(`${GAS_URL}?action=getQA`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const items = data
        .filter((item: any) => item && item.question && item.answer)
        .map((item: any) => ({
          id: item.id || Math.random().toString(36).substring(7),
          timestamp: item.timestamp || new Date().toISOString(),
          status: item.status || PostStatus.APPROVED,
          question: item.question,
          answer: item.answer,
          flagged: item.flagged === true || item.flagged === 'TRUE',
        }));
      setCachedQA(items);
      return items;
    } catch (e) {
      console.error("Failed to fetch Live_QA:", e);
      return [];
    }
  }
};
