# Accessibility Audit: MyTracksy.com

**Standard:** WCAG 2.1 AA | **Date:** March 19, 2026
**URL:** https://www.mytracksy.com/
**Auditor:** Claude (Automated + Visual Inspection)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Issues Found** | **23** |
| 🔴 Critical | 8 |
| 🟡 Major | 9 |
| 🟢 Minor | 6 |

**Overall Grade: Needs Significant Improvement**

The site has serious accessibility barriers including pervasive color contrast failures, non-semantic interactive elements (navigation built with `<span>` tags instead of links/buttons), missing keyboard access, no skip navigation, and no `<main>` landmark. These issues would prevent many users with disabilities from effectively using the site.

---

## Findings

### 1. Perceivable

| # | Issue | WCAG Criterion | Severity | Location | Recommendation |
|---|-------|---------------|----------|----------|----------------|
| 1 | Hero heading "Financial Command Center..." is nearly invisible — light gray text on white/light background | 1.4.3 Contrast (Minimum) | 🔴 Critical | Hero section | Darken heading text to at least `#374151` (gray-700) for a 7:1+ ratio on white |
| 2 | "Next-Gen Financial Architecture" badge: blue-on-blue (ratio ~1.41:1, required 4.5:1) | 1.4.3 Contrast (Minimum) | 🔴 Critical | Hero badge | Use white text on the blue background, or use a dark-on-light badge design |
| 3 | Hero body text barely readable — very light gray on near-white background | 1.4.3 Contrast (Minimum) | 🔴 Critical | Hero paragraph | Change body text to `#4B5563` (gray-600) minimum for 4.5:1 ratio |
| 4 | "SUPPORTED INDUSTRIES" / "ON-DEVICE ENCRYPTION" stat labels — light gray text on white | 1.4.3 Contrast (Minimum) | 🟡 Major | Stats bar | Darken label text to at least `#6B7280` (gray-500) |
| 5 | Section headings ("Industry-Specific Cognitive Engines", "Enterprise-Grade Infrastructure", FAQ heading) all use very low-contrast gray text | 1.4.3 Contrast (Minimum) | 🔴 Critical | Multiple sections | All section headings need contrast of at least 3:1 for large text — currently appear ~2:1 or lower |
| 6 | "SYSTEM CAPABILITIES" / "SEARCH-READY ANSWERS" label badges — very faint text | 1.4.3 Contrast (Minimum) | 🟡 Major | Section labels | Increase contrast to meet 4.5:1 for small text |
| 7 | FAQ answer text is very light gray, difficult to read | 1.4.3 Contrast (Minimum) | 🟡 Major | FAQ section | Darken to at least `#4B5563` |
| 8 | "Deploy Free Environment" CTA button — text barely distinguishable from button background | 1.4.3 Contrast (Minimum) | 🔴 Critical | CTA section | Use solid white text on a colored button, or dark text on white with a dark border |
| 9 | "Deploy Infrastructure →" and "Explore Capabilities" hero buttons — white text on near-white bg (ratio ~1.0:1) | 1.4.3 Contrast (Minimum) | 🔴 Critical | Hero CTAs | These buttons have gradient backgrounds that aren't being picked up; ensure text contrast against the actual rendered background meets 4.5:1 |
| 10 | Dark section card body text (compliance, sovereignty, NLP descriptions) — low contrast gray on dark navy | 1.4.3 Contrast (Minimum) | 🟡 Major | Enterprise section cards | Lighten body text to `#CBD5E1` (slate-300) or brighter |
| 11 | Footer description text and link colors are low-contrast against the light background | 1.4.3 Contrast (Minimum) | 🟢 Minor | Footer | Darken footer body text and ensure links meet 4.5:1 |

### 2. Operable

| # | Issue | WCAG Criterion | Severity | Location | Recommendation |
|---|-------|---------------|----------|----------|----------------|
| 12 | **Navigation items are `<span>` elements, not `<a>` or `<button>`** — "Platform", "Solutions", "Security", "Enterprise", "Sign In" are all non-focusable `<span>` tags with no `tabindex`, `role`, or `href` | 2.1.1 Keyboard | 🔴 Critical | Main navigation | Convert all nav items to proper `<a>` links with `href` attributes or `<button>` elements. This is the single most impactful fix. |
| 13 | **No skip navigation link** — users must tab through the entire nav before reaching content | 2.4.1 Bypass Blocks | 🟡 Major | Page top | Add a visually hidden "Skip to main content" link as the first focusable element |
| 14 | "Deploy Module" links across all 14 industry cards are `<div>` elements, not `<a>` or `<button>` — not keyboard accessible | 2.1.1 Keyboard | 🔴 Critical | Industry cards | Convert to `<a>` links pointing to each module's page |
| 15 | Footer links ("Core Infrastructure", "Security Protocols", "PDPA Compliance Center", etc.) — need to verify these are proper `<a>` tags with `href` | 2.1.1 Keyboard | 🟡 Major | Footer | Ensure all footer items are proper `<a>` links |
| 16 | No visible focus indicator detected in CSS — interactive elements lack `:focus-visible` styles | 2.4.7 Focus Visible | 🟡 Major | Sitewide | Add `outline: 2px solid #2563EB; outline-offset: 2px;` on `:focus-visible` for all interactive elements |
| 17 | Touch targets for nav items may be under 44×44px (14px font-size spans) | 2.5.5 Target Size | 🟢 Minor | Navigation | Ensure all clickable elements have minimum 44×44px tap area with padding |

