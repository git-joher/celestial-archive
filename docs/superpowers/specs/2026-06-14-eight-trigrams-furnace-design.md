# Eight Trigrams Furnace (八卦炉) — Game Design Spec

**Date:** 2026-06-14  
**Status:** Design approved, pending implementation  
**Slug:** `eight-trigrams-furnace`  
**URL:** `https://celestial-archive.com/games/eight-trigrams-furnace/`

---

## Overview

Relive Sun Wukong's ordeal inside Taishang Laojun's Eight Trigrams Furnace. Survive three waves of Samadhi Fire, make life-or-death choices, and emerge with the legendary Fiery Golden Eyes — or be consumed by the flames.

**Genre:** Wave survival dodge + narrative choice branches  
**Duration:** 3–5 minutes per session  
**Platform:** Static HTML/CSS/vanilla JS, desktop + mobile

---

## Game Flow

```
[Cover] → [Wave 1: Samadhi Fire 60s] → [Choice ①] → [Wave 2: Trigram Wheel 60s] → [Choice ②] → [Wave 3: Furnace Breaks 60s] → [Ending]
```

### Cover (10s)
- Dark background, furnace slowly illuminates, flames rise from base
- Title: "八卦炉 · Eight Trigrams Furnace"
- Subtitle: "炼就火眼金睛，还是化为灰烬？"
- Button: "入炉受炼 Enter the Furnace"
- Shows unlocked endings count: "已解锁 X/3"

### Wave 1: Samadhi Fire (三昧真火, ≈60s, tutorial difficulty)
- 3 trigram positions spawn fire orbs at 1.8s intervals
- Slow projectile speed, easy to dodge
- Hit deals 8 damage (HP starts at 100)
- Narrative text fades in: "三昧真火扑面而来，八卦炉中无处可逃..."

### Choice ① (15s, combat paused)
- 🔵 **Hide in Wind's Eye (躲进巽位风眼)** — 20% damage reduction in Wave 2, lose 1 Qi
- 🔴 **Swallow the Golden Pill (硬抗烈火吞金丹)** — Restore 30% HP, but fire is more intense in Wave 2

### Wave 2: Trigram Wheel (八卦轮转, ≈60s, medium difficulty)
- 5 spawners, 1.2s intervals, speed increased
- 3 smoke clouds drift across the arena, partially obscuring vision
- Trigram ring begins slow rotation
- Furnace walls flash red as warning before fire spawns
- Damage per hit: 12

### Choice ② (15s)
- 🔵 **Circulate Inner Qi (运转内息)** — Movement speed +30% for Wave 3
- 🔴 **Shake the Furnace (撼动炉壁)** — Wave 3 shortened by 15s, but fire density increased

### Wave 3: Furnace Breaks (炉破天惊, ≈60s, max difficulty)
- 7 spawners, 0.8s intervals, fast projectiles
- Golden cracks appear on furnace walls (safe zones with brief invulnerability)
- Last 10 seconds: screen shakes, massive cracking
- Survive → Ending
- Damage per hit: 16

### Endings (3 outcomes)

| Ending | Condition | Title |
|--------|-----------|-------|
| **Fiery Golden Eyes** 🏆 | HP > 40% AND Choice①=Swallow Pill AND Choice②=Circulate Qi | 火眼金睛 |
| **Cloud Escape** ⚠️ | HP > 0 AND NOT meeting Fiery Golden Eyes condition | 劫后余生 |
| **Nirvana in Furnace** 💀 | HP = 0 | 炉中涅槃 |

---

## Visual Design — Cinematic Immersion

### Perspective
Third-person view from inside the furnace, looking outward toward the curved furnace walls. Deep cave-like perspective with depth.

### 5 Depth Layers

| Layer | Content | Technique |
|-------|---------|-----------|
| L1 Deep BG | Curved copper furnace walls, dark warm gradient | Canvas `radialGradient` |
| L2 Wall | Eight trigram reliefs in recessed wall alcoves, golden light pulsing along trigram lines | Canvas `fillText` + `shadowBlur` |
| L3 Fire | Fire orbs/projectiles erupting from trigram positions, with trailing particle tails | Canvas particle system (~200 particles) |
| L4 Core | Sun Wukong (player) — translucent golden silhouette with protective Qi halo | Canvas sprite |
| L5 Foreground | Floating embers, sparks, dense smoke clouds (vision obstruction) | Canvas particles + `globalAlpha` |

### Cinematic Effects

| Effect | Description | Implementation |
|--------|-------------|----------------|
| Fire particles | Orange→red→dark gradient particles from trigram positions with trailing tails | Canvas particle pool, per-frame update |
| Trigram glow | Intermittent golden halos around trigram symbols, like molten metal flowing | `shadowBlur` + sine-wave opacity |
| Heat distortion | Air shimmer above furnace core | Periodic displacement offset |
| Smoke clouds | Purple-grey translucent clouds rising from furnace base, slow drift | Large radial gradient + random drift vectors |
| Wall cracks | Golden cracks appear in Wave 3, external light beams in | Random Bézier curves + strong `shadowBlur` |
| Screen shake | Random offset on hit | CSS `transform: translate()` jitter |
| Vignette | Dark corners focusing on furnace center | Canvas `radialGradient` overlay |
| HP pulse | Red edge flash on damage | Semi-transparent red overlay + CSS transition |

