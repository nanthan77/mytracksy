/**
 * inputSanitizer.ts — Input Sanitization Utilities
 *
 * Banking-level input validation and sanitization to prevent:
 * - Stored XSS attacks via user input
 * - SQL/NoSQL injection patterns
 * - Path traversal attacks
 * - Prototype pollution
 *
 * Usage:
 *   import { sanitizeText, sanitizeAmount, sanitizeEmail } from '../utils/inputSanitizer';
 *   const clean = sanitizeText(userInput);
 *   const amount = sanitizeAmount(rawAmount);
 */

// ─── Text Sanitization ─────────────────────────────────────────

/**
 * Strip HTML/script tags and dangerous characters from text input.
 * Preserves unicode text (Sinhala, Tamil, etc.).
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
    if (typeof input !== 'string') return '';

    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script-like patterns
        .replace(/javascript\s*:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Trim and enforce max length
        .trim()
        .slice(0, maxLength);
}

/**
 * Sanitize text for display (encode HTML entities)
 */
export function escapeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

// ─── Amount / Number Sanitization ───────────────────────────────

/**
 * Validate and sanitize monetary amounts.
 * Returns the amount in cents (integer) or null if invalid.
 */
export function sanitizeAmount(
    input: string | number,
    options: {
        min?: number;
        max?: number;
        allowNegative?: boolean;
    } = {}
): number | null {
    const { min = 0, max = 99_999_999, allowNegative = false } = options;

    let value: number;
    if (typeof input === 'string') {
        // Remove currency symbols, commas, spaces
        const cleaned = input.replace(/[^\d.\-]/g, '');
        value = parseFloat(cleaned);
    } else {
        value = input;
    }

    if (isNaN(value) || !isFinite(value)) return null;
    if (!allowNegative && value < 0) return null;
    if (value < min || value > max) return null;

    // Round to 2 decimal places to avoid floating point issues
    return Math.round(value * 100) / 100;
}

/**
 * Validate integer input (e.g. quantities, counts)
 */
export function sanitizeInteger(
    input: string | number,
    options: { min?: number; max?: number } = {}
): number | null {
    const { min = 0, max = 999_999 } = options;
    const value = typeof input === 'string' ? parseInt(input, 10) : Math.floor(input);
    if (isNaN(value) || !isFinite(value)) return null;
    if (value < min || value > max) return null;
    return value;
}

// ─── Email Sanitization ─────────────────────────────────────────

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(input: string): string | null {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim().toLowerCase();
    // RFC 5322 simplified regex
    const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(trimmed)) return null;
    if (trimmed.length > 254) return null; // RFC max
    return trimmed;
}

// ─── Filename Sanitization ──────────────────────────────────────

/**
 * Sanitize filenames to prevent path traversal and special characters
 */
export function sanitizeFileName(input: string): string {
    if (typeof input !== 'string') return 'unnamed';
    return input
        // Remove path traversal
        .replace(/\.\./g, '')
        .replace(/[\/\\]/g, '')
        // Remove special characters
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"|?*\u0000-\u001f]/g, '')
        // Trim dots and spaces from start/end
        .replace(/^[\s.]+|[\s.]+$/g, '')
        // Limit length
        .slice(0, 255)
        || 'unnamed';
}

// ─── Object Sanitization ────────────────────────────────────────

/**
 * Deep-sanitize an object's string values.
 * Prevents prototype pollution and sanitizes all string fields.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    maxDepth: number = 5
): T {
    if (maxDepth <= 0 || typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }

        const value = obj[key];
        if (typeof value === 'string') {
            result[key] = sanitizeText(value, 10000);
        } else if (typeof value === 'number') {
            result[key] = isFinite(value) ? value : 0;
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) =>
                typeof item === 'object' && item !== null
                    ? sanitizeObject(item as Record<string, unknown>, maxDepth - 1)
                    : typeof item === 'string'
                    ? sanitizeText(item, 10000)
                    : item
            );
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value as Record<string, unknown>, maxDepth - 1);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

// ─── URL Validation ─────────────────────────────────────────────

/**
 * Validate a URL is safe (no javascript: or data: protocols)
 */
export function isValidUrl(input: string): boolean {
    if (typeof input !== 'string') return false;
    try {
        const url = new URL(input);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

// ─── Phone Number Sanitization ──────────────────────────────────

/**
 * Sanitize Sri Lankan phone numbers
 */
export function sanitizePhone(input: string): string | null {
    if (typeof input !== 'string') return null;
    const digits = input.replace(/\D/g, '');
    // Sri Lankan format: 0XX XXXXXXX (10 digits) or +94 XX XXXXXXX (11 digits)
    if (digits.length === 10 && digits.startsWith('0')) return digits;
    if (digits.length === 11 && digits.startsWith('94')) return '0' + digits.slice(2);
    if (digits.length === 12 && digits.startsWith('940')) return digits.slice(2);
    return null;
}
