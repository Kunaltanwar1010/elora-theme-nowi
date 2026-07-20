# Elora Theme — Phase 1 Audit

Base: Dawn 15.4.0, forked from "nowi". Audited 2026-07-20 against the live wiring
(templates, section groups, Section Rendering API calls in JS, and `{% render %}`
graph). Nothing has been changed — this is read-only.

---

## 0. Headline findings (read this first)

1. **The Elora homepage does not exist yet.** `templates/index.json` is still the
   full **nowi two-tab men/women store** — `homepage-category-nav` with women/men
   tabs, duplicated hero/category/trending/collection sections gated by
   `category_only_show_for`, and a `category-detection.js` that **defaults to
   "men"**. The custom Elora sections that PROJECT.md says were "wired in"
   (`shop-by-collection`, `watch-and-buy`, `testimonials`, `announcement-bar-carousel`)
   are **built but placed on nothing** — they render on zero templates today.
   → Keep them (they're the Phase 2 homepage); rebuild `index.json` around them.

2. **~25 of 75 section files are dead** (a third, as suspected) — a mix of stock
   Dawn sections never placed, `-modern` predecessors left behind, B2B sections
   irrelevant to a fashion D2C, and the disabled stock `header`/`footer`.

3. **PROJECT.md overstates the wishlist cleanup.** It claims "zero wishlist code
   remains." Not true: dead wishlist CSS lives in 5 stylesheets (base.css alone
   has two blocks), and **six** app-embed declarations remain in
   `settings_data.json` (5× Swish + 1× Wishlink) — not the "two" the notes say.
   No heart *renders* (that part holds), but the code is not gone.

4. **Performance: two render-blocking scripts in `<head>` and Swiper pulled from
   an external CDN on every page.** `category-detection.js` + `utm-detection.js`
   load synchronously before first paint; `header-custom.liquid` loads
   `swiper@11` CSS+JS from `cdn.jsdelivr.net` (blocking, external, every page).

5. **package.json still identifies as `nowi-shopify`** and points at the nowi
   GitHub repo.

---

## 1. Sections (`sections/` — 75 `.liquid` + 2 group `.json`)

### 1a. Custom Elora — BUILT BUT NOT PLACED (keep; wire up in Phase 2)

| File | Status |
|---|---|
| `shop-by-collection.liquid` | Referenced by no template. Intended homepage section. |
| `watch-and-buy.liquid` | Same. |
| `testimonials.liquid` | Same. |
| `announcement-bar-carousel.liquid` | Same. The homepage currently uses `announcement-bar-heroimage` instead. |

These four are why the dead-section count looks scary — they're not dead, they're
un-placed. Do **not** delete.

### 1b. DEAD — safe to delete now (~25)

**Superseded by a `-modern` / replacement variant (nothing references them):**
- `main-account.liquid` → replaced by `main-account-modern` (customers/account.json)
- `main-addresses.liquid` → replaced by `main-addresses-modern`
- `main-order.liquid` → replaced by `main-order-modern`
- `main-search.liquid` → replaced by `search-landing` (search.json)

**Disabled duplicate in the section group (see §3):**
- `header.liquid` (796 lines, stock Dawn, `"disabled": true` in header-group.json)
- `footer.liquid` (545 lines, stock Dawn, `"disabled": true` in footer-group.json)

**nowi orphan:**
- `category-bubble-carousel.liquid` — referenced nowhere (distinct from the live
  `category-carousel`). Pure leftover.

**Stock Dawn sections never placed on any template** (deleting these removes them
from the theme-editor "Add section" picker — safe for a locked-down client store,
keep any you want the client to be able to add later):
`announcement-bar`, `collage`, `collapsible-content`, `collection-list`,
`custom-liquid`, `featured-blog`, `featured-collection`, `featured-product`,
`image-banner`, `image-with-text`, `multicolumn`, `multirow`, `newsletter`,
`page`, `slideshow`, `video`

**B2B — irrelevant to a fashion D2C:**
- `bulk-quick-order-list.liquid`, `quick-order-list.liquid`

### 1c. Live via Section Rendering API / dynamic `{% render %}` — DO NOT delete

These show as "unreferenced by templates" but are fetched by JS at runtime, so the
naive scan flags them as false positives:
`cart-drawer`, `cart-icon-bubble`, `cart-live-region-text`,
`cart-notification-button`, `cart-notification-product` (all fetched by
`cart*.js`), `predictive-search` (`?section_id=predictive-search`),
`pickup-availability` (`?section_id=pickup-availability`),
`cart-drawer-recommendations` (lazy-fetched by the cart-drawer custom element).

