# Icon List Block

## Content Model: Icon List

### Block Structure

| Icon List |
|-----------|
| Optional label text :icon-name: | Any content: headings, text, links, etc. |
| ![image](image.jpg) | Any content: headings, text, links, etc. |

### How It Works

The Icon List block uses a **Collection model** where each row represents one list item. Each item has two columns:

| Column | Purpose | Content |
|--------|---------|---------|
| 1 | Visual | Optional label/header text, followed by icon (`:icon-name:`) OR image |
| 2 | Content | Any authored content - headings, paragraphs, links, lists, etc. |

### Authoring Guidelines

**Column 1 - Visual (with optional label):**

Column 1 contains the visual element and an optional label that appears above it.

*Label (optional):*
- Text that appears above the icon/image
- Useful for category labels, numbers, or short descriptive text

*Visual - Icon:*
- Use `:icon-name:` syntax where `icon-name` matches an SVG file in `/icons/`
- Example: `:bank-of-america:` references `/icons/bank-of-america.svg`
- Available icons: `bank-of-america`, `facebook`, `linkedin`, `mail`, `ml-logo`, `search`, `twitter`, `youtube`

*Visual - Image:*
- Add an image using standard authoring
- Images will be optimized automatically

**Column 2 - Content:**

Authors have full flexibility. Common patterns:
- Heading + description
- Just a title
- Title + description + link
- Any combination of standard content elements

### Examples

**With icons:**

| Icon List |
|-----------|
| :search: | ## Find Locations Discover ATMs and financial centers near you. |
| :mail: | ## Contact Us Get in touch with our support team. |

**With label + icon:**

| Icon List |
|-----------|
| Step 1 :bank-of-america: | ## Open Your Account Complete our simple online application in minutes. |
| Step 2 :mail: | ## Verify Identity Upload your documents securely. |
| Step 3 :search: | ## Start Banking Access your new account immediately. |

**With images:**

| Icon List |
|-----------|
| ![Checking icon](checking.png) | ## Checking Accounts Everyday banking made simple. [Learn More](/checking) |
| ![Savings icon](savings.png) | ## Savings Accounts Grow your money with competitive rates. [Learn More](/savings) |

**Simple list:**

| Icon List |
|-----------|
| :facebook: | Follow us on Facebook |
| :twitter: | Connect with us on Twitter |
| :linkedin: | Join our professional network |

**Rich content:**

| Icon List |
|-----------|
| :bank-of-america: | ### Open an Account Today Start your banking journey with us. We offer competitive rates, no hidden fees, and 24/7 support. [Get Started](/open-account) |

### Key Points

- Each row is one list item (Collection model)
- Column 1: Optional label text + icon reference OR image
- Column 2: Flexible - any content the author needs
- Icons decorated automatically by `decorateIcons()`
- Images optimized automatically by the platform

### Semantic Structure

The decoration code will transform the block into:
- Unordered list (`<ul>`)
- Each row becomes a list item (`<li>`) with:
  - Visual wrapper (for optional label + icon or image)
  - Content wrapper (for all column 2 content)
