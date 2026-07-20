# Elora — Shopify Theme

Women's western wear D2C (India), Gen-Z audience, mobile-first (Instagram traffic).
3 core collections: **TOPS / DRESSES / CO-ORDS**. Brand vibe: blush/pastel, rounded
corners, playful microcopy, INR pricing, COD + prepaid nudges.

Base: Dawn 15.4.0 (NOT Horizon, despite what any client brief says).

## Shopify targets

- Working/dev theme: `elora-theme-nowi/main`, ID `148035436623` (unpublished).
  Push here: `shopify theme push --theme 148035436623`.
- Live theme: `elora-theme-101/main`, ID `147811172431` — **never push here directly.**

## Custom sections (built July 2026, not in stock Dawn)

| File | Purpose |
|---|---|
| `sections/trust-strip.liquid` | Thin trust bar under header (exchange/delivery/COD). Wired into `header-group.json` after header. |
| `sections/shop-by-collection.liquid` | Large tappable collection cards. Mobile: 1.2-card peek scroll-snap. Desktop: CSS grid, 2–4 cols. |
| `sections/watch-and-buy.liquid` | Shoppable 9:16 video reels + pinned product card. Reuses `snippets/quick-buy-modal.liquid` + `assets/quick-buy.js`. IntersectionObserver pauses off-screen video. |
| `sections/testimonials.liquid` | Review cards (photo/stars/quote) + `#WearElora` CSS marquee of UGC images. |
| Countdown block | Added to `sections/announcement-bar-carousel.liquid` — countdown timer + coupon code, JS-driven `setInterval` tick. |
| `snippets/whatsapp-bubble.liquid` | Fixed WhatsApp chat bubble, bottom-left (bottom-right reserved for sticky ATC on mobile PDP). Settings under Theme Settings → "Support & Conversion". |

Client design references used during build: oyela.in (announcement/header),
houseofsal.com (hero, watch & buy), cheesewalk.co (new arrivals), basata.co.in
(shop by collection).

## Already existed — don't rebuild

- Sticky mobile Add-to-Cart + Buy Now (`sections/main-product.liquid` ~line 820)
- Cart drawer free-shipping progress bar (`snippets/cart-drawer.liquid`)
- `snippets/size-guide-modal.liquid`, `snippets/delivery-eta-timeline.liquid`, `snippets/coupon-offer.liquid`
- Wishlist: **Swish (formerly Wishlist King)** app — see below

## Wishlist — removed (2026-07-20)

Wishlist was built twice and removed once: first as a Swish/Wishlist King app
integration (icons that never rendered because the app-embed block was
disabled), then rebuilt code-only with localStorage — and then removed
entirely at the client's request. There is currently **no wishlist feature**
anywhere in the theme: no heart icons on cards or PDP, no header icon, no
`/pages/wishlist`.

What's still around from the app era (harmless, inert): the Swish app-embed
block declarations in `config/settings_data.json`
(`shopify://apps/swish-formerly-wishlist-king/...`) and the header nav block
in `sections/header-group.json`. Safe to strip from Admin → Theme → App
embeds whenever the Swish app is uninstalled; they render nothing on their
own since the app isn't wired to inject into empty containers anymore.

## Known layout bugs fixed (2026-07-20)

Both `watch-and-buy.liquid` and `testimonials.liquid` set a mobile
`max-width` on their card/item (`.wnb__item`, `.tsm__card`) that was never
cleared inside the `@media (min-width: 750px)` desktop block. Result: on
desktop the flex-basis widened (`22%`/`30%`) but the leftover `max-width: 260px`
/ `320px` still capped the actual rendered width — cards stayed mobile-sized
with dead space on the right instead of filling the row. Fixed by adding
`max-width: none` to each desktop rule.

## Header centering fix (2026-07-20)

`sections/header-custom.liquid` (the active header — the stock Dawn `header`
section is disabled) used a desktop grid `auto 1fr auto`, which centers the nav
*between* the logo and icon-cluster widths rather than on the true page center.
Since the logo text is wider than the icon group, the nav visibly drifted left.
Fixed in `assets/component-header-custom.css` (`@media (min-width: 990px)`):
grid changed to `1fr auto 1fr` with logo `justify-self: start` / icons
`justify-self: end`, so the nav column is always truly centered regardless of
the side elements' widths.

## Settings of note

- `settings.free_shipping_threshold` (rupees) drives the free-shipping message
  in both `cart-drawer.liquid` and `announcement-bar-carousel.liquid` — used to
  be hardcoded (59900 paise) in two places, now a single setting (×100 for paise).
