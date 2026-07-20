# Elora Theme — Update Log

Running record of every change made to this theme. Newest entries at the top.
Base: Dawn 15.4.0. Dev theme 148035436623. Never push to 147811172431.

## Conventions
- One entry per logical change (not per file).
- Every entry states: what changed, which files, why, and how to verify it in the theme editor.
- Breaking changes and anything requiring merchant action in Shopify Admin are tagged **[ADMIN ACTION]**.

---

## [Unreleased]

### 2026-07-20 — Purge dead sections, snippets, and assets
**What:** Removed 103 unreferenced files — 25 dead sections, 11 orphaned snippets, 67 orphaned assets. Assets folder 225 → 158; sections 75 → 50; snippets 68 → 57.
**Files:** see the **Deleted files** table below for the full list. Sections were stock-Dawn-never-placed (`image-banner`, `slideshow`, `multicolumn`, `collage`, `newsletter`, `video`, …), `-modern`-superseded (`main-account/addresses/order`, `main-search`), B2B (`bulk-quick-order-list`, `quick-order-list`), and a nowi orphan (`category-bubble-carousel`). Orphaned snippets/assets were the dead stock-header/footer/cart-notification cluster plus leftover food/lifestyle icons from an unrelated theme.
**Why:** AUDIT.md §1b/§2/§11. Roughly a third of the theme was never rendered; the leftover header/footer cluster only existed to serve the now-deleted stock `header`/`footer`.
**Schema settings added/changed:** none.
**Verify:** `shopify theme check` → **0 new missing-reference errors** (92 pre-existing errors are all translations / image-dims / parser-blocking-scripts / remote-assets, unrelated to these deletions). In the theme editor, the "Add section" picker no longer lists the removed stock sections; storefront renders unchanged (nothing that was placed on a template was touched).
**Notes / follow-ups:** All files recoverable from git history if a stock section is wanted back later. `quick-order-list.js/.css` were **kept** (still used by the PLP + product card). The nowi two-tab files (`category-detection.js`, `category-nav.js`, `homepage-category-nav`, `category-visibility-wrapper`) were **not** deleted — they're still referenced by the live homepage and belong to Phase 2 step 2.

### 2026-07-20 — Retire disabled stock header & footer + Swish wishlist block
**What:** Deleted the disabled stock `header.liquid` (796 lines) and `footer.liquid` (545 lines); removed both from their section groups. The Swish "wishlist-link-block" (an app-embed block nested inside the stock header) went with it.
**Files:** `sections/header.liquid` (del), `sections/footer.liquid` (del), `sections/header-group.json`, `sections/footer-group.json`
**Why:** Both were `"disabled": true` duplicates of the live `header-custom` / `footer-modern`. First step of the wishlist purge (AUDIT.md §3, §5).
**Schema settings added/changed:** removed the dead `enable_wishlist` setting (lived only in the deleted stock header). `show_wishlist` on the live `header-custom` still exists — scheduled for the Phase 2 wishlist purge (step 4).
**Verify:** Header group now renders `header_custom_dAGVrR` → `trust_strip`; footer group renders `footer_modern_wHHnWL` only. Storefront header/footer visually unchanged (the deleted sections were already disabled). No heart/wishlist icon anywhere.
**Notes / follow-ups:** Still to purge for wishlist: dead CSS in `base.css`/`component-collection-product-card-modern.css`/`section-main-product.css`, dead comments, the 6 app-embeds in `settings_data.json` (5× Swish + Wishlink), and `show_wishlist` on header-custom. `icon-heart.svg` deleted in the purge entry above (its only referrer was this stock header).

### 2026-07-20 — Rebrand package.json off "nowi"
**What:** Renamed the package `nowi-shopify` → `elora-theme`, dropped the nowi GitHub repo/homepage/bugs URLs and the bogus `"main": "index.js"`, added a real description, set `private: true` + `UNLICENSED`.
**Files:** `package.json`
**Why:** The manifest still carried the previous brand's identity and a non-existent entry point (AUDIT.md §7). Cosmetic but it's the brand's package file.
**Schema settings added/changed:** none.
**Verify:** `npm run build` / `npm run dev` scripts unchanged and still work (only metadata fields changed, no script or dependency touched).
**Notes / follow-ups:** none.

### 2026-07-20 — Start the rebuild changelog
**What:** Created this running update log.
**Files:** `update.md`
**Why:** Phase 2 kickoff — every change from here on is logged here in the same commit as the change, newest first.
**Schema settings added/changed:** none
**Verify:** N/A (docs only, no storefront effect).
**Notes / follow-ups:** Phase 1 audit already written to `AUDIT.md` (read-only findings; no theme changes were made in that pass). Deletion list, colour swap, and homepage rebuild are staged there and will each get their own entry as they land.

---

## Deleted files

Log every removed file here so nothing looks mysteriously missing later.

All removals recoverable from git history. Grouped by reason.

