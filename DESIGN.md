---
name: Elora
description: Elevated, minimal D2C western wear storefront — quiet confidence over decoration
colors:
  maroon: "#7A1520"
  maroon-deep: "#5A0F18"
  maroon-tint: "#F7EFF0"
  black: "#111111"
  white: "#FFFFFF"
  grey-line: "#E6E1E2"
  grey-muted: "#6B6467"
  success: "#2F7A55"
  error: "#B23A3A"
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
    backgroundColor: "{colors.maroon}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  button-secondary:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
  input-default:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
---

# Design System: Elora

## 1. Overview

**Creative North Star: "The Quiet Confidence"**

Elora is a wardrobe edit, not a sale rack. Every screen behaves like a
tightly curated selection: white space does real work, one accent color
carries the eye, and nothing on the page is decorating for its own sake.
Confidence here means not needing to shout — direct product photography,
short copy, and a single maroon accent stand in for the loud gradients and
stacked badges a discount-driven fashion site would reach for by default.

This system explicitly rejects the generic-Shopify-Dawn look: unmodified
stock section layouts, template-y equal-size card grids, and default
spacing rhythm that reads as "theme with products dropped in." It also
rejects cold, corporate-SaaS minimalism — restraint here is warm and
tactile (real photography, a pill-shaped maroon button, a considered
deep-red accent), not clinical.

**Key Characteristics:**
- White background, near-black text, one maroon accent — no secondary/tertiary color competing for attention
- Pill-shaped buttons (40px radius) against perfectly square inputs (0px radius) — a deliberate, repeatable contrast
- Flat by default: no drop shadows on buttons or cards at rest
- Motion is responsive, not choreographed — feedback on interaction, not orchestrated scroll sequences

## 2. Colors

Three colors only — **maroon / white / black** — with a light maroon wash, two
neutral greys, and desaturated success/error as the only supporting values.
No gold, no sand, no blue, no decorative green. Defined once as CSS custom
properties in `src/input.css` (`var(--elora-*)`) and mirrored into the Dawn
color schemes in `config/settings_data.json`; custom sections reference the
tokens rather than hardcoding hex.

### Brand
- **Maroon** (`#7A1520`, `--elora-maroon`): The one saturated color. Headings on light, primary buttons, active states, star icons, price/badge emphasis, accents. Used sparingly — if more than one element per screen is maroon, it's over-used. Passes AA on white and tint (10.7:1 / 9.5:1); white passes on maroon (10.7:1).
- **Maroon Deep** (`#5A0F18`, `--elora-maroon-deep`): Hover / pressed state on maroon only.
- **Maroon Tint** (`#F7EFF0`, `--elora-maroon-tint`): Very light maroon wash — alternating section backgrounds (scheme-2), review-card bubbles, badges.

### Neutral
- **Black** (`#111111`, `--elora-black`): Body text, footer background (scheme-4), and the dark/secondary button. Near-black, softer than pure `#000`.
- **White** (`#FFFFFF`, `--elora-white`): Primary background; text on maroon/black.
- **Grey Line** (`#E6E1E2`, `--elora-grey-line`): Hairline borders, dividers.
- **Grey Muted** (`#6B6467`, `--elora-grey-muted`): Secondary / meta text, placeholders. AA on white (5.8:1).

### State (the one exception)
- **Success** (`#2F7A55`, `--elora-success`) and **Error** (`#B23A3A`, `--elora-error`): Desaturated green/red reserved for cart and form validation only — never decorative. Both pass AA on white (5.2:1 / 5.9:1). Light state backgrounds (`#ECFDF5`, `#FEF2F2`) accompany them.

### Color schemes (`settings_data.json`)
- **scheme-1** — white bg, black text, maroon button (default for most sections).
- **scheme-2** — maroon-tint bg, black text, maroon button (alternating sections).
- **scheme-3** — maroon bg, white text, white button with maroon label (banners, CTAs, badges).
- **scheme-4** — black bg, white text, maroon button (footer).

### Named Rules
**The One Accent Rule.** Maroon is the only saturated color allowed on a screen. If a new component needs a second color to feel "finished," the fix is more restraint (whitespace, weight, size), not a second hue.

