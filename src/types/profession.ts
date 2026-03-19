/**
 * Profession types and user profile interfaces.
 *
 * Extracted from contexts/AuthContext.tsx to avoid circular dependency
 * and the duplicate AuthContext provider issue.
 *
 * All profession-related type imports should come from this file.
 */

// Profession types matching the build/ HTML app
export type ProfessionType =
  | 'medical' | 'legal' | 'engineering' | 'business'
  | 'individual' | 'trading' | 'automotive' | 'marketing'
  | 'travel' | 'transportation' | 'retail' | 'aquaculture' | 'creator' | 'tourism' | 'studios';

// Sri Lankan user profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  preferredLanguage: 'en' | 'si' | 'ta';
  currency: 'LKR';
  location: {
    district?: string;
    province?: string;
    country: 'LK';
  };
  familyId?: string;
  memberType: 'individual' | 'family_head' | 'family_member';
  accountType: 'basic' | 'premium' | 'enterprise';
  profession?: ProfessionType;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    notifications: boolean;
    voiceCommands: boolean;
    smsIntegration: boolean;
    culturalAlerts: boolean;
    investmentTracking: boolean;
  };
}
