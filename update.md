# Elora Theme — Update Log

Running record of every change made to this theme. Newest entries at the top.
Base: Dawn 15.4.0. Dev theme 148035436623. Never push to 147811172431.

## Conventions
- One entry per logical change (not per file).
- Every entry states: what changed, which files, why, and how to verify it in the theme editor.
- Breaking changes and anything requiring merchant action in Shopify Admin are tagged **[ADMIN ACTION]**.

---

## [Unreleased]

### 2026-07-20 — Announcement marquee: seamless continuous scroll (no gap)
**What:** The marquee scrolled the whole track off-screen then jumped back, leaving a visible empty gap each loop. Root cause: the track rendered the content 4× but the keyframe translated the *entire* track `-100%`, so everything exited before looping.
**Fix:** restructured into two identical `.ann-marquee__group` halves (each = content ×6, second `aria-hidden`), set the track to `width: max-content`, and changed the keyframe to `translateX(-50%)` — the animation now advances by exactly one half, so the second half is always covering as the first exits. Continuous right-to-left scroll with no gap.
**Files:** `sections/announcement-bar-carousel.liquid`
**Verify:** announcement bar scrolls continuously with no pause/gap; hover still pauses; reduced-motion still stops it.

### 2026-07-20 — Fix cart icon size + left/right whitespace (root-caused)
**What:** Two visual fixes reported after Phase 4.
**Cart icon:** it rendered much smaller/thinner than search & account. Root cause: `icon-cart.svg` / `icon-cart-empty.svg` use `viewBox="0 0 40 40"` but the cart glyph only occupies the middle ~19 units (x14.5–30.5, y12–28.5), while `icon-search`/`icon-account` use a tight `viewBox="0 0 18 19"`. So at the same 23px box the cart drew at ~40% size with a proportionally thinner stroke. Fix: retarget both cart viewBoxes to `13 11 19 19` — the glyph now fills the box (and stroke 1÷19 ≈ search's 1÷18) so it matches everywhere the cart appears (header, cart-icon-bubble, collection-top-bar), no CSS hacks.
**Left/right spacing:** deep-dived the width system. Root causes: (1) contained sections use Dawn's `.page-width { max-width: var(--page-width); margin: 0 auto }`, so on a wide monitor content centres at the cap with large equal margins; (2) `collection-top-bar` full-bleeds with `width: 100vw` which leaks the scrollbar width and produced a right-only gap / horizontal scroll. Fixes: raised `page_width` 1600 → **1800** (schema max 1600 → 2000) so content uses more width, and added `html { overflow-x: clip }` in base.css to kill any horizontal overflow from 100vw full-bleed elements (`clip`, not `hidden`, so position:sticky is unaffected).
**Files:** `assets/icon-cart.svg`, `assets/icon-cart-empty.svg`, `config/settings_data.json`, `config/settings_schema.json`, `assets/base.css`.
**Verify:** header cart now matches search/account size; no right-side gap / horizontal scrollbar; content wider on desktop. `shopify theme check` = 0 new errors.
**Notes:** On a very wide monitor a readability max-width is intentional — even at 1800px there's some margin. If you want specific sections (hero, carousels) truly edge-to-edge full-bleed, that's a per-section change I can make on request.

### 2026-07-20 — Phase 4: three persistent global elements (announcement / header / social-proof)
**What:** Wired three stacked elements into `header-group.json` so they render on every template by construction: (top) scrolling announcement bar → header → social-proof bar. Retired `trust-strip` (agreed).
**Files:** `sections/header-group.json` (order + config), `sections/announcement-bar-carousel.liquid` (+prefers-reduced-motion for marquee & slider), `sections/header-custom.liquid` (logo image_picker + desktop/mobile width settings, `icon_color`, `enable_sticky` toggle, grey-line bottom border, maroon focus rings, maroon cart bubble), `assets/header-custom.js` (drawer Escape-to-close + focus-trap + focus restore), **new** `sections/social-proof-bar.liquid`.
**4.1 Announcement bar:** reused the existing 1013-line section (marquee + slider + countdown already built). Config: marquee layout, maroon bg `#7A1520` / white text, uppercase, letter-spaced, ~12.6px, speed 80, two schema-driven "text" message blocks (free-shipping + linked "shop before they're gone"). Height identical desktop/mobile (padding+line-height, only marquee speed changes on mobile). Reduced-motion now pauses it.
**4.2 Header:** the existing header already had the 3-col desktop grid, mobile hamburger+search / centred logo / account+cart, sticky-on-scroll-up, and cart-count bubble — so this was refinement, not a rewrite. Added the missing schema settings + retheme. No wishlist anywhere (already gone). Drawer slides from the left, closes on backdrop tap + Escape, traps focus.
**4.3 Social-proof bar:** new thin (~38px, fixed height, no shift) centred bar below the header. Settings: `text` (inline_richtext, default "Loved by over 10,000+ customers since 2016"), `bg_color` (maroon-tint), `text_color`, `text_size` 11–16, `padding_y`, `show_bar`, optional `link`, `layout` static/rotating (cross-fade every N s, reduced-motion disables it). `"line"` block type lets trust lines be added later with no code.
**Schema settings added:** header-custom `logo` (image_picker), `logo_width`, `mobile_logo_width`, `icon_color` (default `#7A1520`), `enable_sticky`; social-proof-bar full schema (see file).
**Verify:** Theme editor → Header group shows the three sections in order; every page (home/collection/product/cart/search/account) shows announcement bar (maroon marquee) → header → social-proof (tint). `shopify theme check` = 0 new errors, header-group JSON valid.
**Notes / follow-ups — flagging for you:** (1) **Search icon still links to `/search`** (the search-landing page), not an inline predictive-search overlay. Predictive search itself works via the API and is already on-palette from Phase 3; building a header search *overlay* is a focused follow-up I did not do blind — tell me if you want it. (2) **Drawer currency selector** at the bottom is not added — localization is desktop-only and the store is single-market (INR); trivial to add if a second market appears. (3) Icons use the existing Dawn SVG set at 23px with schema `icon_color`; exact 1.25–1.5px stroke normalisation across the set is a separate polish pass. (4) Announcement bar keeps its full block set (countdown/text/message/custom/image) — features, not dead code, so nothing stripped.

### 2026-07-20 — Phase 3: maroon / white / black design system (replaces gold + warm-sand)
**What:** Replaced the entire gold/warm-sand/green/blue colour system with a three-colour maroon / white / black system + two greys + desaturated success/error.
**Files:** `src/input.css` (new `--elora-*` tokens, rebuilt to `assets/tailwind.css`), `config/settings_data.json` (colour schemes 1–4 rebuilt in both `current` and the `Dawn` preset; scheme-5 repurposed to maroon; button/badge/discount settings re-set with correct on-maroon contrast), `sections/footer-group.json` + `sections/footer-modern.liquid` (footer now black bg / white text / maroon accent, social-icon circles → maroon so they're visible on black), `DESIGN.md` (frontmatter + colour prose rewritten to match), and ~50 component `.liquid/.css/.js` files (every off-palette hex normalised to the tokens).
**Colour tokens:** maroon `#7A1520`, maroon-deep `#5A0F18`, maroon-tint `#F7EFF0`, black `#111111`, white `#FFFFFF`, grey-line `#E6E1E2`, grey-muted `#6B6467`, success `#2F7A55`, error `#B23A3A`. Defined in `src/input.css` as `var(--elora-*)`.
**Schema settings added/changed:** colour schemes 1–4 (see DESIGN.md §2); footer `bg_color`/`text_color`/`accent_color` defaults; no new setting ids.
**Verify:** Theme editor → Theme settings → Colors shows scheme-1 white/maroon, scheme-2 tint, scheme-3 maroon, scheme-4 black. Homepage/PLP/PDP: headings, primary buttons, price/badges read maroon; footer is black. `shopify theme check` = 0 new errors. All text/bg pairings pass WCAG AA (verified: body 18.9:1, maroon-on-white 10.7:1, muted 5.8:1, success 5.2:1, error 5.9:1).
**Notes / follow-ups:** (1) Two items I made judgement calls on — flag if you disagree: the **footer flipped to black** (per scheme-4 spec; social icons fixed to maroon so they stay visible), and the **WhatsApp bubble green (`#25D366`) → maroon** for strict palette compliance (say the word if you'd rather keep it recognisably WhatsApp-green). (2) The maroon button *edge* on the black footer is 1.76:1 (below the 3:1 non-text guideline) — its white label passes at 18.9:1 so it's legible; add a hairline border if you want the edge crisper. (3) Light green/red **state-background** tints (`#ECFDF5`, `#FEF2F2`) remain by design — the allowed cart/form-validation exception. (4) `tailwind.css` is now built from `src/input.css` via `npm run build` (ran `npm install` to enable it).

### 2026-07-20 — Center the Category Carousel bubbles when they don't fill the row
**What:** Added `centerInsufficientSlides: true` to the Swiper init in `category-carousel.liquid`. With `slidesPerView:'auto'` + `freeMode`, a few bubbles (e.g. the 4-item preset: Dresses/Jeans/Sweaters/Kurtis) were left-aligned; now they center when they don't fill the container and still scroll normally when they overflow (mobile).
**Files:** `sections/category-carousel.liquid`
**Why:** Reported left-aligned category bubbles; wanted centered.
**Schema settings added/changed:** none.
**Verify:** Theme editor → the Category Carousel section on the homepage: with only a few bubbles on desktop they should sit centered; add enough bubbles to overflow and it should scroll from the left as before. Also check mobile still scrolls.
**Notes / follow-ups:** Swiper 11's native option handles both cases. If any build still shows them left-aligned with `freeMode` on, fall back to a post-init JS width check that adds `justify-content:center` only when slides don't overflow. Unrelated pending work on this section: it still carries the nowi `category_only_show_for` gating (default "men") and loads Swiper from the jsDelivr CDN — both handled in Phase 2 step 2 / Phase 8, not here.

### 2026-07-20 — Reconcile with origin (live Shopify↔GitHub integration) + git-first deploy
**What:** Discovered this repo's `main` is wired to the dev theme via **Shopify's GitHub integration** — origin/main had advanced **26 `shopify[bot]` auto-commits** ("Update from Shopify…") that our local base (`2c73a18`) predated. Rebased the two local commits (purge + prior build pass) onto `origin/main` and pushed. The build-pass commit collapsed to just the CLAUDE.md/ISSUES.md removal because its theme files were byte-identical to what the bot had already committed — so none of origin's 26 commits were reverted.
**Files:** git history only (no theme-file content changed beyond what the purge/build-pass commits already recorded).
**Why:** Local was 26 commits stale; pushing without reconciling would have clobbered live theme-editor work. Verified the 26 bot commits touch **0** of the 103 deleted files, so the purge stays valid.
**Schema settings added/changed:** none.
**Verify:** `git log` shows `875ac4c` (purge) + `9608a15` (stale-doc removal) on top of `512d231`. `shopify theme check` on the rebased tree = 0 missing-reference errors. Pushed `512d231..9608a15`.
**Notes / follow-ups:** **[ADMIN ACTION]** — **Sync is git-first: push to `origin/main` → Shopify pulls into the dev theme.** Do NOT `shopify theme push` (theme-first) — it fights the integration and causes bot-commit churn. Every theme-editor edit also auto-commits back to `origin/main`, so always `git fetch` before starting work. Live theme `elora-theme-101` (#147811172431) is a *separate* theme, not on this branch.

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

Maroon / white / black system (Phase 3, 2026-07-20). Tokens live in
`src/input.css` as `var(--elora-*)`; schemes mirror them in `settings_data.json`.

| Scheme | background | text | button | button_label | secondary_button_label | Role |
|---|---|---|---|---|---|---|
| scheme-1 | `#FFFFFF` | `#111111` | `#7A1520` | `#FFFFFF` | `#7A1520` | Default: white bg / maroon CTA |
| scheme-2 | `#F7EFF0` | `#111111` | `#7A1520` | `#FFFFFF` | `#7A1520` | Alternating: maroon-tint section |
| scheme-3 | `#7A1520` | `#FFFFFF` | `#FFFFFF` | `#7A1520` | `#FFFFFF` | Maroon banner / CTA / badge |
| scheme-4 | `#111111` | `#FFFFFF` | `#7A1520` | `#FFFFFF` | `#FFFFFF` | Footer: black bg |
| scheme-5 | `#7A1520` | `#FFFFFF` | `#FFFFFF` | `#7A1520` | `#FFFFFF` | = scheme-3 (repurposed; sale-badge default) |

**Tokens:** maroon `#7A1520`, maroon-deep `#5A0F18`, maroon-tint `#F7EFF0`,
black `#111111`, white `#FFFFFF`, grey-line `#E6E1E2`, grey-muted `#6B6467`,
success `#2F7A55`, error `#B23A3A`.
**Purged (do not reintroduce):** gold `#ffbf00`, ink `#0b1220`, warm-sand `#f5f1e8`,
green `#008000`, blue `#334fb4`, blush `#E75480`/`#FDF3F0`/`#3A2E2B`.

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
- **Reconciled with the live Shopify↔GitHub integration** — rebased onto origin's 26 bot commits (0 overlap with deletions, nothing reverted) and pushed git-first (`512d231..9608a15`). Phase 2 step 1 is now on `origin/main`; Shopify pulls it into the dev theme.
**Next:** (a) confirm store domain `h4f0ch-mr` in Admin, then fix `package.json` `shopify:dev --store=` + PROJECT.md; (b) Phase 2 step 2 — kill the nowi two-tab men/women system (delete `category-detection.js` / `category-nav.js` / `homepage-category-nav` / `category-visibility-wrapper`, strip `category_only_show_for` + `show_in_all_categories` from **both** section schemas **and** saved JSON in index/collection/product/settings_data, remove the render-blocking head script), then step 3 rebuild `index.json` women-only.
**Blocked:** Client decisions still open — Razorpay SSO (live on login/register), Wishlink / Vizup / Google-YouTube / Razorpay-Rewards app embeds. Store-domain edit awaiting an Admin eyeball. `quick-order-list.js/.css` flagged for the Phase 8 perf pass (shouldn't load globally).
**Workflow:** git-first (push to origin → Shopify pulls). `git fetch` before every session; never `shopify theme push`.
