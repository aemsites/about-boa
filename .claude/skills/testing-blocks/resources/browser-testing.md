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

### Option 1: Playwright (Recommended)

Playwright provides a full browser automation API with excellent developer experience.

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

### 1. Setup Playwright

If you haven't already installed Playwright (see setup section above), install it now.

### 2. Write test script

Create a temporary script file (e.g., `test-my-block.js`) with:
- Navigation to test content URL
- Waiting for block decoration
- Taking screenshots at multiple viewports
- Validating DOM structure or behavior
- Testing user interactions

### 3. Run the script

```bash
node test-my-block.js
```

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

- Delete the test script (don't commit)
- Keep screenshots temporarily for PR, then delete

## Common Testing Scenarios

### Testing Multiple Variants

```javascript
async function testBlockVariants() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const variants = ['default', 'dark', 'light', 'wide'];

  for (const variant of variants) {
    await page.goto(`http://localhost:3000/drafts/hero-${variant}`);
    await page.waitForSelector('.hero');
    await page.screenshot({
      path: `hero-${variant}.png`,
      fullPage: true
    });
  }

  await browser.close();
}
```

### Testing Interactive Elements

```javascript
async function testForm() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/drafts/contact-form');
  await page.waitForSelector('.form');

  // Fill out form
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Test message');

  // Take screenshot of filled form
  await page.screenshot({ path: 'form-filled.png' });

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success message
  await page.waitForSelector('.form-success');
  await page.screenshot({ path: 'form-success.png' });

  await browser.close();
}
```

### Testing Animations and Transitions

```javascript
async function testCarousel() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/drafts/carousel');
  await page.waitForSelector('.carousel');

  // Initial state
  await page.screenshot({ path: 'carousel-1.png' });

  // Click next button
  await page.click('.carousel-next');
  await page.waitForTimeout(500); // Wait for animation
  await page.screenshot({ path: 'carousel-2.png' });

  // Click next again
  await page.click('.carousel-next');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'carousel-3.png' });

  await browser.close();
}
```

### Testing Responsive Behavior

```javascript
async function testResponsive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/drafts/header');
  await page.waitForSelector('.header');

  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'header-desktop.png' });

  // Tablet landscape
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: 'header-tablet-landscape.png' });

  // Tablet portrait
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'header-tablet-portrait.png' });

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'header-mobile.png' });

  await browser.close();
}
```

## Browser Testing Best Practices

### DO:
- ✅ Test all viewport sizes (mobile, tablet, desktop)
- ✅ Take screenshots for visual validation
- ✅ Test all block variants; in one or multiple scripts
- ✅ Wait for block decoration before capturing state
- ✅ Test interactive elements (clicks, hovers, forms, etc.)
- ✅ Show screenshots to humans for feedback
- ✅ Include screenshots in PRs to help reviewers

### DON'T:
- ❌ Commit browser test scripts to the repository
- ❌ Try to automate full visual regression testing

## Playwright Tips and Tricks

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

## When Browser Tests Are Worth Keeping

In rare cases, browser tests might be worth committing and maintaining:

1. **Critical user flows** - Checkout process, authentication, critical forms
2. **Cross-browser compatibility** - When you need to test in multiple browsers
3. **Accessibility testing** - Using specialized tools like axe-core

Even in these cases, keep tests focused on critical functionality only. The cost of maintaining browser tests is high.

## Next Steps

After browser testing:
1. Review all screenshots critically (see "Review screenshots critically" in workflow above)
2. Document any issues found with specific details (viewport, what's wrong, expected behavior)
3. Fix issues before proceeding
4. Show screenshots to stakeholders for validation when appropriate
5. Include key screenshots in your PR description
6. Move on to other testing methods (linting, unit tests, etc.)

Remember: Browser tests are a validation tool, not a regression prevention tool. Use them to confirm your implementation works, then move on.
