import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { JSDOM } from 'jsdom';

describe('utils', () => {
  let dom;
  let checkDomain;
  let rewriteLinkUrl;

  beforeEach(async () => {
    vi.resetModules();
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://about.bankofamerica.com/' });
    global.window = dom.window;
    global.document = dom.window.document;
    ({
      checkDomain,
      rewriteLinkUrl,
    } = await import('../../scripts/utils.js'));
  });

  afterEach(() => {
    dom.window.close();
    delete global.window;
    delete global.document;
  });

  describe('checkDomain', () => {
    it('identifies production domains', () => {
      const result = checkDomain('https://about.bankofamerica.com/news');

      expect(result).toMatchObject({
        isProd: true,
        isAem: false,
        isLocal: false,
        isKnown: true,
        isExternal: false,
        isPreview: false,
      });
    });

    it('identifies aem preview domains', () => {
      const result = checkDomain(new URL('https://main--about-boa--aemsites.aem.page/about'));

      expect(result).toMatchObject({
        isProd: false,
        isAem: true,
        isLocal: false,
        isKnown: true,
        isExternal: false,
        isPreview: true,
      });
    });

    it('identifies branch preview domains on aem.page', () => {
      const result = checkDomain('https://feature-foo--about-boa--aemsites.aem.page/path');

      expect(result).toMatchObject({
        isProd: false,
        isAem: true,
        isLocal: false,
        isKnown: true,
        isExternal: false,
        isPreview: true,
      });
    });

    it('identifies branch live domains on aem.live', () => {
      const result = checkDomain('https://feature-foo--about-boa--aemsites.aem.live/path');

      expect(result).toMatchObject({
        isProd: false,
        isAem: true,
        isLocal: false,
        isKnown: true,
        isExternal: false,
        isPreview: false,
      });
    });

    it('recognizes localhost domains', () => {
      const result = checkDomain('http://localhost:3000/path');

      expect(result).toMatchObject({
        isProd: false,
        isAem: false,
        isLocal: true,
        isKnown: true,
        isExternal: false,
        isPreview: true,
      });
    });

    it('flags external domains', () => {
      const result = checkDomain('https://example.com/path');

      expect(result).toMatchObject({
        isProd: false,
        isAem: false,
        isLocal: false,
        isKnown: false,
        isExternal: true,
        isPreview: false,
      });
    });
  });

  describe('rewriteLinkUrl', () => {
    it('rewrites known domain links to relative paths', () => {
      const link = document.createElement('a');
      link.href = 'https://about.bankofamerica.com/some/path?query=1#hash';

      const result = rewriteLinkUrl(link);

      expect(result.getAttribute('href')).toBe('/some/path?query=1#hash');
      expect(result.target).toBe('');
      expect(result.rel).toBe('');
    });

    it('rewrites branch preview links on aem.page to relative paths', () => {
      const link = document.createElement('a');
      link.href = 'https://feature-foo--about-boa--aemsites.aem.page/some/path';

      const result = rewriteLinkUrl(link);

      expect(result.getAttribute('href')).toBe('/some/path');
      expect(result.target).toBe('');
      expect(result.rel).toBe('');
    });

    it('rewrites branch live links on aem.live to relative paths', () => {
      const link = document.createElement('a');
      link.href = 'https://feature-foo--about-boa--aemsites.aem.live/some/path';

      const result = rewriteLinkUrl(link);

      expect(result.getAttribute('href')).toBe('/some/path');
      expect(result.target).toBe('');
      expect(result.rel).toBe('');
    });

    it('marks external links to open in new tabs', () => {
      const link = document.createElement('a');
      link.href = 'https://external.example.com/resource';

      const result = rewriteLinkUrl(link);

      expect(result.target).toBe('_blank');
      expect(result.rel).toBe('noopener noreferrer');
      expect(result.getAttribute('href')).toBe('https://external.example.com/resource');
    });

    it('ignores non-http protocols', () => {
      const link = document.createElement('a');
      link.href = 'mailto:test@example.com';

      const result = rewriteLinkUrl(link);

      expect(result.getAttribute('href')).toBe('mailto:test@example.com');
      expect(result.target).toBe('');
      expect(result.rel).toBe('');
    });
  });
});
