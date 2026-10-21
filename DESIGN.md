# Design Brief

## Direction

ACCESSAI — Adaptive AI Core — a dark, high-contrast accessibility dashboard where a central AI core routes users to four support pathways.

## Tone

Calm futuristic instrument panel: deep navy surfaces, one vivid mint accent, generous space, zero decoration for decoration's sake.

## Differentiation

A living "AI core" orb with orbiting labeled nodes anchors the home screen, turning accessibility routing into a confident, spatial choice rather than a form.

## Color Palette

| Token      | OKLCH         | Role                                          |
| ---------- | ------------- | --------------------------------------------- |
| background | 0.16 0.022 245 | Deep navy app canvas                          |
| foreground | 0.94 0.012 230 | Primary text, near-white                     |
| card       | 0.2 0.025 245  | Elevated panels, pathway cards                |
| primary    | 0.82 0.16 165  | Mint accent: CTAs, active states, highlights  |
| accent     | 0.72 0.14 200  | Cool cyan secondary: links, orb glow          |
| muted      | 0.26 0.03 245  | Inactive surfaces, secondary text (0.66 L)    |

## Typography

- Display: Space Grotesk — hero headlines, module titles, numeric indices
- Body: Plus Jakarta Sans — paragraphs, labels, controls
- Mono: JetBrains Mono — code, timestamps, technical badges
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base md:text-lg`

## Elevation & Depth

Dark layered surfaces: background < card < popover, separated by 1px borders plus soft `shadow-elevated`; the AI core uses a mint radial glow, never harsh neon.

## Structural Zones

| Zone    | Background           | Border      | Notes                                        |
| ------- | -------------------- | ----------- | -------------------------------------------- |
| Header  | bg-card              | border-b    | Active module name + settings controls       |
| Sidebar | bg-sidebar           | border-r    | Grouped nav: Workspace / Tools / Privacy     |
| Content | bg-background        | —           | Alternate `bg-muted/30` between sections     |
| Footer  | bg-muted/40          | border-t    | Local-first + AI-capability disclosures      |

## Spacing & Rhythm

Sections use `py-16 md:py-24`; content max-width `max-w-6xl` with `px-4 md:px-8`; cards pad `p-6`; grid gaps `gap-5 md:gap-6`; micro-spacing in `space-y-2`/`space-y-4` steps.

## Component Patterns

- Buttons: rounded-full pills, `bg-primary text-primary-foreground`, hover brightens + `shadow-elevated`, focus ring visible
- Cards: `rounded-2xl bg-card border border-border`, hover lifts with `shadow-elevated` and border-primary/40
- Badges: rounded-full, `bg-primary/12 text-primary` for AI-powered; muted outline for browser-feature labels

## Motion

- Entrance: `animate-fade-in-up` staggered on hero and pathway cards (0.5s, cubic-bezier)
- Hover: `transition-smooth` lift + border tint on cards and buttons (0.3s)
- Decorative: `animate-pulse-soft` on AI core glow, `animate-orbit-spin` on orbit rings; all disabled under `prefers-reduced-motion`

## Constraints

- Never use raw hex/rgb in components — semantic tokens only (`bg-primary`, `text-foreground`)
- High-contrast mode (`.high-contrast`) and four text-scale steps (`html.text-scale-1..4`) must work on every page
- Every interactive element keyboard-reachable with visible `:focus-visible` ring; skip-to-content link present
- Only bundled fonts: Space Grotesk, Plus Jakarta Sans, JetBrains Mono
- No purple-gradient clichés; one dominant mint accent, max 5 core colors

## Signature Detail

The rotating AI core orb with orbiting, labeled capability nodes — the app's identity mark and its navigation metaphor in one element.
