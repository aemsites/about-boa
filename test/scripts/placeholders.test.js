import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the aem.js module to provide required functions
vi.mock('../../scripts/aem.js', () => ({
  toCamelCase: (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
  getMetadata: vi.fn(() => 'en'),
}));

// Mock global fetch
global.fetch = vi.fn((url) => {
  // Mock response for placeholders
  if (url.includes('placeholders.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { Key: 'greeting', Text: 'Hello' },
          { Key: 'farewell', Text: 'Goodbye' },
          { Key: 'name', Text: 'World' },
          { Key: 'title', Text: 'Welcome' },
          { Key: 'button', Text: 'Click Me' },
        ],
      }),
    });
  }
  return Promise.resolve({ ok: false });
});

describe('replacePlaceholders', () => {
  let document;
  let replacePlaceholders;

  beforeEach(async () => {
    // Set up DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.NodeFilter = dom.window.NodeFilter;

    // Reset window.placeholders cache between tests
    if (global.window.placeholders) {
      delete global.window.placeholders;
    }

    // Import the function after setting up the environment
    const module = await import('../../scripts/placeholders.js');
    replacePlaceholders = module.replacePlaceholders;
  });

  it('should replace a single placeholder in text', async () => {
    const div = document.createElement('div');
    div.textContent = '{{greeting}}';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('Hello');
  });

  it('should replace multiple placeholders in the same text node', async () => {
    const div = document.createElement('div');
    div.textContent = '{{greeting}} {{name}}!';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('Hello World!');
  });

  it('should replace placeholders in nested elements', async () => {
    const div = document.createElement('div');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    p1.textContent = '{{greeting}} {{name}}';
    p2.textContent = '{{farewell}}!';
    div.appendChild(p1);
    div.appendChild(p2);

    await replacePlaceholders(div);

    expect(p1.textContent).toBe('Hello World');
    expect(p2.textContent).toBe('Goodbye!');
  });

  it('should preserve text without placeholders', async () => {
    const div = document.createElement('div');
    div.textContent = 'This is plain text';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('This is plain text');
  });

  it('should keep placeholder syntax for non-existent placeholders', async () => {
    const div = document.createElement('div');
    div.textContent = '{{greeting}} {{nonExistent}}';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('Hello {{nonExistent}}');
  });

  it('should handle empty elements', async () => {
    const div = document.createElement('div');

    await replacePlaceholders(div);

    expect(div.textContent).toBe('');
  });

  it('should handle elements with only whitespace', async () => {
    const div = document.createElement('div');
    div.textContent = '   ';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('   ');
  });

  it('should replace placeholders in deeply nested elements', async () => {
    const div = document.createElement('div');
    const section = document.createElement('section');
    const article = document.createElement('article');
    const p = document.createElement('p');
    const span = document.createElement('span');

    span.textContent = '{{title}}: {{greeting}} {{name}}';
    p.appendChild(span);
    article.appendChild(p);
    section.appendChild(article);
    div.appendChild(section);

    await replacePlaceholders(div);

    expect(span.textContent).toBe('Welcome: Hello World');
  });

  it('should handle multiple text nodes in the same element', async () => {
    const div = document.createElement('div');
    const textNode1 = document.createTextNode('{{greeting}} ');
    const strong = document.createElement('strong');
    strong.textContent = '{{name}}';
    const textNode2 = document.createTextNode(' {{farewell}}');

    div.appendChild(textNode1);
    div.appendChild(strong);
    div.appendChild(textNode2);

    await replacePlaceholders(div);

    expect(div.textContent).toBe('Hello World Goodbye');
  });

  it('should handle placeholder with spaces around the key', async () => {
    const div = document.createElement('div');
    div.textContent = '{{ greeting }} and {{ name }}';

    await replacePlaceholders(div);

    // Spaces are part of the key, so they won't match
    expect(div.textContent).toBe('{{ greeting }} and {{ name }}');
  });

  it('should handle adjacent placeholders without spaces', async () => {
    const div = document.createElement('div');
    div.textContent = '{{greeting}}{{name}}';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('HelloWorld');
  });

  it('should handle placeholders with special characters in surrounding text', async () => {
    const div = document.createElement('div');
    div.textContent = 'Say "{{greeting}}" to {{name}}!';

    await replacePlaceholders(div);

    expect(div.textContent).toBe('Say "Hello" to World!');
  });

  it('should handle elements with mixed content and placeholders', async () => {
    const div = document.createElement('div');
    const h1 = document.createElement('h1');
    const p = document.createElement('p');
    const button = document.createElement('button');

    h1.textContent = '{{title}}';
    p.textContent = '{{greeting}} {{name}}, welcome to our site.';
    button.textContent = '{{button}}';

    div.appendChild(h1);
    div.appendChild(p);
    div.appendChild(button);

    await replacePlaceholders(div);

    expect(h1.textContent).toBe('Welcome');
    expect(p.textContent).toBe('Hello World, welcome to our site.');
    expect(button.textContent).toBe('Click Me');
  });

  it('should not replace partial matches', async () => {
    const div = document.createElement('div');
    div.textContent = 'This is not a {{greeti}} placeholder';

    await replacePlaceholders(div);

    // 'greeti' doesn't match 'greeting', so it should remain unchanged
    expect(div.textContent).toBe('This is not a {{greeti}} placeholder');
  });

  it('should handle empty placeholder keys', async () => {
    const div = document.createElement('div');
    div.textContent = '{{}} is empty';

    await replacePlaceholders(div);

    // Empty keys won't match anything, so remain unchanged
    expect(div.textContent).toBe('{{}} is empty');
  });
});
