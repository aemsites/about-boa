/**
 * Gets the social share URL for a given platform
 * @param {string} platform - The social media platform (facebook, twitter, linkedin, mail)
 * @param {string} pageUrl - The current page URL to share
 * @param {string} pageTitle - The page title for sharing
 * @returns {string} The share URL for the platform
 */
function getShareUrl(platform, pageUrl, pageTitle) {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(pageTitle);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?source=webclient&text=${encodedTitle} ${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&title=${encodedTitle}&summary=&source=&url=${encodedUrl}`,
    mail: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  return shareUrls[platform] || '#';
}

/**
 * Decorates the social share block
 * @param {Element} block The social share block element
 */
export default function decorate(block) {
  // Get the current page URL and title
  const pageUrl = window.location.href;
  const pageTitle = document.title;

  // Find the list of social media icons
  const ul = block.querySelector('ul');
  if (!ul) return;

  // Convert each list item to a link with the appropriate share URL
  const items = ul.querySelectorAll('li');
  items.forEach((li) => {
    const iconSpan = li.querySelector('span.icon');
    if (!iconSpan) return;

    // Get the platform name from the icon class (e.g., "icon-facebook" -> "facebook")
    const iconClass = Array.from(iconSpan.classList).find((c) => c.startsWith('icon-'));
    if (!iconClass) return;

    const platform = iconClass.substring(5); // Remove "icon-" prefix
    const shareUrl = getShareUrl(platform, pageUrl, pageTitle);

    // Create the link
    const link = document.createElement('a');
    link.href = shareUrl;
    link.className = `social-share-link social-share-${platform}`;
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('target', '_blank');

    // Create screen reader only text
    const srOnly = document.createElement('span');
    srOnly.className = 'sr-only';
    srOnly.textContent = `Share with ${platform}. Opens a modal popup.`;

    // Move the icon into the link and add sr-only text
    link.appendChild(iconSpan);
    link.appendChild(srOnly);

    // Replace the list item content with the link
    li.innerHTML = '';
    li.appendChild(link);
  });
}