### Color Palette (Cinematic Grade)

```
Furnace wall dark    #1a1010 → #2a1a0a    (warm dark)
Fire highlight       #ff4400 → #ffaa00    (flame bright)
Fire shadow          #cc2200 → #661100    (flame dark)
Trigram gold         #ffd700              (pure gold)
Smoke                rgba(60,40,70,0.4)   (purple-grey fog)
Qi halo              rgba(255,200,100,0.3) (Wukong's aura)
Crack light          #ffeebb              (external light)
```

Uses existing design system tokens (`--accent-vermillion`, `--accent-gold`, etc.) where applicable.

---

## Technical Architecture

### File Structure

```
games/eight-trigrams-furnace/
├── index.html          # Main game page (head, canvas, overlays, scripts)
├── css/
│   └── furnace.css     # DOM UI styles (HP bar, choice modals, ending screen, cover)
└── js/
    └── furnace.js      # All game logic (Canvas render, particles, waves, collision, endings)
```

### Canvas Render Pipeline (60fps via requestAnimationFrame)

```
1. clearCanvas()
2. drawFurnaceWalls()      // L1 — curved copper walls
3. drawTrigramRing()       // L2 — trigram reliefs with sine-wave gold glow
4. drawCracks()            // L2.5 — golden cracks (Wave 3 only)
5. drawFireProjectiles()   // L3 — active fire orbs
6. drawParticlePool()      // L3+L5 — fire tails, embers, sparks
7. drawSmokeClouds()       // L5 — drifting smoke
8. drawPlayer()            // L4 — Wukong silhouette + Qi halo
9. drawVignette()          // L1 — corner darkening overlay
10. applyScreenShake()     // Random offset when hit
```

### Game State Machine

```
States: IDLE → INTRO → WAVE_1 → CHOICE_1 → WAVE_2 → CHOICE_2 → WAVE_3 → ENDING

IDLE      → cover display, wait for "Enter Furnace" click
INTRO     → opening animation (furnace door closes, flames rise) 3s
WAVE_N    → 60s countdown, fire orbs spawn, player dodges
CHOICE_N  → combat pauses, two-option scroll modal
ENDING    → display outcome based on final state
```

### Wave Configuration

```js
const WAVE_CONFIG = {
  1: { spawners: 3, speed: 1.2, interval: 1800, damage: 8,  smoke: 0 },
  2: { spawners: 5, speed: 1.8, interval: 1200, damage: 12, smoke: 3 },
  3: { spawners: 7, speed: 2.4, interval: 800,  damage: 16, smoke: 5 },
};
```

### Controls

| Platform | Method | Mapping |
|----------|--------|---------|
| Desktop | WASD / Arrow keys | 8-direction movement, hold for speed |
| Mobile | Touch drag | `touchmove` delta → player position, inertia decay |
| Choices | Click / Tap | Two scroll cards, tap to select |

### Data Persistence

```js
localStorage keys:
  'eight-trigrams-furnace-endings'   // ['fire-eyes', 'cloud-escape', 'nirvana']
  'eight-trigrams-furnace-best'      // { ending, hp_remaining, date }
```

- Error handling: `try/catch` around all localStorage access, silent degradation if unavailable
- Unlocked endings shown on cover as "已解锁 X/3"

### Performance

- Particle pool pre-allocated, object reuse, zero GC pressure
- No `getImageData` calls — pure drawing only
- `devicePixelRatio` capped at 2x on mobile
- `requestAnimationFrame` auto-pauses when tab hidden
- Target: stable 60fps on desktop, 30fps+ on mobile

### Cross-Page Easter Egg

When `fire-eyes` ending is unlocked, `/deities/sun-wukong/arsenal.html` shows a subtle link at the bottom of the page:

> *"那双眼睛，曾在八卦炉中炼就。"* → links to the furnace game

Implementation: `main.js` checks localStorage key, conditionally appends the element.

---

## Registration Update

Update the existing entry in `js/deities.js`:

```js
// Change status from 'coming' to 'live'
{
  slug: 'eight-trigrams-furnace',
  nameZh: '八卦炉',
  nameEn: 'Eight Trigrams Furnace',
  description: '...',  // Update description to match survival genre
  status: 'live',       // ← change
  image: 'images/taishang-laojun/tl-furnace.jpg'
}
```

---

## Sitemap

Add to `sitemap.xml`:

```xml
<url>
  <loc>https://celestial-archive.com/games/eight-trigrams-furnace/</loc>
  <lastmod>2026-06-14</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```
