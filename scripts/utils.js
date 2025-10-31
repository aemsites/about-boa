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
 * check if link text is same as the href
 * @param {Element} link the link element
 * @returns {boolean} true or false
 */
export function linkTextIncludesHref(link) {
  const href = link.getAttribute('href');
  const textcontent = link.textContent;

  return textcontent.includes(href);
}
