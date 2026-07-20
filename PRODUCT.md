# Product

## Register

brand

## Users

Gen-Z and young-millennial women shopping western wear in India, arriving
mostly from Instagram/social on mobile. Browsing in short sessions, price-
and delivery-sensitive (COD/prepaid nudges, exchange window, delivery ETA
matter as much as the product photography). Job to be done: find something
for a specific occasion (brunch, date night, festive) quickly and trust the
purchase enough to complete checkout on a phone.

## Product Purpose

Elora is a D2C women's western wear storefront (Shopify) selling three core
collections — TOPS / DRESSES / CO-ORDS. Success = browsing converts to
checkout on mobile without friction, and the storefront reads as a real,
considered brand rather than a stock theme with products dropped in.

## Brand Personality

Elevated, minimal, confident. Quality and taste signaled through restraint —
generous whitespace, precise typography, considered color — not through
loud graphics or maximal decoration. Confidence shows up as clarity: direct
product photography, direct copy, no filler. This is a deliberate shift from
the initial build direction (playful/Gen-Z/blush-pastel/emoji-forward,
documented in memory `elora-brand-build`) — new visual work should follow
elevated-minimal-confident; existing playful sections are not being
retroactively rewritten unless a specific task touches them.

## Anti-references

Must not read as a generic, unmodified Shopify Dawn theme — no stock section
layouts left as-is, no template-y card grids, no default spacing rhythm.
Reference sites already anchoring the build: oyela.in (announcement/header),
houseofsal.com (hero, watch & buy), cheesewalk.co (new arrivals),
basata.co.in (shop by collection).

## Design Principles

- Restraint reads as premium — every added element should earn its place; when in doubt, remove rather than decorate.
- Mobile is the primary surface, not an adaptation of desktop — design mobile-first, verify desktop doesn't just stretch the mobile layout.
- Trust signals (delivery ETA, COD, exchange window, reviews) are part of the design system, not afterthought banners — give them the same typographic care as product content.
- Code-first over app-first — prefer theme-native implementations (as with the wishlist rebuild) over bolting on third-party app UI that doesn't match the system.
- Every custom section must hold up at both mobile and desktop breakpoints before it ships — no "works on the phone I tested" sign-off.

## Accessibility & Inclusion

WCAG AA contrast minimum across text and interactive elements. All motion/animation must respect `prefers-reduced-motion` (already the pattern used in `testimonials.liquid`'s marquee — carry it forward on new work).
