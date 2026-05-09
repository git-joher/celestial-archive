# Golden Inscriptions — Send Messages to Sun Wukong

**Date:** 2026-05-08  
**Status:** Approved  
**Target audience:** English-speaking (Chinese text for artistic decor only)

## Overview

Add a 6th section to the Sun Wukong hub page where users can inscribe text messages to the Monkey King. Messages are stored in `localStorage` — no backend. The interaction is framed as a ritual: user sends a message, which animates through a "cloud flight → golden touch" sequence before joining a permanent "stone inscriptions" gallery.

## Architecture

Three sub-components within one new `<section>` block in `deities/sun-wukong/index.html`:

### 1. Inscription input area (static UI)

- Dark background (`var(--bg-dark)`) to bridge the existing related-deities section
- Ornamented text input: gold-gradient border, cloud-pattern corner decor, placeholder "Write your message to the Monkey King..."
- Submit button styled as gold CTA: "Send to the Great Sage"
- Section title: decorative h2 with ornaments (reuse `.section-title` + `.title-ornament`)

### 2. Animation overlay (triggered on send)

A full-screen overlay plays a 3-step CSS animation (~3s total):

1. **Cloud Flight** — text rises from the input, wrapped in a CSS cloud-particle effect, curving toward the upper-right
2. **Golden Touch** — a gold beam (Jingu Bang visual motif) strikes down, text shifts from white → gold
3. **Inscribed** — golden text descends to the gallery area, fades in as a new inscription card

The overlay blocks interaction during animation. Implemented as an inline `<script>` at the page bottom (consistent with the project's inline-style convention).

### 3. Stone inscription gallery (persistent list)

- Each message is a card: dark stone texture background, gold text, right-aligned timestamp
- Newest first, fade-in entrance
- Rendered from `localStorage` on page load

## Data model

**localStorage key:** `celestial-archive-messages`

```json
[
  { "id": "uuid-like", "text": "Are you really equal to heaven?", "timestamp": 1746700000000 }
]
```

- No message limit, no delete functionality (YAGNI)
- Read on `DOMContentLoaded`, write on send

## Implementation notes

- All changes in `deities/sun-wukong/index.html` — one new section block + one inline `<script>` for animation logic
- Reuse existing CSS custom properties (colors, fonts, spacing, radius, shadows)
- `js/main.js` is NOT modified — the page-specific script is inline, matching the project pattern
- Section HTML uses English for all functional text; Chinese characters appear only as artistic decor (e.g., 金石 as a decorative watermark)

## Scope

| Included | Excluded |
|----------|----------|
| Input UI, animation overlay, inscription gallery | Backend / API |
| localStorage persistence | Message deletion |
| Send + replay (page reload shows history) | Message reply, threading |
| Desktop + mobile responsive | Character limit (free text) |