### 1d. Live and in active use (keep)

Everything else — the PLP/PDP/cart/account/search mains, `header-custom`,
`footer-modern`, `trust-strip`, `hero-carousel`, `category-carousel`,
`trending-carousel`, `collection-grid`, `homepage-category-nav`,
`razorpay-sso-login`, etc. Note several of these (hero/trending/category/collection
carousels + homepage-category-nav) carry the nowi men/women gating and are Phase 2
rework candidates even though they're "live" today (see §4).

---

## 2. Snippets (`snippets/` — 68 files)

**Orphaned — rendered by nobody (safe to delete):**
- `header-search.liquid` — only the disabled stock `header.liquid` used it; the
  active `header-custom` has no search-snippet render (its search icon links out).
- `product-description-metafield-value.liquid`
- `quick-order-product-row.liquid` (dies with the B2B quick-order sections)
- `search-chip.liquid`
- `search-trending-item.liquid` (search-landing renders `suggestion_chip` /
  `trending_item` blocks inline, not these snippets)

The other 63 are all rendered somewhere and live.

---

## 3. Headers & footers — confirmed live/dead

| Section | Lines | State | Verdict |
|---|---|---|---|
| `header.liquid` | 796 | stock Dawn, `disabled: true` in group | **DELETE** (+ its swish block, §5) |
| `header-custom.liquid` | 590 | active | keep |
| `footer.liquid` | 545 | stock Dawn, `disabled: true` in group | **DELETE** |
| `footer-modern.liquid` | 582 | active | keep |

After deleting, remove the `header` and `footer` entries (and their `order`
positions) from `header-group.json` / `footer-group.json`.

Two brand leftovers in the live footer: `footer-modern` still points its Instagram
link at `https://www.instagram.com/nowi.fashion/`, and its description carries the
old playful copy ("Not just fashion — a whole feeling ✨") — a DESIGN.md tone
mismatch, not a bug.

---

## 4. nowi two-tab (men/women) system — full removal map

Elora is women-only with three collections; the entire category-switching
apparatus has to go. It is spread across:

**Files that exist only to serve the two-tab system (delete):**
- `assets/category-detection.js` — sets `<html data-active-category>`, **defaults
  to `men`**, keyed on `localStorage['nowi-homepage-category']`. Render-blocking in
  `<head>` (§6).
- `assets/category-nav.js` (192 lines) — only used by `homepage-category-nav`.
- `assets/component-homepage-category-nav.css`
- `sections/homepage-category-nav.liquid` — the women/men tab bar.
- `snippets/category-visibility-wrapper.liquid`
- `sections/category-bubble-carousel.liquid` (already dead, §1b)

**Gating baked into schemas/markup of otherwise-keepable sections (strip the
`category_only_show_for` / `show_in_all_categories` settings + the
`data-active-category` conditionals, keep the section):**
`announcement-bar-heroimage`, `category-carousel`, `collection-grid`,
`collection-sort-filter-bar`, `featured-collection`, `hero-carousel`,
`image-banner`, `trending-carousel`, plus `snippets/search-sort-filter-bar.liquid`
and the `data-active-category` attribute set in `layout/theme.liquid`.

**`templates/index.json` itself:** two of everything (women + men variants of
hero-carousel, category-carousel, trending-carousel×3, collection-grid×2), all
gated. Every `category_only_show_for: "men"` block is dead weight for Elora; the
`"women"` blocks still reference nowi collections (`women-jeans`,
`women-korean-pants`, `women-trousers`, `night-suits`, `women-sweaters`…) that
don't match Elora's TOPS/DRESSES/CO-ORDS. This file gets rebuilt wholesale in
Phase 2, not patched.

---

## 5. Wishlist remnants — the real inventory

No heart icon renders anywhere (verified: `header-custom` renders none, the card
comment at `collection-product-card-modern.liquid:132` is just a stray `<!-- TITLE
+ WISHLIST ICON -->` label, and `header-drawer.liquid:165-167` is inside a
`{% comment %}`). But code is not "gone":

**Dead CSS to sweep:**
- `assets/base.css` — two blocks: swym wishlist icon (`~L12-42`) and Wishlist-King
  custom elements `wishlist-button-product/collection` (`~L3732-3742`)
- `assets/component-collection-product-card-modern.css` (13 matches — heart-on-card styles)
- `assets/section-main-product.css` (29 matches — PDP heart styles)
- `assets/section-search-landing.css` (2), `assets/component-header-custom.css` (1 comment)

