# VicheaPro Cultural Design Patterns & Assets
## Cambodian-Inspired Design Elements and Guidelines

---

## Table of Contents
1. [Khmer Pattern Library](#khmer-pattern-library)
2. [Angkor Wat Logo Concept](#angkor-wat-logo-concept)
3. [Icon System](#icon-system)
4. [Illustration Style](#illustration-style)
5. [Cultural Color Psychology](#cultural-color-psychology)
6. [Typography in Context](#typography-in-context)
7. [Photography Guidelines](#photography-guidelines)
8. [Do's and Don'ts](#dos-and-donts)

---

## 1. Khmer Pattern Library

### 1.1 Pattern Types

#### Lotus Pattern (ផ្កាឈូក)
**Sacred Symbol of Purity and Enlightenment**

```
SVG Pattern Description:

Repeating lotus motif in subtle geometric arrangement:
- Central lotus with 8 petals
- Simplified, modern interpretation
- Low opacity (5-10%) for backgrounds
- Gold color (#FFD700) at 8% opacity

Usage:
- Premium section backgrounds
- Business profile headers
- Success/confirmation screens
- Certificate/badge backgrounds

CSS Implementation:
.lotus-pattern-bg {
  background-image: url('/patterns/lotus-subtle.svg');
  background-repeat: repeat;
  opacity: 0.08;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}
```

**ASCII Representation:**
```
    ╱◠╲
   ╱    ╲
  ◠      ◠
  |  ☸  |     Lotus flower
  ◡      ◡     simplified
   ╲    ╱
    ╲◡╱
```

#### Geometric Khmer Pattern (គំនូររាង)
**Inspired by Angkor Wat Carvings**

```
SVG Pattern Description:

Interlocking diamond and square motifs:
- 8-pointed star geometry
- Traditional Khmer architectural details
- Angular, precise lines
- Red (#C8102E) at 6% opacity

Usage:
- Section dividers
- Card borders
- Premium badges
- Header decorations

Pattern Repeat: 64px × 64px

ASCII Representation:
◇─◇─◇─◇
│ ╳ │ ╳ │
◇─◇─◇─◇
│ ╳ │ ╳ │
◇─◇─◇─◇
```

#### Wave Pattern (រលក)
**Flowing Water and Movement**

```
SVG Pattern Description:

Smooth, organic wave forms:
- Inspired by Tonle Sap and Mekong River
- Flowing, horizontal waves
- Subtle gradients
- Blue (#003893) at 10% opacity

Usage:
- Page transitions
- Loading animations
- Section backgrounds
- Divider elements

CSS Animation:
@keyframes wave-flow {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.wave-pattern {
  animation: wave-flow 20s linear infinite;
}
```

#### Temple Border Pattern (ស៊ុមប្រាសាទ)
**Architectural Frame Motif**

```
SVG Pattern Description:

Ornate border inspired by temple architecture:
- Corner flourishes
- Repeating geometric elements
- Stepped pyramid details (representing temple levels)
- Can be gold, red, or blue

Usage:
- Important cards/panels
- Business PRO badges
- Certificate borders
- Modal frames

Border Width: 4-8px
Corner Detail: 16px × 16px
```

### 1.2 Pattern Usage Matrix

```
┌────────────────────────────────────────────────────┐
│ Screen/Component    │ Recommended Pattern         │
├────────────────────────────────────────────────────┤
│ Landing Hero        │ Lotus (very subtle)         │
│ Business Profile    │ Geometric Khmer             │
│ Premium Badge       │ Temple Border               │
│ Success Screen      │ Lotus + Gold                │
│ Loading Screen      │ Wave                        │
│ Section Divider     │ Geometric line              │
│ Certificate         │ Temple Border + Lotus       │
│ Modal Background    │ Lotus (subtle)              │
│ Footer              │ Geometric Khmer             │
│ Headers             │ Wave (top)                  │
└────────────────────────────────────────────────────┘
```

### 1.3 Pattern Opacity Guidelines

```css
/* Ultra Subtle - For main backgrounds */
.pattern-ultra-subtle {
  opacity: 0.03;
}

/* Subtle - For section backgrounds */
.pattern-subtle {
  opacity: 0.06;
}

/* Visible - For decorative elements */
.pattern-visible {
  opacity: 0.12;
}

/* Strong - For borders and accents */
.pattern-strong {
  opacity: 0.25;
}

/* Full - For icons and illustrations */
.pattern-full {
  opacity: 1.0;
}
```

---

## 2. Angkor Wat Logo Concept

### 2.1 Logo Design Specification

```
PRIMARY LOGO MARK:

┌────────────────────────────────┐
│                                │
│        ╔══╦══╗                │
│        ║  ║  ║                │  Three towers
│       ╔╬══╬══╬╗               │  of Angkor Wat
│       ║║▓▓║▓▓║║               │  (stylized)
│      ╔╬╬══╬══╬╬╗              │
│      ║║║▓▓║▓▓║║║              │  Central tower
│      ║║╚══╩══╝║║              │  is tallest
│      ╚══════════╝              │  (gold accent)
│                                │
│      VicheaPro                 │  Latin wordmark
│      វិជ្ជាប្រូ                  │  Khmer script
│                                │
└────────────────────────────────┘

COLOR SPECIFICATIONS:

Version 1 (Full Color):
- Outer towers: #C8102E (Cambodian Red)
- Central tower: #FFD700 (Temple Gold)
- Base: #003893 (Cambodian Blue)
- Text: #2D2520 (Dark Brown)

Version 2 (Red Primary):
- All towers: #C8102E
- Central accent: #FFD700
- Text: #2D2520

Version 3 (Monochrome White):
- All elements: #FFFFFF
- Use on dark backgrounds

Version 4 (Monochrome Black):
- All elements: #2D2520
- Use for print/documentation
```

### 2.2 Logo Construction Grid

```
Grid: 16 × 16 units

Tower Heights:
- Outer towers: 8 units
- Central tower: 12 units

Tower Widths:
- Each tower: 3 units
- Gap between: 1 unit

Base:
- Width: 14 units
- Height: 2 units

Clear Space:
- Minimum: 4 units on all sides

CONSTRUCTION GUIDE:

16 ┌───────────────────┐
14 │                   │
12 │     ╔═════╗       │  Central tower (tallest)
10 │     ║░░░░░║       │
 8 │  ╔══╬═════╬══╗    │  Side towers
 6 │  ║░░║░░░░░║░░║    │
 4 │  ║░░║░░░░░║░░║    │
 2 │  ║░░╚═════╝░░║    │
 0 │  ╚═══════════╝    │  Base
   └───────────────────┘
   0  2  4  8 12 14 16
```

### 2.3 Logo Variations

#### A. Full Horizontal Logo
```
┌──────────────────────────────────┐
│ [Icon] VicheaPro                 │
│        វិជ្ជាប្រូ                   │
└──────────────────────────────────┘
Width: 200px
Height: 60px
Use: Main header, marketing
```

#### B. Stacked Logo
```
┌──────────────┐
│   [Icon]     │
│              │
│  VicheaPro   │
│  វិជ្ជាប្រូ     │
└──────────────┘
Width: 120px
Height: 140px
Use: Mobile header, square spaces
```

#### C. Icon Only
```
┌──────────┐
│  ╔══╗    │
│  ║▓▓║    │
│  ╚══╝    │
└──────────┘
Size: 48×48px, 32×32px, 16×16px
Use: Favicon, app icon, avatar
```

#### D. Wordmark Only
```
┌──────────────┐
│  VicheaPro   │
│  វិជ្ជាប្រូ     │
└──────────────┘
Use: Footer, text-only contexts
```

### 2.4 Logo Safe Zone & Sizing

```
MINIMUM SIZES:

Print:
- Full logo: 30mm wide
- Icon only: 10mm

Digital:
- Full logo: 100px wide
- Icon only: 24px

SAFE ZONE:
┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░ │  Safe zone
│ ░ ┌─────────────────┐ ░ │  = height of logo
│ ░ │                 │ ░ │
│ ░ │     LOGO        │ ░ │
│ ░ │                 │ ░ │
│ ░ └─────────────────┘ ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────┘
```

### 2.5 Logo Don'ts

```
❌ DON'T:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [Logo]       │  │              │  │              │
│  Rotated     │  │ [Stretched]  │  │ [Outlined]   │
└──────────────┘  └──────────────┘  └──────────────┘
   Don't rotate     Don't distort    Don't outline

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │ Wrong Colors │  │ On busy bg   │
│ [Too small]  │  │ [Logo]       │  │ [Logo]≋≋≋≋   │
└──────────────┘  └──────────────┘  └──────────────┘
   Too small        Wrong colors     Poor contrast
```

---

## 3. Icon System

### 3.1 Icon Style Guidelines

**Design Principles:**
- 24×24px base size (1.5px stroke weight)
- Rounded corners (2px radius)
- Consistent line weight
- Outlined style (not filled)
- Khmer cultural touches where appropriate

### 3.2 Custom Icons

#### Services Icons

```
💇 Haircut / កាត់សក់
┌──────────┐
│  ┌─╮ ✂   │  Scissors with head silhouette
│  │ │     │
│  └─┘     │
└──────────┘

💆 Spa / ស្ប៉ា
┌──────────┐
│  ≈≈≈     │  Lotus flower + waves
│ ⚘ ≈≈≈    │
└──────────┘

🔧 Repair / ជួសជុល
┌──────────┐
│  ⚙ 🔧    │  Gear + wrench
│          │
└──────────┘

🎨 Art / សិល្បៈ
┌──────────┐
│  🎨      │  Palette with brush
│          │
└──────────┘
```

#### Status Icons

```
✓ Verified / បានបញ្ជាក់
╭────────────╮
│     ✓      │  Checkmark in circle
│    ╱ ╲     │  (gold or green)
│   ╱   ╲    │
│  ◯     ◯   │
╰────────────╯

⭐ Premium / ពិសេស
╭────────────╮
│     ★      │  Star with subtle glow
│   ╱ │ ╲    │  (gold color)
│  ╱  │  ╲   │
│ ◯───◯───◯  │
╰────────────╯

🟢 Open / បើក
╭────────────╮
│    ●       │  Green circle
│            │  (indicates open)
╰────────────╯

🔴 Closed / បិទ
╭────────────╮
│    ●       │  Red circle
│            │  (indicates closed)
╰────────────╯
```

#### Navigation Icons

```
🏠 Home / ទំព័រដើម
┌──────────┐
│  ╱‾‾╲    │  Simple house
│ │    │   │
│ └────┘   │
└──────────┘

🔍 Search / ស្វែងរក
┌──────────┐
│   ◯/     │  Magnifying glass
│     ╱    │
└──────────┘

📅 Bookings / ការកក់
┌──────────┐
│ ┌──────┐ │  Calendar with dots
│ │ • • •│ │
│ │ • • •│ │
│ └──────┘ │
└──────────┘

👤 Profile / គណនី
┌──────────┐
│   ╭─╮   │  User avatar
│   │ │   │
│   ╰─╯   │
│   ╱ ╲   │
└──────────┘
```

### 3.3 Icon Usage

```css
.icon {
  width: 24px;
  height: 24px;
  stroke-width: 1.5px;
  stroke: currentColor;
  fill: none;
}

.icon-sm {
  width: 16px;
  height: 16px;
  stroke-width: 1.5px;
}

.icon-lg {
  width: 32px;
  height: 32px;
  stroke-width: 1.5px;
}

.icon-filled {
  fill: currentColor;
  stroke: none;
}

/* Khmer-style icon (with cultural pattern) */
.icon-khmer {
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.3));
}
```

---

## 4. Illustration Style

### 4.1 Illustration Guidelines

**Style Characteristics:**
- Flat, minimalist design
- 2.5D isometric perspective for buildings
- Warm, approachable color palette
- Cambodian cultural elements integrated
- Line art with subtle gradients

**Color Usage:**
- Primary: Cambodian red (#C8102E)
- Secondary: Temple gold (#FFD700)
- Accent: Cambodian blue (#003893)
- Background: Cream tones (#FAF8F5, #F5F2ED)
- Skin tones: Varied, representative of Cambodian people

### 4.2 Character Illustrations

```
STYLE GUIDE:

Head:
- Round, friendly shape
- Simple facial features
- Smiling expressions
- Cambodian features

Body:
- Simplified, geometric shapes
- 2-3 color maximum per character
- Modern Cambodian clothing styles

Poses:
- Welcoming gestures
- Service-related activities
- Family groupings

┌───────────────────────────────┐
│     ╭───╮                     │  Example: Barber
│     │ ◠◠│ Friendly face        │
│     │ ◡ │                     │
│     ╰───╯                     │
│      ┊ ┊ Body                 │
│     ╱   ╲                     │
│    ╱     ╲                    │
│   ◯       ◯                   │
│  ✂ (Scissors in hand)         │
└───────────────────────────────┘
```

### 4.3 Scene Illustrations

#### Landing Page Hero
```
Scene Description:

Foreground:
- Cambodian family (parents + child)
- Looking at mobile phone together
- Smiling, engaged

Middle Ground:
- Simplified storefronts
- Khmer signage
- Business activity

Background:
- Angkor Wat silhouette (subtle)
- Palm trees
- Sunset/golden hour lighting

Color Palette:
- Warm golds and oranges
- Red accents
- Blue sky
- Cream buildings
```

#### Onboarding Illustrations

**Slide 1: Discovery**
```
╭──────────────────────────╮
│         🔍               │
│      ╱◯─◯─◯╲             │  Person browsing
│     │  📱  │            │  businesses on map
│     │      │            │
│     ╰──────╯            │
│    Multiple markers:    │
│    📍📍📍              │
╰──────────────────────────╯
```

**Slide 2: Booking**
```
╭──────────────────────────╮
│      ✓                   │
│   ╭────────╮             │  Calendar + time
│   │📅 □□□  │             │  selection
│   │  □■□  │             │  (selected date)
│   │  □□□  │             │
│   ╰────────╯             │
│   [Time slots]           │
╰──────────────────────────╯
```

**Slide 3: Trust**
```
╭──────────────────────────╮
│      ⭐⭐⭐⭐⭐           │  Star rating
│     ╭─────────╮          │
│     │ "Great!"│          │  Review bubble
│     ╰─────────╯          │
│       👤 👤 👤            │  Multiple users
│     Happy customers      │
╰──────────────────────────╯
```

### 4.4 Empty State Illustrations

```
No Bookings:
╭──────────────────────────╮
│       📅                 │
│    ╭─────────╮           │  Empty calendar
│    │         │           │  with gentle message
│    │    ?    │           │
│    ╰─────────╯           │
│  "No bookings yet"       │
│  [Make first booking]    │
╰──────────────────────────╯

No Results:
╭──────────────────────────╮
│       🔍                 │
│    ╭─────────╮           │  Magnifying glass
│    │    ∅    │           │  with empty space
│    ╰─────────╯           │
│  "No results found"      │
│  [Try different search]  │
╰──────────────────────────╯

Error State:
╭──────────────────────────╮
│       ⚠️                 │
│    ╭─────────╮           │  Warning symbol
│    │    !    │           │  with friendly tone
│    ╰─────────╯           │
│  "Oops! Something        │
│   went wrong"            │
│  [Try again]             │
╰──────────────────────────╯
```

---

## 5. Cultural Color Psychology

### 5.1 Color Meanings in Cambodian Culture

```
┌─────────────────────────────────────────────────┐
│ Color    │ Meaning          │ Usage in App     │
├─────────────────────────────────────────────────┤
│ Red      │ Bravery, Good    │ Primary actions, │
│ #C8102E  │ fortune, Joy     │ Important items  │
│          │                  │                  │
│ Gold     │ Prosperity,      │ Premium features,│
│ #FFD700  │ Royalty,         │ Success states,  │
│          │ Buddhism         │ Badges           │
│          │                  │                  │
│ Blue     │ Trust, Peace,    │ Information,     │
│ #003893  │ Loyalty          │ Secondary actions│
│          │                  │                  │
│ White    │ Purity, Peace,   │ Backgrounds,     │
│ #FFFFFF  │ Buddhism         │ Cards, Modals    │
│          │                  │                  │
│ Green    │ Growth, Life,    │ Success messages,│
│ #16A34A  │ Nature           │ Availability     │
│          │                  │                  │
│ Orange   │ Buddhism,        │ Accent elements, │
│ #F59E0B  │ Monks' robes     │ Warnings (soft)  │
└─────────────────────────────────────────────────┘
```

### 5.2 Color Combinations

**Primary Combinations:**
```
1. National Pride
   Red (#C8102E) + Blue (#003893)
   ■■■■ + ■■■■
   Use: Headers, navigation, branding

2. Prosperity
   Gold (#FFD700) + Red (#C8102E)
   ■■■■ + ■■■■
   Use: Premium features, celebrations

3. Trust & Peace
   Blue (#003893) + Cream (#FAF8F5)
   ■■■■ + ■■■■
   Use: Information sections, calm areas

4. Traditional Harmony
   Gold (#FFD700) + Blue (#003893) + Red (#C8102E)
   ■■■■ + ■■■■ + ■■■■
   Use: Logo, special occasions, headers
```

### 5.3 Days of the Week Colors

**Traditional Cambodian Belief:**
```
Each day has an associated color:

Sunday    → Red      #DC2626
Monday    → Yellow   #FFC41F
Tuesday   → Pink     #FF6879
Wednesday → Green    #16A34A
Thursday  → Orange   #F59E0B
Friday    → Blue     #003893
Saturday  → Purple   #7C3AED

Usage in App:
- Calendar visualization
- Booking date highlights (subtle)
- Cultural calendar view
- Optional: User can choose to see traditional colors
```

---

## 6. Typography in Context

### 6.1 Khmer Script Best Practices

```
LINE HEIGHT:
Body Text:  1.7 (increased for Khmer)
Headings:   1.4

LETTER SPACING:
Khmer text: 0.01em (slight increase)
Numbers:    Default

FONT SIZE MINIMUM:
Mobile:  16px (body), 14px (captions)
Desktop: 16px (body), 14px (captions)

MIXING SCRIPTS:
Example: "កាត់សក់ Haircut"
- Keep consistent baseline
- Use same font weight
- Maintain color consistency
```

### 6.2 Text Hierarchy Examples

```
┌─────────────────────────────────┐
│ DISPLAY (48px/700)              │  Page titles
│ ស្វាគមន៍មកកាន់ VicheaPro        │
│                                 │
│ H1 (32px/600)                   │  Section headers
│ ស្វែងរកអាជីវកម្ម                 │
│                                 │
│ H2 (28px/600)                   │  Subsection
│ អាជីវកម្មពេញនិយម                 │
│                                 │
│ H3 (24px/600)                   │  Card titles
│ ហាងកាត់សក់ VIP                  │
│                                 │
│ Body (16px/400)                 │  Body text
│ ហាងកាត់សក់ជំនាញខ្ពស់មានបទពិសោធន៍│
│ ជាង 10 ឆ្នាំ...                  │
│                                 │
│ Caption (14px/400)              │  Small text
│ បានបន្ថែមកាលពី 2 ថ្ងៃមុន         │
└─────────────────────────────────┘
```

### 6.3 Number Formatting

```
CURRENCY:
Khmer Riel: 15,000៛
US Dollar:  $3.75
Combined:   15,000៛ ($3.75)

PHONE NUMBERS:
+855 12 345 678   (with spaces)
+85512345678      (without spaces - database)

DATES:
Gregorian: ថ្ងៃពុធ ១៥ តុលា ២០២៥
Short:     15/10/2025
Time:      15:00 (24-hour format)

RATINGS:
4.9 ⭐ (324 ការវាយតម្លៃ)
```

---

## 7. Photography Guidelines

### 7.1 Photo Style

**Characteristics:**
- Natural, bright lighting
- Warm color temperature
- Authentic Cambodian settings
- Diverse age groups
- Professional but approachable

### 7.2 Subject Matter

#### People Photos

```
DO:
✓ Cambodian people in natural poses
✓ Genuine smiles and expressions
✓ Modern clothing styles
✓ Diverse age groups (family-oriented)
✓ Professional service providers
✓ Group and individual shots

DON'T:
✗ Overly posed or stock-photo-looking
✗ Only young people (include elders)
✗ Western-centric imagery
✗ Disrespectful poses or gestures
✗ Over-edited or filtered photos
```

#### Location Photos

```
DO:
✓ Modern Cambodian businesses
✓ Clean, well-lit spaces
✓ Cultural decorative elements
✓ Urban and traditional settings
✓ Identifiable Cambodian context
✓ High-quality interior shots

DON'T:
✗ Cluttered or messy spaces
✗ Generic international locations
✗ Dark or poorly lit photos
✗ Fake or staged setups
```

#### Service Photos

```
DO:
✓ Actual service in progress
✓ Professional tools/equipment
✓ Before/after examples
✓ Staff performing services
✓ Customer satisfaction

DON'T:
✗ Stock service photos
✗ Generic industry imagery
✗ Low-quality mobile photos
✗ Blurry or out-of-focus shots
```

### 7.3 Photo Treatment

```css
/* Consistent photo treatment */
.photo-treatment {
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}

/* Subtle warm overlay for consistency */
.photo-treatment::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 215, 0, 0.02),
    rgba(200, 16, 46, 0.02)
  );
  pointer-events: none;
}

/* Photo aspect ratios */
.photo-square { aspect-ratio: 1 / 1; }
.photo-card { aspect-ratio: 4 / 3; }
.photo-hero { aspect-ratio: 16 / 9; }
.photo-portrait { aspect-ratio: 3 / 4; }
```

---

## 8. Do's and Don'ts

### 8.1 Cultural Sensitivity

```
✅ DO:

1. Religious Respect
   - Handle Buddhist imagery with care
   - Place sacred symbols respectfully (not low on page)
   - Use lotus flowers appropriately
   - Respect temple imagery

2. Gestures and Body Language
   - Welcoming, open gestures
   - Hands in prayer position (appropriate contexts)
   - Respectful bowing/greeting poses

3. Family and Community
   - Show multi-generational families
   - Emphasize trust and community
   - Include elderly people respectfully
   - Show group harmony

4. Language
   - Khmer as primary language
   - Formal tone for elders/professionals
   - Respectful forms of address
   - Accurate translations

5. Local Context
   - Show Cambodian locations
   - Use local business examples
   - Reference familiar landmarks
   - Seasonal considerations (monsoon, festivals)
```

```
❌ DON'T:

1. Disrespectful Imagery
   - Feet pointing at people/objects
   - Buddha imagery in inappropriate contexts
   - Finger-pointing gestures
   - Touching heads in photos
   - Disrespectful poses with temples

2. Inappropriate References
   - Political imagery or statements
   - Sensitive historical topics
   - Religious controversies
   - Ethnic stereotypes

3. Cultural Misrepresentation
   - Generic "Asian" imagery
   - Thai/Vietnamese culture confusion
   - Outdated stereotypes
   - Western-centric design

4. Language Mistakes
   - Machine-translated Khmer (get native review)
   - Mixing formal/informal inappropriately
   - Ignoring honorifics
   - Poor Khmer font rendering

5. Design Faux Pas
   - Overly ornate, "exotic" styling
   - Fake gold textures
   - Tacky temple imagery
   - Cultural appropriation
```

### 8.2 Design Balance

```
BALANCE TRADITIONAL AND MODERN:

Too Traditional:
┌──────────────────┐
│ ⚜⚜⚜ ★ ⚜⚜⚜     │  Overly ornate
│ ╔═══════════╗   │  Too much decoration
│ ║🏛 Text 🏛 ║   │  Looks dated
│ ╚═══════════╝   │
└──────────────────┘
❌ Feels old-fashioned, hard to read

Too Modern:
┌──────────────────┐
│                  │  No cultural identity
│    Text          │  Generic design
│                  │  Could be anywhere
│                  │
└──────────────────┘
❌ Loses Cambodian character

Just Right:
┌──────────────────┐
│ ┌───┐            │  Subtle pattern
│ │🏛│ Text        │  Modern layout
│ └───┘            │  Cultural accent
│ (subtle pattern) │  Clean and clear
└──────────────────┘
✅ Modern with cultural touchpoints
```

### 8.3 Accessibility Considerations

```
COLOR CONTRAST:
✓ Primary red on cream: 7.2:1 (AAA)
✓ Primary text on cream: 12.5:1 (AAA)
✓ Secondary text on cream: 7.1:1 (AAA)
✗ Gold on cream: 2.8:1 (Fail - use with caution)

SOLUTIONS:
- Use gold for accents only
- Add dark borders/backgrounds when needed
- Test with contrast checker tools

KHMER TEXT READABILITY:
✓ Minimum 16px on mobile
✓ Increased line height (1.7)
✓ Clear, modern Khmer fonts
✓ Adequate letter spacing
✓ High contrast

TOUCH TARGETS:
✓ Minimum 44×44px
✓ Spacing between elements
✓ Easy to tap with thumb
✓ Visual feedback on press
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Add Khmer fonts to project
- [ ] Create SVG pattern files
- [ ] Set up CSS custom properties
- [ ] Implement logo variations
- [ ] Create icon sprite sheet

### Phase 2: Components
- [ ] Apply patterns to components
- [ ] Implement cultural color system
- [ ] Add Khmer typography styles
- [ ] Create illustration library
- [ ] Build photo treatment system

### Phase 3: Content
- [ ] Gather authentic Cambodian photos
- [ ] Create custom illustrations
- [ ] Write culturally appropriate copy
- [ ] Translate to Khmer (native speakers)
- [ ] Review with Cambodian users

### Phase 4: Polish
- [ ] Test with Cambodian users
- [ ] Verify cultural appropriateness
- [ ] Check accessibility standards
- [ ] Optimize patterns for performance
- [ ] Document usage guidelines

---

## Resource Links

### Fonts
- Kantumruy Pro: https://fonts.google.com/specimen/Kantumruy+Pro
- Battambang: https://fonts.google.com/specimen/Battambang
- Noto Sans Khmer: https://fonts.google.com/noto/specimen/Noto+Sans+Khmer

### Cultural References
- Angkor Wat Architecture
- Cambodian Flag Colors
- Traditional Khmer Patterns
- Buddhist Symbolism

### Design Tools
- Khmer Unicode: https://www.unicode.org/charts/PDF/U1780.pdf
- Pattern Generators
- SVG Optimizers
- Accessibility Checkers

---

## Summary

This cultural design system ensures VicheaPro:

1. **Respects Cambodian Culture**: Authentic, appropriate imagery and patterns
2. **Modern Yet Traditional**: Balances heritage with contemporary design
3. **Accessible**: High contrast, readable Khmer text, touch-friendly
4. **Distinctive**: Unique visual identity tied to Cambodian culture
5. **Professional**: High-quality, trustworthy appearance

By following these guidelines, VicheaPro will create a booking platform that Cambodian users recognize as their own - modern, professional, and deeply rooted in their culture.
