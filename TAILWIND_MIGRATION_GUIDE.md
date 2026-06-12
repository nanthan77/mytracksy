# Tailwind CSS Migration Guide — MyTracksy

## Setup (already done)

1. **Config files created:** `tailwind.config.js`, `postcss.config.js`
2. **CSS directives added:** `@tailwind base/components/utilities` in `src/index.css`
3. **Install dependencies** (run once):
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

## How It Works

Tailwind and inline styles **coexist**. You can migrate one component at a time.
No need for a big-bang rewrite.

## Inline → Tailwind Conversion Reference

### Layout & Spacing

| Inline Style | Tailwind Class |
|---|---|
| `display: 'flex'` | `flex` |
| `flexDirection: 'column'` | `flex-col` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'center'` | `justify-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `gap: 8` | `gap-2` |
| `gap: 12` | `gap-3` |
| `gap: 16` | `gap-4` |
| `gap: 24` | `gap-6` |
| `padding: '24px'` | `p-6` |
| `padding: '32px 28px'` | `py-8 px-7` |
| `margin: '0 auto'` | `mx-auto` |
| `marginBottom: 20` | `mb-5` |
| `maxWidth: 1200` | `max-w-7xl` |

### Typography

| Inline Style | Tailwind Class |
|---|---|
| `fontSize: 12` | `text-xs` |
| `fontSize: 13` | `text-[13px]` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 15` | `text-[15px]` |
| `fontSize: 16` | `text-base` |
| `fontSize: 17` | `text-[17px]` |
| `fontSize: 24` | `text-2xl` |
| `fontWeight: 600` | `font-semibold` |
| `fontWeight: 700` | `font-bold` |
| `fontWeight: 800` | `font-extrabold` |
| `letterSpacing: '-0.02em'` | `tracking-tight` |
| `lineHeight: 1.6` | `leading-relaxed` |
| `lineHeight: 1.7` | `leading-7` |
| `textAlign: 'center'` | `text-center` |

### Colors (MyTracksy custom)

| Inline Style | Tailwind Class |
|---|---|
| `color: '#0f172a'` | `text-mt-navy` |
| `color: '#1e293b'` | `text-mt-deep` |
| `color: '#6366f1'` | `text-mt-accent` |
| `color: '#2dd4bf'` | `text-mt-teal` |
| `color: '#f59e0b'` | `text-mt-amber` |
| `color: '#64748b'` | `text-slate-500` |
| `color: '#94a3b8'` | `text-slate-400` |
| `color: '#f8fafc'` | `text-slate-50` |
| `background: '#0f172a'` | `bg-mt-navy` |
| `background: '#1a2332'` | `bg-mt-card` |

### Borders & Radius

| Inline Style | Tailwind Class |
|---|---|
| `borderRadius: 8` | `rounded-lg` |
| `borderRadius: 12` | `rounded-xl` |
| `borderRadius: 16` | `rounded-2xl` |
| `borderRadius: 24` | `rounded-3xl` |
| `borderRadius: 50` | `rounded-full` |
| `border: '1px solid rgba(0,0,0,0.04)'` | `border border-black/[0.04]` |
| `border: '1px solid rgba(255,255,255,0.06)'` | `border border-white/[0.06]` |

### Effects

| Inline Style | Tailwind Class |
|---|---|
| `boxShadow: '0 4px 24px -6px rgba(0,0,0,0.04)'` | `shadow-lg` |
| `backdropFilter: 'blur(20px)'` | `backdrop-blur-xl` |
| `opacity: 0.5` | `opacity-50` |
| `transition: 'all 0.3s ease'` | `transition-all duration-300` |
| `transform: 'translateY(-2px)'` | `hover:-translate-y-0.5` |

### Grid

| Inline Style | Tailwind Class |
|---|---|
| `display: 'grid'` | `grid` |
| `gridTemplateColumns: 'repeat(3, 1fr)'` | `grid-cols-3` |
| `gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'` | `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` |

## Migration Priority

Migrate these files first (highest traffic, most inline styles):

1. **LandingPage.tsx** — main homepage, ~300 lines of inline styles
2. **ProfessionLandingPage.tsx** — every profession page, ~700 lines
3. **DoctorLandingPage.tsx** — medical vertical, ~800 lines
4. **ProfessionSetup.tsx** — profession selection, ~250 lines
5. **SimpleLogin.tsx** — auth page, ~280 lines

## Migration Pattern

Replace inline style objects one property at a time:

```tsx
// BEFORE
<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px' }}>

// AFTER
<div className="flex items-center gap-3 p-6">
```

For dynamic/conditional styles, use template literals:

```tsx
// BEFORE
<div style={{ background: selected ? color : 'transparent' }}>

// AFTER
<div className={`${selected ? 'bg-indigo-500' : 'bg-transparent'}`}>
```

## Responsive Design

Replace media query CSS with Tailwind breakpoints:

```tsx
// BEFORE (in <style> tag)
// @media(max-width:768px) { .hero-grid { grid-template-columns: 1fr !important; } }

// AFTER
<div className="grid grid-cols-1 md:grid-cols-2">
```
