---
name: Elora
description: Elevated, minimal D2C western wear storefront — quiet confidence over decoration
colors:
  ink: "#0b1220"
  paper: "#ffffff"
  gold: "#ffbf00"
  warm-sand: "#f5f1e8"
  signal-green: "#008000"
typography:
  display:
    fontFamily: "Montserrat, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.8rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0px"
  card: "8px"
  pill: "40px"
spacing:
  grid: "8px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  input-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Elora

## 1. Overview

**Creative North Star: "The Quiet Confidence"**

Elora is a wardrobe edit, not a sale rack. Every screen behaves like a
tightly curated selection: white space does real work, one accent color
carries the eye, and nothing on the page is decorating for its own sake.
Confidence here means not needing to shout — direct product photography,
short copy, and a single gold accent stand in for the loud gradients and
stacked badges a discount-driven fashion site would reach for by default.

This system explicitly rejects the generic-Shopify-Dawn look: unmodified
stock section layouts, template-y equal-size card grids, and default
spacing rhythm that reads as "theme with products dropped in." It also
rejects cold, corporate-SaaS minimalism — restraint here is warm and
tactile (real photography, a pill-shaped gold button, a signature heart
mark), not clinical.

**Key Characteristics:**
- White paper background, near-black ink text, one gold accent — no secondary/tertiary color competing for attention
- Pill-shaped buttons (40px radius) against perfectly square inputs (0px radius) — a deliberate, repeatable contrast
- Flat by default: no drop shadows on buttons or cards at rest
- Motion is responsive, not choreographed — feedback on interaction, not orchestrated scroll sequences

## 2. Colors

A near-monochrome system (white / near-black) with a single warm accent doing all the color work.