**Dead markup/comments:** the comment in `collection-product-card-modern.liquid`,
the commented block in `header-drawer.liquid`.

**Config app-embeds in `settings_data.json` (6, not 2):**
- `swish-formerly-wishlist-king`: `code-access` (L196), `wishlist-page` (L203),
  `app-settings-main` (L229), `wishlist-link-floating` (L258),
  `wishlist-button-collection` (L282)
- `wishlink` (L333) — a separate affiliate/wishlist app embed, not mentioned in PROJECT.md

**Section-group block:** the `swish…wishlist-link-block` in `header-group.json`
(inside the already-dead `header` section).

**Schema settings:** `enable_wishlist` (header.liquid schema, dies with the file)
and `show_wishlist` (header-custom.liquid schema + its `header-group.json` setting)
— the latter needs removing from the *live* header.

**`icon-heart.svg`** is referenced only by the dead `header.liquid` → orphaned once
that's gone.

---

## 6. `templates/page.swym.liquid`

Contents: literally `{{ page.content }}`. A Swym-wishlist-app alternate page
template. Dead unless a Shopify page has its template suffix set to `swym` (none
should). **Safe to delete** after a quick check in Admin → Pages that nothing uses
the `page.swym` template.

---

## 7. package.json — nowi identity

```
"name": "nowi-shopify",
"homepage": "https://github.com/nowi-tech/nowi-shopify#readme",
"bugs.url" / "repository.url": github.com/nowi-tech/nowi-shopify
"main": "index.js"   ← file doesn't exist
"description": ""     ← empty
```
Rename to elora, repoint (or drop) the repo URLs, fix/remove `main`. Cosmetic but
it's the brand's package manifest.

---

## 8. Colour system — every hardcoded-hex location (for the Phase 2 swap)

**Schemes in `settings_data.json` (all being replaced):** scheme-1 white/gold
(`#ffffff` bg, `#ffbf00` button), scheme-2 warm-sand/ink (`#f5f1e8`/`#0b1220`),
scheme-3 green (`#008000`), scheme-4 dark (`#121212`), scheme-5 blue (`#334fb4`).
DESIGN.md documents the gold system around these.

**Legacy blush/pastel palette** (`#E75480` / `#FDF3F0` / `#3A2E2B`) — the
"No-Drift Rule" violation flagged in DESIGN.md — lives in exactly the four custom
sections: `trust-strip`, `shop-by-collection`, `watch-and-buy`, `testimonials`.

**Gold `#ffbf00` and ink `#0b1220` hardcoded** (should be scheme tokens, not
literals) — **12 files each**, including `main-product.liquid`, `collection-grid`,
`watch-and-buy`, `testimonials`, `footer-modern`, `header-custom.css`,
`category-carousel`.

**Heaviest hardcoded-hex files** (raw literals instead of scheme vars):
`component-cart-drawer.css` (123), `component-desktop-sort-filter.css` (58),
`collection-sort-filter-bar.liquid` (56), `section-search-landing.css` (55),
`search-sort-filter-bar.liquid` (54), `component-quick-buy.css` (38),
`faq-page.liquid` (27). Any Phase-2 palette change must touch these or they'll
retain the old colours.

---

## 9. Performance baseline

**Render-blocking in `<head>` (`layout/theme.liquid`):**
- L17 `category-detection.js` — synchronous, no defer. (Dies with the nowi system, §4.)
- L18 `utm-detection.js` — synchronous, no defer. Generic marketing util (keepable)
  but move it off the critical path.
- 3 blocking stylesheets via `stylesheet_tag`: `base.css`, `tailwind.css`,
  `page-loader.css` (L288-290). The rest (cart/predictive) are correctly
  `media="print"`-swapped or preloaded.

**External CDN bundle on every page:** `sections/header-custom.liquid` L17/L20 load
`swiper@11` CSS **and** JS from `cdn.jsdelivr.net`, render-blocking and external
(also a CSP/offline liability). Because it's in the global header it ships on every
page even where no Swiper carousel exists. Options: self-host `swiper-bundle.min`
(already present in `assets/`, currently unused-by-name), defer it, and/or load it
only on pages with a carousel. The local `assets/swiper-bundle.min.css` is not
referenced by name today — the theme uses the CDN copy instead.

