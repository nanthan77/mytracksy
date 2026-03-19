/**
 * DEPRECATED — Backward-compatibility re-export barrel.
 *
 * This file previously contained a full AuthProvider that was NEVER mounted,
 * causing crashes when components imported useAuth from here.
 *
 * The canonical locations are now:
 *   - ProfessionType, UserProfile → src/types/profession.ts
 *   - useAuth, AuthProvider       → src/context/AuthContext.tsx
 *
 * TODO: Remove this file once all imports are migrated.
 */

// Re-export types from their canonical location
export type { ProfessionType, UserProfile } from '../types/profession';

// Re-export auth hook from the mounted provider
export { useAuth, AuthProvider } from '../context/AuthContext';
