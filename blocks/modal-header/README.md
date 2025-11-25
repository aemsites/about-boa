# Modal Header Block

A two-column block designed to display promotional or important content within a modal dialog. Features responsive layout with image on one side and flexible content on the other.

## Usage

This block is intended to be used **inside** the existing `modal` block wrapper. The modal wrapper handles dialog functionality, backdrop, close button, and triggers.

## Content Structure

Create a table with one row and two columns:

```
| Modal Header |
|--------------|
| [Image] | [Content] |
```

### Column 1: Image
- Add a single image that will appear on the left on desktop and top on mobile

### Column 2: Content
- Can contain any combination of:
  - Heading (H1, H2, or H3)
  - Paragraph text (one or more paragraphs)
  - Inline images
  - CTA buttons (links will be automatically styled as buttons)

## Examples

### Example 1: Simple Heading and CTA
```
| Modal Header |
|--------------|
| ![Hero image](hero.jpg) | # Special Announcement<p>[Learn More](https://example.com)</p> |
```

### Example 2: Full Content with Multiple Paragraphs
```
| Modal Header |
|--------------|
| ![Campaign photo](campaign.jpg) | ## Support Our Cause<p>Join us in making a difference in our community.</p><p>Every contribution helps us achieve our mission.</p><p>[Donate Now](https://example.com/donate)</p> |
```

### Example 3: Content with Inline Image
```
| Modal Header |
|--------------|
| ![Feature image](feature.jpg) | ## Partnership Announcement<p>We're excited to announce our new partnership.</p><p>![Partner logo](partner-logo.png)</p><p>[Learn More](https://example.com/partnership)</p> |
```

## Styling

### Responsive Behavior
- **Mobile (<900px)**: Stacked vertically with image on top, content below
- **Desktop (≥900px)**: Side-by-side columns (image left, content right)
- **Full-width**: Block occupies 100% width of container at all breakpoints

### CTA Buttons
- Links in standalone paragraphs are automatically styled as primary CTA buttons
- Styled with brand red background (#e31837)
- Rounded corners (24px border-radius)
- Hover effects include color change and slight lift animation

### Typography
- Headings use `--heading-font-family` with appropriate sizing
- Body text uses `--body-font-family`
- Responsive font sizes adjust based on viewport

### Images
- Column 1 image: Full height and width, uses object-fit: cover
- Inline images in content: Max-width 100%, maintains aspect ratio

## Accessibility
- Use semantic heading hierarchy (H1/H2/H3)
- Include descriptive alt text on all images
- Links automatically receive appropriate styling and focus states
- When used in modal wrapper, inherits modal accessibility features (focus trap, ESC to close, etc.)

## Integration with Modal Wrapper

The modal-header block is designed to work within the existing modal system:

1. Create modal-header content in your CMS
2. Reference it using the modal fragment pattern
3. The modal wrapper will handle:
   - Dialog creation and positioning
   - Backdrop overlay
   - Close button (X in top-right)
   - ESC key handling
   - Click outside to close
   - Body scroll locking

## Technical Details

### JavaScript (`modal-header.js`)
- Identifies and adds semantic classes to columns (`.modal-header-image`, `.modal-header-content`)
- Automatically styles standalone links as CTA buttons
- No variant handling (variants can be added in future if needed)

### CSS (`modal-header.css`)
- Mobile-first responsive design
- Uses CSS custom properties from global styles
- Scoped to block to prevent style leakage
- Standard breakpoints: 600px (tablet), 900px (desktop), 1200px (large desktop)

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses modern CSS features (flexbox, custom properties, logical properties)
- Responsive images with picture element support

## Performance Considerations
- Images use optimized picture elements with WebP and JPEG fallbacks
- CSS uses hardware-accelerated transforms for animations
- No JavaScript dependencies beyond decoration function
- Minimal DOM manipulation

## Future Enhancements
Potential improvements for future versions:
- Variant support (e.g., reverse layout, dark theme)
- Animation options for content reveal
- Video support in image column
- Background patterns or overlays

