# Block Implementation Decision Worksheet

Use this to manually categorize and prioritize blocks for implementation.

## Instructions

1. Review each block with screenshots at `tools/importer/screenshots/import-report/`
2. Mark decisions in the **Decision** column
3. Add notes about variants, complexity, or considerations

## Decision Key
- ✅ **BUILD** - Implement as a block
- 🔄 **VARIANT** - Combine with another block (specify)
- 📐 **SECTION** - Implement as section style/metadata
- ⏭️ **SKIP** - Default content, not a block
- 🤔 **TBD** - Need more discussion
- ⏸️ **DEFER** - Low priority, build later

---

## High Usage Blocks (10+ pages)

| Block | Uses | Pages | Decision | Priority | Notes |
|-------|------|-------|----------|----------|-------|
| container-layout | 1520 | 185 | 📐 SECTION | - | Likely a section style/metadata, not a block |
| text | 561 | 166 | ⏭️ SKIP | - | Default content |
| image | 351 | 117 | ⏭️ SKIP | - | Default content |
| cta | 263 | 123 | 🤔 TBD | ? | Mixed usage: stacked list on report-center vs single links elsewhere. May need CTA list block OR just default buttons. Revisit. |
| horizontal-tile | 192 | 96 | 🔄 VARIANT | - | Likely carousel item, not standalone. Always 2x per page on /local/* pages. Implement as part of carousel. |
| header | 192 | 150 | ⏭️ SKIP | - | Default content - just heading + text, not a custom block |
| notched-image | 125 | 119 | ✅ BUILD | HIGH | Real block - 83% standalone, can contain other blocks |
| icon-list | 97 | 97 | ✅ BUILD | HIGH | Real block - 1x per page across 97 pages |
| locator-block | 93 | 93 | ✅ BUILD | HIGH | Real block - 1x per page, mostly on /local/* pages |
| content-card | 71 | 3 | ✅ BUILD | MED | Real block - heavy reuse (45x on one page). May combine with other card variants. |
| story-block | 63 | 36 | ✅ BUILD | HIGH | Real block - variants by bg color (red/blue/white) and image placement. Combine with arts-story-block and storyblock. |
| breadcrumb | 40 | 40 | 🔄 VARIANT | - | Will be built into header block, not standalone |
| tile | 36 | 36 | 🔄 VARIANT | - | Card variant - combine with content-card (possibly default card style) |
| heading-group | 34 | 6 | ⏭️ SKIP | - | Default content - same as header, just grouped headings |
| article-masthead | 31 | 31 | 🔄 VARIANT | MED | Combine with masthead and arts-masthead as one masthead block |
| text-block | 30 | 20 | ⏭️ SKIP | - | Default content |
| social-share | 30 | 30 | ✅ BUILD | MED | Real block - auto-block on article pages (1x per page pattern) |
| footnote | 26 | 8 | ✅ BUILD | MED | Real block - candidate for auto-blocking depending on usage pattern |
| simple-image | 18 | 3 | ⏭️ SKIP | - | Default content |
| media-kaltura | 18 | 12 | ✅ BUILD | MED | Real block - video player |
| opt-in-out-form | 17 | 17 | ✅ BUILD | MED | Real block - form |
| arts-long-form | 12 | 12 | ⏭️ SKIP | - | Not a block - likely template-related |
| highlight-block | 11 | 9 | ✅ BUILD | MED | Real block |
| content-card-container | 11 | 3 | ⏭️ SKIP | - | Not a block - just part of content-card implementation |
| image-wrapper-container | 10 | 7 | 📐 SECTION | - | Likely a section style for layout |
| arts-carousel | 10 | 10 | 🔄 VARIANT | - | Carousel variant for arts template/theme |

## Medium Usage Blocks (4-9 pages)

| Block | Uses | Pages | Decision | Priority | Notes |
|-------|------|-------|----------|----------|-------|
| quote | 8 | 4 | ✅ BUILD | MED | Real block |
| spacer | 7 | 1 | ⏭️ SKIP | - | Not a block |
| dynamic-container | 6 | 3 | ⏭️ SKIP | - | Not a block |
| carousel | 6 | 4 | ✅ BUILD | MED | Real block - contains horizontal-tile items |
| horizontal-content | 6 | 6 | 🔄 VARIANT | - | Same as horizontal-tile, part of carousel implementation |
| report-center | 6 | 3 | ✅ BUILD | LOW | Real block |
| icon-grid | 6 | 1 | 🔄 VARIANT | - | Group with icon-list as variant |
| arts-masonry-tile | 5 | 3 | 🔄 VARIANT | - | Card variant - combine with tile/content-card |
| spotlight | 4 | 4 | ✅ BUILD | LOW | Real block - note: on chicago page may be used as section style |
| modular-tiles | 4 | 4 | 🔄 VARIANT | - | Card variant - combine with tile/content-card |
| arts-story-block | 4 | 2 | 🔄 VARIANT | - | Combine with story-block |

## Low Usage Blocks (1-3 pages)

| Block | Uses | Pages | Decision | Priority | Notes |
|-------|------|-------|----------|----------|-------|
| scroll-to-nav | 3 | 3 | | | |
| award | 3 | 3 | | | |
| infographic | 3 | 3 | | | |
| related-work | 3 | 3 | | | |
| storyblock | 2 | 2 | 🔄 VARIANT | - | Same as story-block (naming inconsistency) |
| article-impact-exhibit | 2 | 2 | | | |
| split-content-block | 2 | 2 | | | |
| manual-tile | 2 | 2 | 🔄 VARIANT | - | Card variant - combine with tile/content-card |
| tab | 2 | 2 | | | |
| background | 2 | 1 | | | |
| masthead | 2 | 1 | 🔄 VARIANT | - | Combine with article-masthead and arts-masthead |
| linklist | 2 | 2 | | | |
| media-overlay | 1 | 1 | | | |
| event-block | 1 | 1 | | | |
| natural-language | 1 | 1 | | | |
| button | 1 | 1 | | | |
| standalone-link | 1 | 1 | | | |
| accordion | 1 | 1 | | | |
| arts-masthead | 1 | 1 | 🔄 VARIANT | - | Combine with article-masthead and masthead |
| arts-title-image | 1 | 1 | | | |
| arts-locator | 1 | 1 | | | |
| arts-museums-table | 1 | 1 | | | |

---

## Potential Variants to Combine

Document which blocks should be variants of a single block:

### Masthead Variants
- `article-masthead` (31 uses, 31 pages)
- `masthead` (2 uses, 1 page)
- `arts-masthead` (1 use, 1 page)

**Decision:**  
**Notes:**

### Story Variants
- `story-block` (63 uses, 36 pages)
- `arts-story-block` (4 uses, 2 pages)
- `storyblock` (2 uses, 2 pages) - note: different naming

**Decision:**  
**Notes:**

### Carousel Variants
- `carousel` (6 uses, 4 pages)
- `arts-carousel` (10 uses, 10 pages)

**Decision:**  
**Notes:**

### Locator Variants
- `locator-block` (93 uses, 93 pages)
- `arts-locator` (1 use, 1 page)

**Decision:**  
**Notes:**

### Text Variants
- `text` (561 uses, 166 pages)
- `text-block` (30 uses, 20 pages)

**Decision:**  
**Notes:**

### Content Card Variants
- `content-card` (71 uses, 3 pages)
- `content-card-container` (11 uses, 3 pages)

**Decision:**  
**Notes:**

---

## Next Steps

1. [ ] Review screenshots for unclear blocks
2. [ ] Make initial categorization decisions
3. [ ] Identify which blocks to tackle first
4. [ ] Create GitHub issues for priority blocks
5. [ ] Document variant decisions and implementation approach