| File(s) | Date | Reason |
|---|---|---|
| `sections/header.liquid`, `sections/footer.liquid` | 2026-07-20 | Disabled stock-Dawn duplicates of live `header-custom` / `footer-modern`. Removed from section groups. |
| `sections/main-account.liquid`, `main-addresses.liquid`, `main-order.liquid` | 2026-07-20 | Superseded by `-modern` variants used in customers/* templates. |
| `sections/main-search.liquid` | 2026-07-20 | Superseded by `search-landing` (search.json). |
| `sections/bulk-quick-order-list.liquid`, `quick-order-list.liquid` | 2026-07-20 | B2B quick-order — irrelevant to a fashion D2C, placed on nothing. |
| `sections/category-bubble-carousel.liquid` | 2026-07-20 | nowi orphan, referenced nowhere (distinct from the live `category-carousel`). |
| `sections/announcement-bar.liquid`, `collage.liquid`, `collapsible-content.liquid`, `collection-list.liquid`, `custom-liquid.liquid`, `featured-blog.liquid`, `featured-collection.liquid`, `featured-product.liquid`, `image-banner.liquid`, `image-with-text.liquid`, `multicolumn.liquid`, `multirow.liquid`, `newsletter.liquid`, `page.liquid`, `slideshow.liquid`, `video.liquid` | 2026-07-20 | Stock Dawn sections never placed on any template. Restore individually from git if the client wants editor access to one. |
| `snippets/cart-notification.liquid`, `header-drawer.liquid`, `header-dropdown-menu.liquid`, `header-mega-menu.liquid`, `header-search.liquid`, `social-icons.liquid` | 2026-07-20 | Dead stock-header/footer/cart-notification cluster — only the deleted stock `header`/`footer` rendered them; the active header-custom has its own nav; `cart_type` is `drawer` so the notification popup is unused. |
| `snippets/product-description-metafield-value.liquid`, `quick-order-product-row.liquid`, `search-chip.liquid`, `search-trending-item.liquid` | 2026-07-20 | Orphaned — rendered by nothing (search-landing renders its blocks inline). |
| `assets/cart-notification.js`, `main-search.js` | 2026-07-20 | JS for deleted sections/snippets. |
| `assets/component-cart-notification.css`, `component-menu-drawer.css`, `component-mega-menu.css`, `component-list-menu.css`, `component-search.css`, `component-list-payment.css`, `section-footer.css` | 2026-07-20 | CSS only loaded by the deleted stock header/footer/cart-notification. |
| `assets/collage.css`, `collapsible-content.css`, `component-image-with-text.css`, `component-slideshow.css`, `component-modal-video.css`, `section-featured-blog.css`, `section-featured-product.css`, `section-multicolumn.css`, `video-section.css` | 2026-07-20 | CSS for deleted stock sections. |
| `assets/collection-animations.css`, `component-progress-bar.css` | 2026-07-20 | Already orphaned pre-purge (referenced nowhere). |
| `assets/icon-heart.svg` | 2026-07-20 | Only referrer was the deleted stock header (wishlist). |
| 46 leftover icon SVGs: `icon-banana`, `icon-carrot`, `icon-pepper`, `icon-serving-dish`, `icon-bottle`, `icon-dairy`, `icon-dairy-free`, `icon-gluten-free`, `icon-nut-free`, `icon-leaf`, `icon-paw-print`, `icon-lipstick`, `icon-perfume`, `icon-plant`, `icon-shoe`, `icon-shirt`, `icon-pants`, `icon-silhouette`, `icon-leather`, `icon-dryer`, `icon-iron`, `icon-washing`, `icon-snowflake`, `icon-recycle`, `icon-plane`, `icon-box`, `icon-bottle`, `icon-fire`, `icon-star`, `icon-truck`, `icon-return`, `icon-ruler`, `icon-lock`, `icon-eye`, `icon-map-pin`, `icon-pause`, `icon-stopwatch`, `icon-lightning-bolt`, `icon-price-tag`, `icon-chat-bubble`, `icon-clipboard`, `icon-check-mark`, `icon-question-mark`, `icon-account-filled`, `icon-arrow-filled`, `icon-search-filled`, `icon-apple` | 2026-07-20 | Orphaned icons — mostly food/lifestyle leftovers from an unrelated theme; each verified referenced nowhere (keeper sections use unicode/emoji/inline SVG, not these files). |

---

## Colour tokens reference

Current scheme values as defined in `config/settings_data.json` → `color_schemes`.
**This whole table is slated for replacement in the Phase 2 colour swap** — update
it in the same entry that changes the schemes.

| Scheme | background | text | button | button_label | secondary_button_label | Role (per DESIGN.md) |
|---|---|---|---|---|---|---|
| scheme-1 | `#ffffff` | `#0b1220` | `#ffbf00` | `#0b1220` | `#0b1220` | Default paper / gold CTA |
| scheme-2 | `#f5f1e8` | `#0b1220` | `#0b1220` | `#ffbf00` | `#0b1220` | Warm-sand section / inverse button |
| scheme-3 | `#008000` | `#ffffff` | `#ffffff` | `#008000` | `#ffffff` | Success / signal green |
| scheme-4 | `#121212` | `#ffffff` | `#ffffff` | `#121212` | `#ffffff` | Dark (unused by brand) |
| scheme-5 | `#334fb4` | `#ffffff` | `#ffffff` | `#334fb4` | `#ffffff` | Blue (nowi leftover) |

**Named brand hexes (DESIGN.md):** ink `#0b1220`, paper `#ffffff`, gold `#ffbf00`,
warm-sand `#f5f1e8`, signal-green `#008000`.
**Legacy blush/pastel (to purge):** `#E75480`, `#FDF3F0`, `#3A2E2B` — only in
`trust-strip`, `shop-by-collection`, `watch-and-buy`, `testimonials`.

---

## Section inventory

Every `sections/*.liquid` → templates/groups that render it → Custom (built for
this project) or Dawn (stock 15.4.0). `*API/dynamic*` = rendered at runtime via the
Section Rendering API or a `{% render %}` custom element, not placed in a template.
`*(unused)*` = referenced by nothing (deletion candidate — see AUDIT.md §1b).
Keep this current: when a section is added, deleted, or re-wired, update its row.

| Section | Used by (template / group) | Kind |
|---|---|---|
| `announcement-bar-carousel` | *(unused — built for Elora, not yet placed)* | Custom |
| `announcement-bar-heroimage` | index | Custom |
| `apps` | index, product | Dawn |
| `cart-drawer` | *API/dynamic* | Dawn |
| `cart-drawer-recommendations` | *API/dynamic* | Custom |
| `cart-icon-bubble` | *API/dynamic* | Dawn |
| `cart-live-region-text` | *API/dynamic* | Dawn |
| `cart-notification-button` | *API/dynamic* | Dawn |
| `cart-notification-product` | *API/dynamic* | Dawn |
| `category-carousel` | index | Custom (nowi) |
| `collection-grid` | collection, index, page | Custom |
| `collection-sort-filter-bar` | collection | Custom |
| `collection-top-bar` | collection, page, product | Custom |
| `contact-form` | page.contact | Dawn |
| `email-signup-banner` | password | Custom |
| `faq-page` | page.faq | Custom |
| `footer-modern` | footer-group | Custom |
| `header-custom` | header-group | Custom |
| `hero-carousel` | index | Custom |
| `homepage-category-nav` | index | Custom (nowi) |
| `main-404` | 404 | Dawn |
| `main-account-modern` | customers/account | Custom |
| `main-activate-account` | customers/activate_account | Dawn |
| `main-addresses-modern` | customers/addresses | Custom |
| `main-article` | article | Dawn |
| `main-blog` | blog | Dawn |
| `main-cart-footer` | cart *(+ API/dynamic)* | Dawn |
| `main-cart-items` | cart *(+ API/dynamic)* | Dawn |
| `main-collection-banner` | collection | Dawn |
| `main-collection-product-grid` | collection | Dawn |
| `main-list-collections` | list-collections | Dawn |
| `main-login` | customers/login | Dawn |
| `main-order-modern` | customers/order | Custom |
| `main-page` | page, page.contact | Dawn |
| `main-password-footer` | password.liquid (layout) | Dawn |
| `main-password-header` | password.liquid (layout) | Dawn |
| `main-product` | product | Dawn |
| `main-register` | customers/register | Dawn |
| `main-reset-password` | customers/reset_password | Dawn |
| `pickup-availability` | *API/dynamic* | Dawn |
| `predictive-search` | *API/dynamic* | Dawn |
| `razorpay-sso-login` | customers/login, customers/register | Custom |
| `related-products` | product | Dawn |
| `rich-text` | index, product | Dawn |
| `search-landing` | search | Custom |
| `shop-by-collection` | *(unused — built for Elora, not yet placed)* | Custom |
| `testimonials` | *(unused — built for Elora, not yet placed)* | Custom |
| `trending-carousel` | index | Custom |
| `trust-strip` | header-group | Custom |
| `watch-and-buy` | *(unused — built for Elora, not yet placed)* | Custom |

---

## Session summaries

### 2026-07-20 — Session 1
**Done:**
- Phase 1 audit (`AUDIT.md`) — full read-only map of dead sections/snippets/assets, the nowi two-tab system, wishlist remnants, colour system, performance baseline, and app-embed usage.
- Phase 2 changelog (`update.md`) created and seeded with the colour-token and section-inventory reference tables.
- **Phase 2 step 1 complete** — rebranded `package.json`; retired the disabled stock header/footer (+ Swish block) and rewired both section groups; purged 103 dead files (25 sections, 11 snippets, 67 assets). `shopify theme check` shows 0 new missing-reference errors. Inventory table trimmed to the surviving 50 sections.
**Next:** Phase 2 step 2 — kill the nowi two-tab men/women system (delete `category-detection.js` / `category-nav.js` / `homepage-category-nav` / `category-visibility-wrapper`, strip `category_only_show_for` gating from the keeper sections, remove the render-blocking head script), then step 3 rebuild `index.json` as the women-only Elora homepage.
**Blocked:** Client decisions still open before their deletions — Razorpay SSO (live on login/register), Wishlink / Vizup / Google-YouTube / Razorpay-Rewards app embeds. Not blocking steps 2–3.
