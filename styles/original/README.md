# Original Bank of America Stylesheets

This directory contains the original stylesheets from the Bank of America "About" website for reference purposes.

## Files

### `original-main.css` (1.2MB, 42,180 lines)
The main stylesheet loaded asynchronously after the initial page load. Contains all component, block, and utility styles for the entire site.

### `original-inline-styles.css` (268KB, 12,744 lines)
Critical CSS inlined in the `<head>` for above-the-fold rendering. Includes:
- Base element resets and normalize
- Font-face declarations for Connections fonts
- Critical above-the-fold styles
- Basic typography styles

## Purpose

These files serve as **reference material** when:

1. **Implementing blocks** - Check how BofA styled similar components
2. **Resolving design questions** - Verify colors, spacing, typography patterns
3. **Understanding behavior** - See how they handled responsive design, states, etc.
4. **Extracting patterns** - Find common spacing values, breakpoints, color usage

## Key Findings

- **Total CSS**: ~55K lines (!!!)
- **Almost zero overlap** between inline and main CSS (excellent separation)
- **Most common spacing**: 20px, 30px, 40px, 50px
- **Font families**: Connections (regular/light/medium/condensed variants)
- **Base font size**: 16px (1pc)
- **Heading sizes**: H1: 32px, H2: 24px, H3: 20px, H4-H6: 16px

## Our Approach

We are **NOT** duplicating their CSS. Instead:
- Extract design tokens (colors, spacing, fonts)
- Use component-scoped CSS in individual blocks
- Keep global styles minimal and focused
- Build clean, maintainable code from scratch

## Source

Downloaded from:
- Main: `https://about.bankofamerica.com/etc.clientlibs/about/clientlibs/clientlib-main.min.*.css`
- Inline: Extracted from `<style>` tag in `https://about.bankofamerica.com/en`
- Date: November 2025
- Un-minified using js-beautify

## Note

These files are for **reference only** and are not loaded or used in the actual site. They represent the legacy implementation we're modernizing.

