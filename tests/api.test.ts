import { describe, it, expect } from 'vitest';
import { BANNED_PATTERNS } from '../constants.tsx';
import { normalizeResource } from '../services/api.ts';

const baseRaw = {
  id: 'test-id',
  timestamp: '2024-01-01T00:00:00.000Z',
  status: 'APPROVED',
  resource_type: 'WEBSITE',
  title: 'Test Resource',
  url: 'https://example.com',
  description: 'A test resource',
  exploring_count: 0,
};

describe('normalizeResource', () => {
  it('parses string lat/lng to numbers when valid coords are present', () => {
    const raw = { ...baseRaw, lat: '51.0447', lng: '-114.0719', city: 'Calgary', country: 'Canada' };
    const result = normalizeResource(raw);
    expect(result.lat).toBe(51.0447);
    expect(result.lng).toBe(-114.0719);
    expect(result.city).toBe('Calgary');
    expect(result.country).toBe('Canada');
  });

  it('returns lat: undefined and lng: undefined when coords are missing or empty', () => {
    const raw = { ...baseRaw, lat: '', lng: '' };
    const result = normalizeResource(raw);
    expect(result.lat).toBeUndefined();
    expect(result.lng).toBeUndefined();
  });

  it('treats city "Unknown" as absent and returns undefined', () => {
    const raw = { ...baseRaw, city: 'Unknown' };
    const result = normalizeResource(raw);
    expect(result.city).toBeUndefined();
  });

  it('treats city "" (empty string) as absent and returns undefined', () => {
    const raw = { ...baseRaw, city: '' };
    const result = normalizeResource(raw);
    expect(result.city).toBeUndefined();
  });
});

describe('Content Moderation BANNED_PATTERNS', () => {
    const checkMessage = (message: string): boolean => {
        return BANNED_PATTERNS.some(pattern => {
            // Reset index for global regexes
            pattern.lastIndex = 0;
            return pattern.test(message);
        });
    };

    describe('URLs', () => {
        it('should flag standard http/https URLs', () => {
            expect(checkMessage('Check out this site: https://example.com')).toBe(true);
            expect(checkMessage('Visit http://test.org for info')).toBe(true);
        });

        it('should pass normal text without URLs', () => {
            expect(checkMessage('I went to the store today.')).toBe(false);
        });
    });

    describe('Emails', () => {
        it('should flag valid email addresses', () => {
            expect(checkMessage('Contact me at test@example.com for more info')).toBe(true);
            expect(checkMessage('user.name+tag@domain.co.uk')).toBe(true);
        });

        it('should pass normal text with @ symbols that are not emails', () => {
            expect(checkMessage('I was @ the mall today')).toBe(false);
        });
    });

    describe('Phone Numbers', () => {
        it('should flag common North American formats', () => {
            expect(checkMessage('Call 555-123-4567')).toBe(true);
            expect(checkMessage('(555) 123-4567')).toBe(true);
            expect(checkMessage('555 123 4567')).toBe(true);
            expect(checkMessage('1-555-123-4567')).toBe(true);
            expect(checkMessage('+1(555)123-4567')).toBe(true);
        });

        it('should pass normal numbers that are not phone numbers', () => {
            expect(checkMessage('I bought 5 apples for 12 dollars')).toBe(false);
            expect(checkMessage('My scores were 10, 20, and 30')).toBe(false);
            expect(checkMessage('The year was 1999')).toBe(false);
        });
    });

    describe('Crisis Keywords', () => {
        it('should flag critical crisis keywords', () => {
            expect(checkMessage('I want to kill myself')).toBe(true);
            expect(checkMessage('I might hurt myself')).toBe(true);
            expect(checkMessage('Thinking about suicide')).toBe(true);
            expect(checkMessage('I am going to overdose tonight')).toBe(true);
            expect(checkMessage('self harm is my only escape')).toBe(true);
        });

        it('should pass text with similar but safe words', () => {
            expect(checkMessage('I killed the spider')).toBe(false); // only "kill myself" is banned
            expect(checkMessage('My battery is dying')).toBe(false);
            expect(checkMessage('I did so much harm to my diet today')).toBe(false); // only "self harm" is banned
        });
    });

    describe('Combined Safety Check', () => {
        it('should pass a completely safe, typical user support message', () => {
            const safeMessage = "One thing that helped me was talking to a trusted teacher. A message I'd tell someone else is you are never alone in this. A support or system that helped was the local community center.";
            expect(checkMessage(safeMessage)).toBe(false);
        });
    });
});
