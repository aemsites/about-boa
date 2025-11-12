# Browser Testing Guide

Browser testing validates that blocks, DOM transformations, and visual elements work correctly in a real browser environment.

## When to Use Browser Testing

Use browser testing for:
- **Block decoration validation** - Does the block transform HTML correctly?
- **Visual appearance** - Does it look right at different screen sizes?
- **Interactive behavior** - Do click handlers, forms, and interactions work?
- **DOM structure** - Is the final rendered HTML correct?
- **Responsive design** - Does it work on mobile, tablet, desktop?

## Browser Testing Tools

Choose one of these three options based on what's available to you:

### Option 1: Playwright MCP (Recommended)

If you have the Playwright MCP server available, this is the easiest option - no installation or scripts required.

**How it works:**
- Use the MCP-provided Playwright tools directly
- Tools handle browser launch, navigation, screenshots, and interactions
- No need to write or maintain test scripts

**Example usage:**
```
1. Use mcp__playwright-navigate to visit test page
2. Use mcp__playwright-screenshot to capture viewports
3. Use mcp__playwright-click to test interactions
4. Use mcp__playwright-evaluate to validate DOM
```

**Benefits:**
- ✅ No setup or installation required
- ✅ No test scripts to manage
- ✅ Works immediately if MCP server is configured

**Limitations:**
- ❌ Requires Playwright MCP server to be installed and configured
- ❌ Less flexible for complex automation flows

### Option 2: Playwright Scripts

Write Node.js scripts using Playwright's API for full control over browser automation.

**Setup:**

```bash
npm install --save-dev playwright
npx playwright install chromium
```

**Example test script:**

```javascript
// test-hero-block.js (DO NOT COMMIT)
import { chromium } from 'playwright';

async function testHeroBlock() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to test content
  await page.goto('http://localhost:3000/drafts/tmp/hero-test');

  // Wait for block decoration
  await page.waitForSelector('.hero');

  // Take screenshots - BOTH block-specific and full-page
  await page.locator('.hero').screenshot({ path: 'hero-block-desktop.png' });
  await page.screenshot({ path: 'hero-page-desktop.png', fullPage: true });

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.locator('.hero').screenshot({ path: 'hero-block-mobile.png' });
  await page.screenshot({ path: 'hero-page-mobile.png', fullPage: true });

  // Test tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('.hero').screenshot({ path: 'hero-block-tablet.png' });
  await page.screenshot({ path: 'hero-page-tablet.png', fullPage: true });

  // Validate DOM structure
  const heroTitle = await page.textContent('.hero h1');
  console.log('Hero title:', heroTitle);

  // Test interactions
  const button = page.locator('.hero .button');
  await button.click();
  await page.waitForTimeout(1000); // Wait for any animations

  await browser.close();
}

testHeroBlock().catch(console.error);
```

**Run the test:**

```bash
node test-hero-block.js
```

**Benefits:**
- ✅ Full control and flexibility
- ✅ Can be saved and reused
- ✅ Works offline
- ✅ Complex workflows are easier to manage

**Limitations:**
- ❌ Requires npm installation
- ❌ Need to write and manage scripts
- ❌ Scripts should not be committed (temporary only)

### Option 3: Browser MCP

If you have the Browser MCP server available, use it for basic browser automation tasks.

**How it works:**
- Use MCP-provided browser tools for navigation and screenshots
- Similar to Playwright MCP but may have different capabilities

**Example usage:**
```
1. Use mcp__browser-navigate to visit test page
2. Use mcp__browser-screenshot to capture the page
3. Use browser console tools to validate state
```

**Benefits:**
- ✅ No setup required if MCP server is configured
- ✅ Simple interface for basic tasks

**Limitations:**
- ❌ Requires Browser MCP server to be installed and configured
- ❌ May have fewer features than Playwright options

## Browser Testing Workflow

Regardless of which option you choose, follow this workflow:

### 1. Choose your tool

- **Playwright MCP**: If available, use MCP tools directly (recommended)
- **Playwright Scripts**: Install Playwright and write a test script
- **Browser MCP**: If available, use MCP browser tools

### 2. Navigate and test

