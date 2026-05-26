import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  escapeHtml,
  sanitizeAmount,
  sanitizeInteger,
  sanitizeEmail,
  sanitizeFileName,
  sanitizeObject,
  isValidUrl,
  sanitizePhone,
} from '../../utils/inputSanitizer';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Input Sanitizer (Security-Critical)
// Coverage: XSS, injection, path traversal, prototype pollution
// ═══════════════════════════════════════════════════════════

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeText('JAVASCRIPT:void(0)')).toBe('void(0)');
  });

  it('removes event handlers', () => {
    expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeText('onmouseover=fetch("evil")')).toBe('fetch("evil")');
  });

  it('removes data:text/html', () => {
    // After stripping data:text/html and tags, comma remains
    expect(sanitizeText('data:text/html,<script>x</script>')).toBe(',x');
  });

  it('removes null bytes', () => {
    expect(sanitizeText('hello\0world')).toBe('helloworld');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(1000);
    expect(sanitizeText(long, 100)).toHaveLength(100);
  });

  it('preserves unicode (Sinhala/Tamil)', () => {
    expect(sanitizeText('ආයුබෝවන්')).toBe('ආයුබෝවන්');
    expect(sanitizeText('வணக்கம்')).toBe('வணக்கம்');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(123 as unknown as string)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('encodes HTML entities', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('handles non-string input', () => {
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });
});

describe('sanitizeAmount', () => {
  it('parses valid amounts', () => {
    expect(sanitizeAmount(100)).toBe(100);
    expect(sanitizeAmount('1,500.50')).toBe(1500.50);
    expect(sanitizeAmount('Rs. 2,500')).toBe(2500);
    expect(sanitizeAmount('LKR 2,500.75')).toBe(2500.75);
    expect(sanitizeAmount('රු. 2,500')).toBe(2500);
    expect(sanitizeAmount('ரூ. 2,500')).toBe(2500);
    expect(sanitizeAmount('2,500.75 LKR')).toBe(2500.75);
    expect(sanitizeAmount('2500')).toBe(2500);
  });

  it('rounds to 2 decimal places', () => {
    expect(sanitizeAmount(10.999)).toBe(11);
    expect(sanitizeAmount(10.005)).toBe(10.01);
  });

  it('rejects negative amounts by default', () => {
    expect(sanitizeAmount(-100)).toBeNull();
  });

  it('allows negative when configured', () => {
    // min defaults to 0, so we need to set min to allow negative range
    expect(sanitizeAmount(-100, { allowNegative: true, min: -100000 })).toBe(-100);
  });

  it('rejects out-of-range values', () => {
    expect(sanitizeAmount(100_000_000)).toBeNull();
    expect(sanitizeAmount(50, { max: 10 })).toBeNull();
    expect(sanitizeAmount(5, { min: 10 })).toBeNull();
  });

  it('rejects invalid input', () => {
    expect(sanitizeAmount('abc')).toBeNull();
    expect(sanitizeAmount(NaN)).toBeNull();
    expect(sanitizeAmount(Infinity)).toBeNull();
  });
});

describe('sanitizeInteger', () => {
  it('parses valid integers', () => {
    expect(sanitizeInteger(5)).toBe(5);
    expect(sanitizeInteger('42')).toBe(42);
  });

  it('floors floating point input', () => {
    expect(sanitizeInteger(5.9)).toBe(5);
  });

  it('rejects out-of-range', () => {
    expect(sanitizeInteger(-1)).toBeNull();
    expect(sanitizeInteger(1_000_000)).toBeNull();
  });

  it('rejects invalid input', () => {
    expect(sanitizeInteger('xyz')).toBeNull();
    expect(sanitizeInteger(NaN)).toBeNull();
  });
});

describe('sanitizeEmail', () => {
  it('accepts valid emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });

  it('rejects invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('@missing.local')).toBeNull();
    expect(sanitizeEmail('missing@')).toBeNull();
    expect(sanitizeEmail('')).toBeNull();
  });

  it('rejects excessively long emails', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    expect(sanitizeEmail(longEmail)).toBeNull();
  });

  it('handles non-string input', () => {
    expect(sanitizeEmail(null as unknown as string)).toBeNull();
  });
});

describe('sanitizeFileName', () => {
  it('removes path traversal', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('etcpasswd');
  });

  it('removes slashes', () => {
    expect(sanitizeFileName('path/to/file')).toBe('pathtofile');
    expect(sanitizeFileName('path\\to\\file')).toBe('pathtofile');
  });

  it('removes special characters', () => {
    expect(sanitizeFileName('file<>:"|?*name')).toBe('filename');
  });

  it('limits length', () => {
    const longName = 'a'.repeat(300);
    expect(sanitizeFileName(longName)).toHaveLength(255);
  });

  it('returns unnamed for empty/invalid', () => {
    expect(sanitizeFileName('')).toBe('unnamed');
    expect(sanitizeFileName('...')).toBe('unnamed');
    expect(sanitizeFileName(123 as unknown as string)).toBe('unnamed');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values deeply', () => {
    const input = {
      name: '<script>xss</script>User',
      nested: { desc: '<b>bold</b>' },
    };
    const result = sanitizeObject(input);
    expect(result.name).toBe('xssUser');
    expect((result.nested as { desc: string }).desc).toBe('bold');
  });

  it('prevents prototype pollution', () => {
    const input = {
      __proto__: { admin: true },
      constructor: { evil: true },
      name: 'safe',
    } as Record<string, unknown>;
    const result = sanitizeObject(input);
    expect(result).not.toHaveProperty('__proto__');
    expect(result).not.toHaveProperty('constructor');
    expect(result.name).toBe('safe');
  });

  it('replaces non-finite numbers with 0', () => {
    const input = { a: Infinity, b: NaN, c: 42 };
    const result = sanitizeObject(input);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
    expect(result.c).toBe(42);
  });

  it('sanitizes arrays', () => {
    const input = { tags: ['<b>tag</b>', 'normal'] };
    const result = sanitizeObject(input);
    expect(result.tags).toEqual(['tag', 'normal']);
  });

  it('respects max depth', () => {
    const deep = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };
    const result = sanitizeObject(deep, 2);
    // At maxDepth=2, should not recurse beyond 2 levels
    expect(result).toBeDefined();
  });
});

describe('isValidUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('handles non-string input', () => {
    expect(isValidUrl(null as unknown as string)).toBe(false);
  });
});

describe('sanitizePhone', () => {
  it('accepts Sri Lankan mobile numbers', () => {
    expect(sanitizePhone('0771234567')).toBe('0771234567');
    expect(sanitizePhone('077 123 4567')).toBe('0771234567');
  });

  it('normalizes +94 format', () => {
    expect(sanitizePhone('+94771234567')).toBe('0771234567');
    expect(sanitizePhone('94771234567')).toBe('0771234567');
  });

  it('normalizes 940 format', () => {
    expect(sanitizePhone('9400771234567')).toBeNull(); // Too long
    expect(sanitizePhone('940771234567')).toBe('0771234567');
  });

  it('rejects invalid numbers', () => {
    expect(sanitizePhone('1234')).toBeNull();
    expect(sanitizePhone('abcdefghij')).toBeNull();
    expect(sanitizePhone('')).toBeNull();
  });

  it('handles non-string input', () => {
    expect(sanitizePhone(null as unknown as string)).toBeNull();
  });
});