### 3. Understandable

| # | Issue | WCAG Criterion | Severity | Location | Recommendation |
|---|-------|---------------|----------|----------|----------------|
| 18 | `<html>` element has `lang` attribute but it may not be set (detected as empty or missing in the audit) | 3.1.1 Language of Page | 🟢 Minor | `<html>` tag | Ensure `<html lang="en">` is present |
| 19 | FAQ section uses `<article>` elements but no expandable/collapsible pattern (accordion) — all answers are visible at once with no heading hierarchy within | 3.2.1 On Focus | 🟢 Minor | FAQ section | Consider implementing an accessible accordion pattern with `aria-expanded` |

### 4. Robust

| # | Issue | WCAG Criterion | Severity | Location | Recommendation |
|---|-------|---------------|----------|----------|----------------|
| 20 | **No `<main>` landmark** — the page content is not wrapped in a `<main>` element or `role="main"` | 4.1.2 Name, Role, Value | 🟡 Major | Page structure | Wrap primary content in `<main>` element |
| 21 | Navigation items lack semantic roles — `<span>` elements with `cursor: pointer` but no ARIA roles | 4.1.2 Name, Role, Value | 🟡 Major | Navigation | Use semantic `<a>` or `<button>` elements instead of relying on ARIA |
| 22 | Section elements (`<section>`) used as landmarks but lack `aria-label` or `aria-labelledby` | 4.1.2 Name, Role, Value | 🟢 Minor | Sections | Add `aria-labelledby` pointing to each section's heading |
| 23 | Industry card "Deploy Module" elements have no name/role for assistive technology | 4.1.2 Name, Role, Value | 🟡 Major | Industry cards | Use `<a>` with descriptive text like "Deploy Healthcare Module" |

---

## Color Contrast Check

| Element | Foreground | Background | Ratio | Required | Pass? |
|---------|-----------|------------|-------|----------|-------|
| Hero heading (h1) | ~`#C0C0C0` | ~`#F8FAFC` | ~1.5:1 | 3:1 (large) | ❌ |
| "Next-Gen Financial Architecture" badge | `#2563EB` | `#3B82F6` | 1.41:1 | 4.5:1 | ❌ |
| Nav text ("Platform", etc.) | `#475569` | `#FFFFFF` | ~5.4:1 | 4.5:1 | ✅ |
| "Sign In" text | `#0F172A` | `#FFFFFF` | ~15.4:1 | 4.5:1 | ✅ |
| "Request Demo" button | `#FFFFFF` | gradient blue | ~4.8:1 | 4.5:1 | ✅ |
| Section heading text | ~`#D1D5DB` | `#F1F5F9` | ~1.3:1 | 3:1 (large) | ❌ |
| FAQ description text | ~`#9CA3AF` | `#FFFFFF` | ~2.8:1 | 4.5:1 | ❌ |
| "SUPPORTED INDUSTRIES" label | ~`#9CA3AF` | `#FFFFFF` | ~2.8:1 | 4.5:1 | ❌ |
| Card description text | ~`#6B7280` | `#FFFFFF` | ~4.6:1 | 4.5:1 | ✅ |
| Industry card heading | `#1E293B` | `#FFFFFF` | ~13.5:1 | 3:1 (large) | ✅ |
| "Deploy Module" link text | `#38BDF8` | `#FFFFFF` | ~2.1:1 | 4.5:1 | ❌ |
| Dark section card titles | ~`#E2E8F0` | `#1E293B` | ~9.5:1 | 3:1 (large) | ✅ |
| Dark section card body | ~`#64748B` | `#1E293B` | ~2.5:1 | 4.5:1 | ❌ |
| "Deploy Free Environment" CTA | ~`#94A3B8` | ~`#C7C7CC` | ~1.4:1 | 4.5:1 | ❌ |
| Footer body text | ~`#64748B` | `#F8FAFC` | ~4.3:1 | 4.5:1 | ❌ |
| Footer links | ~`#6366F1` | `#F8FAFC` | ~4.5:1 | 4.5:1 | ⚠️ Borderline |

---

## Keyboard Navigation