**The No-Drift Rule.** Every color comes from the tokens above. The earlier gold/warm-sand system and the blush/pastel palette (`#E75480`, `#FDF3F0`) have both been fully migrated out — do not reintroduce gold, sand, blue, or bright green/red. New sections draw from `var(--elora-*)` or the scheme tokens; success/error are the only greens/reds permitted, and only for validation states.

## 3. Typography

**Display Font:** Montserrat (bold, 700), with -apple-system fallback
**Body Font:** Inter (regular, 400), with -apple-system fallback

**Character:** A geometric grotesk paired with a humanist grotesk — enough weight contrast between headline and body to carry hierarchy without needing a third typeface. Both fonts stay tight and confident rather than expressive.

### Hierarchy
- **Display** (700, `clamp(2rem, 4vw, 2.8rem)`, 1.1 line-height): Section headings ("Shop by Collection", "Watch & Buy"). One per section, centered by convention in current sections.
- **Body** (400, 1.4rem, 1.5 line-height): Product titles, descriptions, review quotes. Cap prose at 65–75ch even where the container is wider.
- **Label** (600, 1.1–1.2rem, uppercase optional): Prices, buttons, trust-strip items. Weight carries the emphasis; avoid letter-spacing beyond 0.08em — anything wider reads as filler tracking, not intention.

### Named Rules
**The One Weight-Jump Rule.** Hierarchy comes from a single jump — regular body to bold display — not a ladder of five weights. If a screen needs a third level of emphasis, reach for size or color (maroon), not a new weight.

## 4. Elevation

Flat by default. `buttons_shadow_opacity`, `card_shadow_opacity` are both 0 in the live theme settings — no ambient shadow on buttons or cards at rest. Depth is conveyed through spacing and background-color separation (white vs. maroon-tint sections), not through elevation. The one exception already in the codebase: `watch-and-buy.liquid`'s product card uses a soft shadow (`0 4px 14px rgba(0,0,0,0.10)`) to lift it off the video behind it — a deliberate, functional exception (the card visually floats over media), not a decorative default.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear only when a component genuinely overlaps or floats over other content (a card pinned on a video, a modal). A card resting on its own background gets no shadow.

## 5. Components

### Buttons
- **Shape:** Pill (40px radius) — `buttons_radius: 40` in theme settings. This is the one consistently rounded shape in the system; everything else (inputs, images) stays square or lightly rounded (8px max).
- **Primary:** Maroon background (#7A1520), white text (#FFFFFF), 12px/32px padding, no border.
- **Secondary/Inverse:** Black background (#111111), white text (#FFFFFF) — used for "Buy Now" / secondary actions next to a primary Add to Cart.
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
- **Do** use maroon (#7A1520) for exactly one focal element per screen — the primary CTA or the single most important price/badge.
- **Do** pair pill buttons (40px radius) with square inputs (0px radius) — the contrast is a system feature, not an inconsistency to "fix."
- **Do** keep cards and buttons flat (no shadow) at rest; add shadow only when a component functionally floats over other content.
- **Do** use scale-based hover feedback (`transform: scale(1.04–1.08)`), matching the pattern already in `shop-by-collection.liquid` and `whatsapp-bubble.liquid`.
- **Do** respect `prefers-reduced-motion` on every new animation, following the pattern already in `testimonials.liquid`'s marquee.

### Don't:
- **Don't** ship a generic, unmodified Shopify Dawn section layout — no stock card grids, no default section spacing left as-is.
- **Don't** introduce a second saturated accent color alongside maroon. If a section needs more visual weight, use size, weight, or whitespace instead.
- **Don't** reintroduce gold, warm-sand, blue, or the old blush/pastel palette (#E75480, #FDF3F0) — all superseded by the maroon / white / black system above.
- **Don't** add drop shadows to buttons or resting cards — the system is flat by default.
- **Don't** use side-stripe borders, gradient text, or glassmorphism as decoration.
- **Don't** stack more than one uppercase-tracked eyebrow label per page — trust-strip already fills that role; a second eyebrow above every section reads as template scaffolding, not intention.
