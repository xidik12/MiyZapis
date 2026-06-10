# MiyZapis — Outline Design Language

## v2 — ProfiHub LAYOUT/STYLE, OUR colors (OVERRIDES sections below where they conflict)
Reference: ProfiHub UA — adopt its structure, spacing, typography and minimal premium feel,
but keep MiyZapis sky-blue as the brand. (ProfiHub uses black CTAs; we use our blue instead.)
- **Primary action color = our sky-blue** (`primary-600`), white text. ALL primary CTAs are blue
  (header "Get started", search "Find services", "View profile", form submits). NOT black.
- **Blue is also the link/active/selected/focus color** — "120+ professionals" links, "Browse all",
  selected radio/time-slot, active stepper node, focus rings. One blue, used consistently.
- **Section bands are neutral** — white + soft `gray-50` (`#F7F8F9`), NOT light-blue. Dark: gray-950/900.
  (Blue shows only as CTAs/links/accents over the neutral canvas — clean, premium.)
- **Headlines: bold + tight** — `font-extrabold tracking-tight`, large. Black in light, white in dark.
- **Radii:** cards `rounded-2xl` (16px), buttons/inputs `rounded-lg`→`rounded-xl`, pills `rounded-full`.
- **Cards:** white, 1px `gray-200` border, no shadow (outline). Floating cards over media = solid white + soft shadow.
- **Tags/chips:** light `gray-100` `rounded-full` pills, `gray-700` text.
- **Status:** green dot + light-green pill ("Available now"); verified = blue check; stars = amber.
- **Hero:** light split — left (badge, big black headline, subtext, search+location, trust avatars+stars),
  right (photo + floating solid specialist card). Replaces the aurora gradient hero.
- The earlier floating-GLASS service cards are replaced by clean solid outline cards to match the reference.

---


Redesign contract. The goal: a **simple, professional outline aesthetic**. Structure is
carried by **1px borders and whitespace**, not by shadows, bevels, or glass. Calm, legible,
easy to scan. Motion is subtle and motivated.

This replaces the previous skeuomorphic system (3D bevels, glassmorphism, cute wobble/squish).

## Dials
- VARIANCE 5 · MOTION 4 · DENSITY 4 — clean B2C/B2B product, not experimental.

## Color (locked — brand preserved)
- **Accent (the only accent): sky blue** `primary-600 #2678e7` for fills, `primary-500` for
  focus rings/links. Used identically on every surface. Do not introduce a second accent per page.
- **Yellow** (`secondary`) is demoted to a rare highlight only (e.g. rating stars). Never a
  primary action color, never a background wash.
- **Neutrals:** gray ramp. Light bg `gray-50`, surfaces `white`. Dark bg `gray-950`, surfaces `gray-900`.
- **Borders:** `gray-200` light / `gray-800` dark. Hover border `gray-300` / `gray-700`.
- **Text:** ink `gray-900` / `gray-50`; body `gray-600` / `gray-300`; muted `gray-500` (must stay ≥4.5:1).

## Surfaces — borders over shadows
- Cards/panels: **solid** `bg-white dark:bg-gray-900`, `border border-gray-200 dark:border-gray-800`,
  **no shadow** at rest. NO `backdrop-blur`, NO translucent `/80` fills, NO glass.
- Shadows are reserved for **floating overlays only** (dropdown, modal, toast, popover): a single
  soft neutral-tinted shadow (`shadow-md`/`shadow-lg`). Never on inline cards.
- Hover on interactive cards: border darkens + faint bg tint (`hover:bg-gray-50`). No lift, no scale.

## Signature exception — floating glass service cards
The ONE deliberate glass moment. Service cards (the landing "popular services" grid and the
service tiles on business/specialist pages) use real frosted glass to feel premium. Done right,
per skill guidance — never a lazy `backdrop-blur`:
- Sit them over a **tinted/gradient backdrop** (soft sky-blue mesh) so the blur refracts something.
- `.glass-card-float`: `backdrop-filter: blur(16px) saturate(140%)`, translucent fill, **1px inner
  white border** (`border-white/40`) + **inset top highlight** for a real glass edge, soft tinted shadow.
- Gentle **float**: a slow ~6s `translateY` bob, staggered per card, `transform`/`opacity` only.
  Hover lifts a touch more. Honors `prefers-reduced-motion` (no bob) and provides a **solid-fill
  fallback** under `prefers-reduced-transparency`.
- This is the exception, scoped to service cards. Everywhere else stays clean outline.

## Radius (one scale, two tiers — documented rule)
- Containers/buttons/inputs: `rounded-xl` (0.75rem) everywhere. Consistent.
- Pills (badges, toggles, chips, segmented controls): `rounded-full`.
- Nothing else. No mix of sm/2xl on peers.

## Buttons
- **Primary:** solid `bg-primary-600 text-white hover:bg-primary-700`. No shadow glow. Press `active:scale-[0.98]`.
- **Secondary / outline:** `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 hover:bg-gray-50`.
- **Ghost:** transparent, `hover:bg-gray-100 dark:hover:bg-gray-800`.
- **Destructive:** solid `bg-error-600`.
- Always `focus-visible:ring-2 ring-primary-500 ring-offset-2`. Text fits one line. Label = verb + object.

## Inputs
- Flat: `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl`.
  NO inset/sunken shadow, NO backdrop-blur.
- Focus: `border-primary-500 ring-2 ring-primary-500/30`. Label **above** input. Error **below**.
- 16px font on mobile (no iOS zoom). Placeholder ends with `…` where it shows a pattern.

## Motion (MOTION 4 — restrained, motivated)
- Default transition: `transition-colors duration-150` (border/bg) + `transition-transform`.
- Press feedback: `active:scale-[0.98]` on buttons only.
- Landing sections: `whileInView` fade-up (opacity + 16px y), `once`, ~0.5s, ease-out. Stagger lists.
- Animate only `transform`/`opacity`. No `transition: all`. Every animation honors
  `prefers-reduced-motion`. NO infinite loops on content, NO wobble/squish/bounce/tilt/float on UI.

## Icons
- Keep existing `lucide-react` + `@heroicons/react` (project already depends on them). One weight,
  outline style (matches the language). Decorative icons `aria-hidden`. Icon-only buttons get `aria-label`.

## Banned (carried from skeuomorphic system — remove on sight)
- `backdrop-blur`, glass fills (`bg-white/80`), `shadow-glass`, `shadow-glow`, neumorphism.
  **Exception:** the `.glass-card-float` service-card treatment above is intentional and stays.
- 3D bevels / inset highlights, `body { perspective }`, `data-tilt`, `[data-float]`, cursor-tilt.
- Cute classes: `cute-wobble/pop/bounce/heartbeat/breathe`, auto squish, `deco-orb` washes on UI.
- Gradient text, side-stripe accent borders >1px, AI-purple, oversized shouting H1s.

## A11y / quality gates
- WCAG AA contrast on all text incl. placeholders. Visible `:focus-visible` everywhere.
- `<button>` for actions, `<a>`/`<Link>` for navigation. One `<h1>` per page, ordered headings.
- Dark mode parity: every surface defined in both modes. `min-h-[100dvh]` not `h-screen`.