**For Playwright Scripts**, create a temporary script file (e.g., `test-my-block.js`) with:
- Navigation to test content URL
- Waiting for block decoration
- Taking screenshots at multiple viewports
- Validating DOM structure or behavior
- Testing user interactions

**For MCP tools**, use the appropriate MCP commands to:
- Navigate to test content URL
- Wait for page load/block decoration
- Capture screenshots at multiple viewports
- Test interactions and validate state

### 3. Execute your tests

**For Playwright Scripts:**
```bash
node test-my-block.js
```

**For MCP tools:** Use the MCP tool commands directly

### 4. Review screenshots critically

**Don't just glance - actually analyze each screenshot:**

- **Check layout**: Are elements positioned correctly? Any overlapping or misalignment?
- **Verify content**: Is all expected content visible? Any truncated text or missing images?
- **Examine spacing**: Do margins and padding look balanced and intentional?
- **Test responsiveness**: Does each viewport (mobile/tablet/desktop) look appropriate for that size? Test near breakpoints (e.g., 599px, 600px, 601px for a 600px breakpoint) to ensure content flows properly across transitions
- **Compare to expectations**: If you have reference screenshots or mockups, compare side-by-side for differences
- **Look for red flags**: Broken images, cut-off text, elements in wrong positions, poor spacing

**Report findings specifically, not generically:**
- ❌ BAD: "Everything looks fine"
- ✅ GOOD: "Desktop screenshot shows proper layout with 20px spacing between elements. Mobile correctly stacks content. Found issue: button text is truncated on mobile at 375px width."

- Show screenshots to the user for feedback when needed
- Include screenshots in PR description to aid review

### 5. Clean up