**Unpaginated `for product in collection.products`:** `collection-grid.liquid`
L169 & L221 loop the full collection without a `limit` (L264 does limit). On a
large collection these iterate everything server-side. Worth capping.
(`main-collection-product-grid` L155 is inside Dawn's `paginate` and is fine.)

**Images:** the four custom sections use `image_url`+`srcset` where they emit
`<img>` (spot-checked shop-by-collection/watch-and-buy/testimonials) — no raw
non-responsive `<img>` found in them. `trust-strip` is emoji, no images. General
Dawn image handling is responsive.

---

## 10. App embeds — what's actually in use

| App | Where | Actually in use? |
|---|---|---|
| **Razorpay SSO login** (`sections/razorpay-sso-login.liquid`) | customers/login.json **and** register.json | **YES — live.** Also `razorpay-magic-sso` + `razorpay-magic-checkout` snippets render in `theme.liquid` (L363/L446). This is wired, not dead. Decision needed: does Elora keep Razorpay SSO? |
| **Judge.me** | homepage `ugc_media_grid` block is `disabled: true`; but `preview_badge` + `review_widget` embeds live in settings_data.json | Review widgets **active** via app embeds; the homepage UGC grid is off. |
| **Vizup videos** | homepage `apps` section, block **enabled** (empty `videoc_widget_id`) | Enabled but unconfigured — renders nothing useful. Remove from homepage in Phase 2. |
| **Swish (Wishlist King)** | 5 embeds in settings_data.json + header-group block | Inert (app not injecting) — **remove**, §5. |
| **Wishlink** | 1 embed in settings_data.json | Present; confirm with client, likely remove. |
| **Google/YouTube** | 1 embed in settings_data.json | Present; low-risk, confirm intent. |
| **Razorpay Rewards / Gift Cards** | 1 embed in settings_data.json | Present; confirm with client. |

---

## 11. Consolidated deletion list (Phase 2, pending your go-ahead)

**Sections (~25):** `header`, `footer`, `main-account`, `main-addresses`,
`main-order`, `main-search`, `category-bubble-carousel`, `bulk-quick-order-list`,
`quick-order-list`, `announcement-bar`, `collage`, `collapsible-content`,
`collection-list`, `custom-liquid`, `featured-blog`, `featured-collection`,
`featured-product`, `image-banner`, `image-with-text`, `multicolumn`, `multirow`,
`newsletter`, `page`, `slideshow`, `video`
— plus, once the two-tab system goes: `homepage-category-nav`.

**Snippets (5):** `header-search`, `product-description-metafield-value`,
`quick-order-product-row`, `search-chip`, `search-trending-item`
— plus `category-visibility-wrapper` (with the nowi system).

**Assets (47 orphaned + nowi):** 47 files referenced nowhere, dominated by
leftover food/lifestyle icons from an unrelated theme (`icon-banana`,
`icon-carrot`, `icon-pepper`, `icon-serving-dish`, `icon-bottle`, `icon-dairy*`,
`icon-gluten-free`, `icon-nut-free`, `icon-leaf`, `icon-paw-print`, `icon-lipstick`,
`icon-perfume`, `icon-plant`, `icon-shoe`, `icon-shirt`, `icon-pants`,
`icon-silhouette`, `icon-leather`…), plus `collection-animations.css` and
`component-progress-bar.css`. Delete the nowi system JS/CSS (§4) and, after header
removal, `icon-heart.svg`.
*Caveat:* re-verify a handful that could be used dynamically before deleting —
`icon-star.svg`, `icon-truck.svg`, `icon-return.svg`, `icon-lock.svg` — the scan
found no references but apps/inline renders occasionally pull by name.

**Templates:** `page.swym.liquid` (after confirming no page uses it).

**Config:** the 6 wishlist app-embeds + confirm-then-remove Wishlink/Vizup;
strip `enable_wishlist`/`show_wishlist` settings.

**Root:** rebrand `package.json`.

---

## Recommended Phase 2 sequencing

1. **Rebrand + safe deletes** — package.json; the superseded/disabled/B2B/orphan
   sections, orphan snippets, orphan assets. Zero behaviour change.
2. **Kill the two-tab system** — delete the nowi category files, strip gating from
   the keepable sections, remove the render-blocking head script.
3. **Rebuild `index.json`** as the women-only Elora homepage using the four
   already-built custom sections + de-gated hero/collection sections.
4. **Wishlist purge** — sweep the dead CSS/comments, remove the config embeds.
5. **Colour system swap** — replace schemes + the blush/pastel literals + the
   hardcoded gold/ink across the 12+ files.
6. **Performance** — self-host/defer Swiper, move head scripts off the critical
   path, cap the collection-grid loops.
