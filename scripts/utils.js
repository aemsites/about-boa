export const PRODUCTION_DOMAINS = ['about.bankofamerica.com'];

const domainCheckCache = {};
/**
 * Checks a url to determine if it is a known domain.
 * @param {string | URL} url the url to check
 * @returns {Object} an object with properties indicating the urls domain types.
 */
export function checkDomain(url) {
  const urlToCheck = typeof url === 'string' ? new URL(url) : url;

  let result = domainCheckCache[urlToCheck.hostname];
  if (!result) {
    const isProd = PRODUCTION_DOMAINS.some((host) => urlToCheck.hostname.includes(host));
    const isAem = ['aem.page', 'aem.live'].some((host) => urlToCheck.hostname.includes(host));
    const isLocal = urlToCheck.hostname.includes('localhost');
    const isPreview = isLocal || urlToCheck.hostname.includes('aem.page');
    const isKnown = isProd || isAem || isLocal;
    const isExternal = !isKnown;
    result = {
      isProd,
      isAem,
      isLocal,
      isKnown,
      isExternal,
      isPreview,
    };

    domainCheckCache[urlToCheck.hostname] = result;
  }

  return result;
}

/**
 * @returns {Object} an object with properties indicating the urls domain types.
 */
export function checkBrowserDomain() {
  return checkDomain(window.location);
}

/**
 * Modifies a link element to be relative if it is a local link.
 * @param {Element} a the anchor (link) element
 * @returns {Element} the modified anchor element
 */
export function rewriteLinkUrl(a) {
  const url = new URL(a.href);
  const domainCheck = checkDomain(url);
  // protect against maito: links or other weirdness
  const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
  if (!isHttp) return a;

  if (domainCheck.isKnown) {
    // local links are rewritten to be relative
    a.href = `${url.pathname}${url.search}${url.hash}`;
  } else if (domainCheck.isExternal) {
    // non local open in a new tab
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }

  return a;
}

/**
 * Enables smooth scrolling for same-page anchor links
 * @param {Element} main the main content element
 */
export function enableSmoothAnchorScroll(main) {
  main.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    const url = new URL(anchor.href, window.location.origin);
    const isSamePage = url.origin === window.location.origin
      && url.pathname === window.location.pathname;

    if (url.hash && isSamePage) {
      anchor.addEventListener('click', (e) => {
        const target = document.getElementById(url.hash.slice(1));
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('.nav-main')?.offsetHeight || 0;
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - headerHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  });
}