**For Playwright Scripts:**
- Delete the test script (don't commit)
- Keep screenshots temporarily for PR, then delete

**For MCP tools:**
- No cleanup needed (no scripts created)
- Keep screenshots temporarily for PR, then delete

## Common Testing Scenarios

These scenarios apply to all browser testing methods. Adapt the specific steps to your chosen tool (MCP or scripts).

### Testing Multiple Variants

**What to test:** When a block has multiple variants (e.g., hero-default, hero-dark, hero-light), test each one.

**How to test:**
1. Navigate to test content for each variant (e.g., `/drafts/hero-default`, `/drafts/hero-dark`)
2. Wait for block decoration to complete
3. Capture screenshot of each variant
4. Compare to ensure each variant renders correctly and distinctly

**What to look for:**
- Each variant displays its unique styling
- Content structure remains consistent across variants
- No CSS conflicts or broken layouts
- Variant-specific features work as intended

**Screenshot naming:** Use descriptive names like `hero-dark.png`, `hero-light.png`

### Testing Interactive Elements

**What to test:** Forms, buttons, accordions, tabs, modals, and other interactive components.

**How to test:**
1. Navigate to page with interactive block
2. Wait for block decoration
3. Capture initial state screenshot
4. Interact with elements (fill forms, click buttons, toggle states)
5. Capture screenshots after each interaction
6. Validate DOM changes and visual feedback

**What to look for:**
- Click handlers fire correctly
- Form inputs accept and display values
- Validation messages appear when expected
- Success/error states render properly
- Interactive elements have proper hover/focus states
- State changes are reflected visually

**Example flow for a form:**
- Screenshot: empty form
- Fill in fields with test data
- Screenshot: filled form
- Submit form
- Screenshot: success message or validation errors

### Testing Animations and Transitions

**What to test:** Carousels, slideshows, accordions, animated reveals, or any time-based visual changes.

**How to test:**
1. Navigate to page with animated block
2. Wait for block decoration
3. Capture initial state (before animation/transition)
4. Trigger animation (click next, scroll, etc.)
5. Wait for animation to complete (typically 300-500ms)
6. Capture new state
7. Repeat for multiple states if applicable

**What to look for:**
- Elements are positioned correctly in each state
- No visual glitches or jumps during transitions
- Animations complete fully
- Interactive controls (next/prev buttons) work
- Content is accessible at each step
- No layout shifts or overlapping content

**Example flow for a carousel:**
- Screenshot: slide 1 (initial)
- Click next → wait → Screenshot: slide 2
- Click next → wait → Screenshot: slide 3
- Click previous → wait → Screenshot: slide 2 (verify backward navigation)

### Testing Responsive Behavior

**What to test:** How blocks adapt to different screen sizes and orientations.

**How to test:**
1. Navigate to page with block
2. Wait for block decoration
3. Test at each major viewport size:
   - **Mobile**: 375x812px (iPhone), 360x740px (Android)
   - **Tablet portrait**: 768x1024px (iPad)
   - **Tablet landscape**: 1024x768px
   - **Desktop**: 1920x1080px, 1440x900px
4. Capture screenshots at each size
5. Test near breakpoints (599px, 600px, 601px for a 600px breakpoint)

**What to look for:**
- Content reflows appropriately at each size
- No horizontal scrolling
- Text remains readable (no tiny fonts on mobile)
- Images scale appropriately
- Touch targets are large enough on mobile (44x44px minimum)
- Navigation adapts (hamburger menu on mobile, full nav on desktop)
- Layout uses available space efficiently at all sizes
- Breakpoint transitions are smooth (test at 599px, 600px, 601px)

**Screenshot naming:** Include viewport size, e.g., `header-mobile-375.png`, `header-desktop-1920.png`

## Browser Testing Best Practices

### DO:
- ✅ Test all viewport sizes (mobile, tablet, desktop)
- ✅ Take screenshots for visual validation
- ✅ Test all block variants
- ✅ Wait for block decoration before capturing state
- ✅ Test interactive elements (clicks, hovers, forms, etc.)
- ✅ Show screenshots to humans for feedback
- ✅ Include screenshots in PRs to help reviewers
- ✅ Test near breakpoints to verify smooth transitions
- ✅ Capture both block-specific and full-page screenshots

### DON'T:
- ❌ Commit browser test scripts to the repository (for Playwright Scripts option)
- ❌ Try to automate full visual regression testing
- ❌ Skip testing on mobile viewports
- ❌ Assume it works if it looks good on desktop
- ❌ Rely on screenshots alone - actually interact with the page

## Playwright Scripts Tips and Tricks

These tips apply to **Option 2: Playwright Scripts**. If using MCP tools, refer to the MCP server documentation for equivalent functionality.

### Waiting for elements

```javascript
// Wait for selector
await page.waitForSelector('.my-block');

// Wait for specific text
await page.waitForSelector('text=Click me');

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### Taking targeted screenshots

**IMPORTANT: Always take block-specific screenshots in addition to full-page screenshots.**

```javascript
// PREFERRED: Screenshot of specific block element
await page.locator('.hero').screenshot({ path: 'hero-block-only.png' });

// Full page screenshot (for context)
await page.screenshot({ path: 'hero-full-page.png', fullPage: true });

// Best practice: Take both
await page.waitForSelector('.hero');
await page.locator('.hero').screenshot({ path: 'hero-block.png' });
await page.screenshot({ path: 'hero-context.png', fullPage: true });
```

**Screenshot strategy:**
- **Block-specific screenshot** (required): Shows just the block being tested - easier to review and spot issues
- **Full-page screenshot** (optional): Provides context of how the block fits on the page

### Debugging

```javascript
// Launch browser in non-headless mode
const browser = await chromium.launch({ headless: false });

// Slow down actions
const browser = await chromium.launch({ slowMo: 500 });

// Pause execution
await page.pause();
```

### Extracting data

```javascript
// Get text content
const text = await page.textContent('.selector');

// Get attribute value
const href = await page.getAttribute('a', 'href');

// Check if element exists
const exists = await page.locator('.selector').count() > 0;

// Get all matching elements
const items = await page.$$eval('.item', els => els.map(el => el.textContent));
```

## Next Steps

After browser testing:
1. Review all screenshots critically (see "Review screenshots critically" in workflow above)
2. Document any issues found with specific details (viewport, what's wrong, expected behavior)
3. Fix issues before proceeding
4. Show screenshots to stakeholders for validation when appropriate
5. Include key screenshots in your PR description
6. Move on to other testing methods (linting, unit tests, etc.)

Remember: Browser tests are a validation tool, not a regression prevention tool. Use them to confirm your implementation works, then move on.
