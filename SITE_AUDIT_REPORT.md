# MyTracksy Full Site Audit Report
**Date:** March 20, 2026
**Auditor:** Claude AI — Compliance, UX, SEO, Code Quality

---

## 🔴 CRITICAL Issues (Fix Immediately)

### 1. Domain Mismatch — SEO/Canonical Catastrophe
**Files:** `LandingPage.tsx`, `ProfessionLandingPage.tsx`, all structured data
**Problem:** All canonical URLs, OG tags, structured data, and internal references use `mytracksy.lk` but the live site is hosted at `mytracksy.com`.
- `<link rel="canonical" href="https://mytracksy.lk/" />`
- `og:url` → `https://mytracksy.lk/`
- Schema.org URLs → `https://mytracksy.lk/`

**Impact:** Google sees a canonical pointing to a different domain. This tanks SEO authority, causes indexing confusion, and means social media shares show wrong URLs.

**Fix:** Global find-replace `mytracksy.lk` → `mytracksy.com` across all TSX files, or set up proper 301 redirects if `.lk` is the intended domain.

### 2. Rickroll Video Embedded on ALL Landing Pages
**File:** `ProfessionLandingPage.tsx` line ~530
**Problem:** The demo video iframe points to `https://www.youtube.com/embed/dQw4w9WgXcQ` — the Rick Astley "Never Gonna Give You Up" music video.
**Impact:** This is a placeholder that was never replaced. Every profession landing page (medical, legal, engineering, etc.) auto-plays a Rickroll to potential customers.
**Fix:** Replace with an actual demo video URL, or remove the iframe and show a static screenshot/mockup.

### 3. False "PDPA Compliant" Badge on Every Landing Page
**File:** `ProfessionLandingPage.tsx` line ~521
**Problem:** Hero section shows `🇱🇰 PDPA Compliant` as a trust badge. As we discussed in the compliance audit, this claim is legally indefensible without the full compliance stack.
**Impact:** Regulatory liability. A regulator or litigant could use this as evidence of misrepresentation.
**Fix:** Change to `🇱🇰 Built for PDPA-ready operations` across all landing pages.

### 4. FAQ Claims "100% on your device" + "No data on our servers"
**File:** `ProfessionLandingPage.tsx` line ~340
**Problem:** FAQ answer states: `"All your ${routeName} data stays 100% on your device. We comply with Sri Lankan PDPA regulations. No personal or financial data is ever stored on our servers."`
**Impact:** If you use Firebase/Firestore (which you do), user data IS stored on servers. This is a false claim.
**Fix:** Rewrite to accurately describe your data architecture.

---

## 🟡 HIGH Issues (Fix This Week)

### 5. ProfessionSetup Page — Cards Barely Visible
**File:** `ProfessionSetup.tsx`
**Problem:** The grid uses `repeat(auto-fit, minmax(320px, 1fr))` which only fits ~3 cards per row on a 1400px container. But the page itself appears to render cards with very low opacity on page load. The card backgrounds are white `rgba(255,255,255,0.97)` against a dark gradient background, but the `fadeUp` animation starts at `opacity: 0` which may stay at 0 if the animation doesn't properly trigger.
**Fix:** Add a fallback for animation: ensure all cards are visible even if animation fails. Reduce `minmax` to `280px` for better fit.

### 6. OG Image is Just the Logo — Poor Social Sharing
**Files:** `LandingPage.tsx` line 202
**Problem:** `og:image` points to `mytracksy-logo.png` — a small logo, not a proper social preview card (1200x630px).
**Impact:** When someone shares MyTracksy on LinkedIn, Facebook, or WhatsApp, it shows a tiny logo instead of a compelling preview card.
**Fix:** Create proper 1200x630px OG images for the homepage and each profession page.

### 7. Missing OG Images for Medical, Creator, Studios Professions
**File:** `ProfessionLandingPage.tsx` line ~346
**Problem:** `professionOgImages` object has no entries for `dr` (medical), `creator`, or `studios` slugs. They fall back to the generic logo.

### 8. DoctorLandingPage — Still Has Some Absolute Claims
**File:** `DoctorLandingPage.tsx`
**Problem:** While the FAQs have been improved, the rest of the page likely still contains absolute compliance claims that need the rewrite we prepared.

---

## 🟢 MEDIUM Issues (Fix This Sprint)

### 9. Performance: Render-Blocking Google Fonts Import
**Files:** `LandingPage.tsx`, `ProfessionLandingPage.tsx`
**Problem:** Both files use `@import url(...)` for Google Fonts inside `<style>` tags. This is render-blocking.
**Fix:** Move to `<link rel="preload">` in HTML head, or use `font-display: swap` at minimum.

### 10. Inline Styles Everywhere — Maintainability Nightmare
**All landing page files**
**Problem:** Thousands of lines of inline `style={{...}}` objects. This makes theming, responsive design, and maintenance extremely difficult. CSS changes require code changes.
**Recommendation:** Migrate to Tailwind or CSS modules over time.

### 11. Accessibility Issues
- **ProfessionSetup cards** are `<div>` with `onClick` — should be `<button>` or `role="button"` with keyboard handling
- **FAQ sections** use custom `<button>` but may not have proper `aria-expanded` attributes
- **Color contrast** on some badges (light purple on white) may fail WCAG AA

### 12. Missing `alt` Text and ARIA Labels
**Multiple files**
**Problem:** Some images use generic alt text. Icon-based navigation lacks labels.

### 13. No Error Boundaries on Critical Routes
**App.tsx**
**Problem:** Lazy-loaded components need error boundaries to handle chunk loading failures gracefully.

---

## 📊 Summary

| Severity | Count | Key Theme |
|----------|-------|-----------|
| 🔴 CRITICAL | 4 | Legal liability, SEO broken, embarrassing placeholder |
| 🟡 HIGH | 4 | Poor social sharing, visibility bugs, incomplete compliance |
| 🟢 MEDIUM | 5 | Performance, accessibility, maintainability |

**Priority Order:**
1. Fix domain mismatch (SEO)
2. Remove Rickroll video
3. Fix PDPA compliance claims
4. Fix FAQ data storage claims
5. Integrate medical compliance rewrite