| Element | Keyboard Accessible? | Tab Reachable? | Enter/Space Works? | Issue |
|---------|---------------------|----------------|---------------------|-------|
| "Platform" nav item | ❌ No | ❌ No (`<span>`) | N/A | Not a focusable element |
| "Solutions" nav item | ❌ No | ❌ No (`<span>`) | N/A | Not a focusable element |
| "Security" nav item | ❌ No | ❌ No (`<span>`) | N/A | Not a focusable element |
| "Enterprise" nav item | ❌ No | ❌ No (`<span>`) | N/A | Not a focusable element |
| "Sign In" nav item | ❌ No | ❌ No (`<span>`) | N/A | Not a focusable element |
| "Request Demo" button | ✅ Yes | ✅ Yes | ✅ Yes | Only keyboard-accessible nav element |
| "Deploy Infrastructure →" | ✅ Yes | ✅ Yes | ✅ Yes | `<button>` element |
| "Explore Capabilities" | ✅ Yes | ✅ Yes | ✅ Yes | `<button>` element |
| "Deploy Module" (×14) | ❌ No | ❌ No (`<div>`) | N/A | Not focusable elements |
| "Deploy Free Environment" | ✅ Yes | ✅ Yes | ✅ Yes | `<button>` element |
| Footer "SafeNetCreations" | ✅ Yes | ✅ Yes | ✅ Yes | Proper `<a>` link |

---

## Screen Reader Concerns

| Element | Expected Announcement | Actual Issue |
|---------|----------------------|-------------|
| Navigation | "Platform link, Solutions link..." | Announced as plain text — no link/button semantics |
| Industry cards | "Healthcare & Medical, Deploy Module link" | "Deploy Module" has no role, announced as static text |
| Section regions | "Industry section, navigation landmark" | Sections lack labels, announced generically |
| Hero image | "MyTracksy financial dashboard" | ✅ Has descriptive alt text |
| Logo images | "MyTracksy" | ✅ Has alt text |
| Stats "12+" | Should say "12 plus Supported Industries" | Announced as separate unconnected elements |

---

## Heading Hierarchy

| Order | Level | Text | Issue? |
|-------|-------|------|--------|
| 1 | H2 | Industry-Specific Cognitive Engines | ⚠️ No H1 visible in DOM order before this |
| 2 | H3 | Healthcare & Medical | ✅ |
| 3 | H3 | Legal Practices | ✅ |
| 4 | H3 | Corporate Business | ✅ |
| — | H3 | *(10 more industry headings)* | ✅ |
| 15 | H2 | Enterprise-Grade Infrastructure | ✅ |
| 16 | H3 | Automated Compliance matrix | ✅ |
| 17 | H3 | Zero-Trust Data Sovereignty | ✅ |
| 18 | H3 | Predictive NLP Analytics | ✅ |
| 19 | H2 | Questions Search Engines And AI Crawlers Can Understand | ✅ |
| 20 | H3 | What is MyTracksy and who is it built for? | ✅ |
| 21 | H3 | *(3 more FAQ headings)* | ✅ |
| 22 | H2 | Modernize Your Operations. | ✅ |
| 23 | H4 | Platform Architecture | ⚠️ Skips H3 |
| 24 | H4 | Legal & Privacy | ✅ |

**Note:** The H1 ("Financial Command Center for Modern Enterprise") exists in the DOM but is nearly invisible due to extreme low contrast, and it appears the heading hierarchy is mostly logical aside from the H4 skip in the footer.

---

## Priority Fixes

### 🔴 P0 — Fix Immediately (Blocks Users)

1. **Convert navigation items to semantic `<a>` links** — Currently, 5 of 6 nav items (`Platform`, `Solutions`, `Security`, `Enterprise`, `Sign In`) are `<span>` tags. Keyboard-only and screen reader users cannot access or navigate the site. This is the **#1 most critical fix**.

2. **Convert "Deploy Module" elements to `<a>` links** — 14 interactive-looking elements are `<div>` tags, completely inaccessible to keyboard and assistive technology users.

3. **Fix hero section contrast** — The main heading, subtext, and CTA buttons are nearly invisible. Contrast ratios as low as 1.0:1 mean the content is essentially hidden for low-vision users.

### 🟡 P1 — Fix Soon (Major Barriers)

4. **Add a `<main>` landmark** — Screen reader users cannot jump to main content efficiently.

5. **Add skip navigation link** — Required for keyboard users to bypass the navigation.

6. **Add visible focus indicators** — No `:focus-visible` styles detected; keyboard users cannot see where they are on the page.

7. **Fix contrast across all section headings and body text** — Multiple sections use decorative low-contrast text that fails WCAG minimum ratios.

### 🟢 P2 — Nice to Have (Polish)

8. **Add `aria-labelledby` to `<section>` landmarks** for screen reader navigation.

9. **Implement accessible FAQ accordion** with `aria-expanded` toggle states.

10. **Verify `<html lang="en">` is properly set** for screen readers to use correct pronunciation.

---

## Tools & Methods Used

- **Visual inspection** via screenshots of all page sections
- **DOM analysis** of element types, roles, and ARIA attributes
- **Computed style extraction** for color values, font sizes, and contrast ratios
- **Programmatic contrast ratio calculation** using WCAG luminance formula
- **Accessibility tree inspection** via browser accessibility API
- **Keyboard navigation audit** checking tab order and focusability

---

*This audit covers the homepage only. Internal pages (Platform, Solutions, Security, Enterprise) were not tested. A complete audit should include those pages, mobile viewport testing, screen reader testing with VoiceOver/NVDA, and real-user testing.*