### Primary
- **Signal Gold** (#ffbf00): The only saturated color in the system. Primary CTAs, active wishlist state, price emphasis. Used sparingly — if more than one element per screen is gold, it's over-used.

### Neutral
- **Ink** (#0b1220): Primary text color and the dark half of the button pair (secondary/inverse buttons). Reads as near-black, not pure black — softer than `#000`.
- **Paper** (#ffffff): Primary background. The default canvas everything sits on.
- **Warm Sand** (#f5f1e8): Secondary section background (scheme-2) — for sections that need to separate from pure white without introducing a new hue.

### Utility
- **Signal Green** (#008000): Reserved for success/confirmation states (scheme-3) only — not a decorative color.

### Named Rules
**The One Accent Rule.** Gold is the only saturated color allowed on a screen. If a new component needs a second color to feel "finished," the fix is more restraint (whitespace, weight, size), not a second hue.

**The No-Drift Rule.** Custom sections built outside this system (`shop-by-collection.liquid`, `watch-and-buy.liquid`, `testimonials.liquid`, `trust-strip.liquid`) currently hardcode a blush/pastel palette (`#E75480`, `#FDF3F0`, `#3A2E2B`) that predates this spec. Don't extend that palette into new work — new sections should draw color from scheme-1/scheme-2 tokens above. Migrate the existing sections to these tokens when they're next touched.

## 3. Typography

**Display Font:** Montserrat (bold, 700), with -apple-system fallback
**Body Font:** Inter (regular, 400), with -apple-system fallback

**Character:** A geometric grotesk paired with a humanist grotesk — enough weight contrast between headline and body to carry hierarchy without needing a third typeface. Both fonts stay tight and confident rather than expressive.

### Hierarchy
- **Display** (700, `clamp(2rem, 4vw, 2.8rem)`, 1.1 line-height): Section headings ("Shop by Collection", "Watch & Buy"). One per section, centered by convention in current sections.
- **Body** (400, 1.4rem, 1.5 line-height): Product titles, descriptions, review quotes. Cap prose at 65–75ch even where the container is wider.
- **Label** (600, 1.1–1.2rem, uppercase optional): Prices, buttons, trust-strip items. Weight carries the emphasis; avoid letter-spacing beyond 0.08em — anything wider reads as filler tracking, not intention.

### Named Rules
**The One Weight-Jump Rule.** Hierarchy comes from a single jump — regular body to bold display — not a ladder of five weights. If a screen needs a third level of emphasis, reach for size or color (gold), not a new weight.

## 4. Elevation

Flat by default. `buttons_shadow_opacity`, `card_shadow_opacity` are both 0 in the live theme settings — no ambient shadow on buttons or cards at rest. Depth is conveyed through spacing and background-color separation (paper vs. warm-sand sections), not through elevation. The one exception already in the codebase: `watch-and-buy.liquid`'s product card uses a soft shadow (`0 4px 14px rgba(0,0,0,0.10)`) to lift it off the video behind it — a deliberate, functional exception (the card visually floats over media), not a decorative default.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear only when a component genuinely overlaps or floats over other content (a card pinned on a video, a modal). A card resting on its own background gets no shadow.

## 5. Components

### Buttons
- **Shape:** Pill (40px radius) — `buttons_radius: 40` in theme settings. This is the one consistently rounded shape in the system; everything else (inputs, images) stays square or lightly rounded (8px max).
- **Primary:** Gold background (#ffbf00), ink text (#0b1220), 12px/32px padding, no border.
- **Secondary/Inverse:** Ink background (#0b1220), paper text (#ffffff) or gold label depending on scheme — used for "Buy Now" / secondary actions next to a primary Add to Cart.
- **Hover/Focus:** No shadow lift; rely on a subtle scale (`transform: scale(1.04–1.08)`) already used elsewhere in the codebase (`sbc__card:hover img`, `.whatsapp-bubble:hover`). Keep hover treatment consistent with that existing scale-based pattern rather than introducing shadow-based hover.

### Cards (product / collection)
- **Corner Style:** 8px (`card_corner_radius: 8`) — noticeably tighter than the button pill, by design.
- **Background:** `#f5f0ee`-family neutral placeholder before image load; paper white as the card surface.
- **Shadow Strategy:** none at rest (see Elevation).
- **Border:** none (`card_border_thickness: 0`).
- **Internal Padding:** image gets 2px breathing room (`card_image_padding: 2`); text content follows the 8px spacing grid.

### Inputs / Fields
- **Style:** Square corners (`inputs_radius: 0`) — the deliberate counterpoint to the pill buttons. 1px border, no shadow.
- **Focus:** Standard focus-inset outline; no glow or color shift beyond the existing `link focus-inset` utility class already used throughout the header/nav.

### Navigation (header-custom)
- **Style:** Logo left, nav true-centered (`grid-template-columns: 1fr auto 1fr`), icon cluster right. Uppercase nav labels, Montserrat bold. No dropdown shadow — dropdowns should use a 1px border or background-color separation instead of elevation.
- **Mobile:** Hamburger + centered logo + slide-in drawer. Icons move into the drawer except cart, which stays persistent.

## 6. Do's and Don'ts

### Do:
- **Do** use gold (#ffbf00) for exactly one focal element per screen — the primary CTA or the single most important price/badge.
- **Do** pair pill buttons (40px radius) with square inputs (0px radius) — the contrast is a system feature, not an inconsistency to "fix."
- **Do** keep cards and buttons flat (no shadow) at rest; add shadow only when a component functionally floats over other content.
- **Do** use scale-based hover feedback (`transform: scale(1.04–1.08)`), matching the pattern already in `shop-by-collection.liquid` and `whatsapp-bubble.liquid`.
- **Do** respect `prefers-reduced-motion` on every new animation, following the pattern already in `testimonials.liquid`'s marquee.

### Don't:
- **Don't** ship a generic, unmodified Shopify Dawn section layout — no stock card grids, no default section spacing left as-is.
- **Don't** introduce a second saturated accent color alongside gold. If a section needs more visual weight, use size, weight, or whitespace instead.
- **Don't** extend the blush/pastel palette (#E75480, #FDF3F0) from the earlier build phase into new sections — that direction has been superseded by the white/ink/gold system above.
- **Don't** add drop shadows to buttons or resting cards — the system is flat by default.
- **Don't** use side-stripe borders, gradient text, or glassmorphism as decoration.
- **Don't** stack more than one uppercase-tracked eyebrow label per page — trust-strip already fills that role; a second eyebrow above every section reads as template scaffolding, not intention.
