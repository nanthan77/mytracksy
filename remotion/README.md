# MyTracksy Doctor Demo Video (Remotion)

A 75-second animated explainer video showcasing the MyTracksy Doctor app's 3 pricing tiers + AI Token Store.

## Video Scenes (8 total, ~75 seconds)

| Scene | Duration | Content |
|-------|----------|---------|
| 1. Intro | 5s | MyTracksy Doctor branding + "Pricing Plans Explained" |
| 2. App Overview | 8s | 6 core feature cards (calendar, tracking, tax, AI, PWA, analytics) |
| 3. Tier 1 — Free | 9s | Intern/Basic plan — LKR 0, 5 included + 3 locked features |
| 4. Tier 2 — Pro | 11s | Consultant plan — LKR 2,900/mo, "Most Popular", all 7 features |
| 5. Tier 3 — Elite | 10s | Clinic Director — LKR 7,500/mo, WhatsApp AI, "Replace LKR 35K receptionist" |
| 6. AI Token Store | 7s | Add-on — LKR 1,500 for 100 tokens, 4 use cases |
| 7. Comparison Table | 9s | Side-by-side all-plans comparison grid |
| 8. CTA | 6s | "Start Free. Upgrade When Ready." with pulsing button |

## Quick Start

```bash
cd remotion
npm install
npx remotion studio    # Opens browser preview
```

## Render to MP4

```bash
npx remotion render src/index.tsx DoctorDemo out/doctor-demo.mp4
```

## Render to GIF

```bash
npx remotion render src/index.tsx DoctorDemo out/doctor-demo.gif --image-format=png
```

## Tech Stack

- **Remotion 4.0** — React-based video framework
- **1920×1080** at 30fps
- **Spring animations** — Smooth fade-ins, scale pops, staggered lists
- **MyTracksy brand colors** — Deep indigo + teal accent

## Customization

- Edit scene durations in `src/DoctorDemo.tsx`
- Modify pricing/features in individual scene files under `src/scenes/`
- Brand colors in `src/styles.ts`
- Animation components in `src/components/Animations.tsx`
