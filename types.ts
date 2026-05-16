
export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum RejectReason {
  TOO_PERSONAL = 'too_personal',
  CRISIS_CONTENT = 'crisis_content',
  IDENTIFYING_INFO = 'identifying_info',
  SPAM = 'spam',
  OTHER = 'other'
}

export interface Post {
  id: string;
  timestamp: string;
  status: PostStatus;
  country: string;
  city: string;
  lat: number;
  lng: number;
  message: string;
  what_helped: string[]; // Stored as comma-separated or JSON in Sheets
  alias: string;
  flagged: boolean;
  reject_reason?: RejectReason;
  internal_notes?: string;
}

export interface LocationSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country: string;
  };
}

export enum ResourceType {
  VIDEO = 'video',
  PUBLICATION = 'publication',
  WEBSITE = 'website',
  TOOL = 'tool',
  BOOK = 'book',
  PODCAST = 'podcast',
  SONG = 'song',
  SOCIAL_MEDIA = 'social_media',
  MEME = 'meme'
}

export interface Resource {
  id: string;
  timestamp: string;
  status: PostStatus;
  type: ResourceType;
  title: string;
  url: string;
  description?: string;
  alias?: string;
  submitterEmail?: string;
  qualifications?: string;
  isVerifiedPartner?: boolean;
  category?: 'general' | 'community' | 'partner';
  location?: string; // Optional field for partner resources
  imageUrl?: string;
  helpful_count?: number;
  supportive_count?: number;
  exploring_count?: number;
  // Optional map placement fields — only set when a resource is location-specific
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface QAItem {
  id: string;
  timestamp: string;
  status: PostStatus | string;
  question: string;
  answer?: string;
  flagged?: boolean;
}

/**
 * Discriminated union for items rendered on the Support Map.
 * Posts come from Live_Stories; Resources come from Live_Resources
 * (only those with lat/lng are included).
 */
export type MapItem =
  | { kind: 'post'; data: Post }
  | { kind: 'resource'; data: Resource };
