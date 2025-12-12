/**
 * Partnership Info Block
 */
export default function decorate(block) {
  // Get the first row which contains statistic and description
  const row = block.querySelector(':scope > div');
  if (!row) return;

  // Iterate through children and assign classes
  [...row.children].forEach((column, index) => {
    if (index === 0) {
      // First column contains the statistic
      column.classList.add('partnership-info-stat');
    } else if (index === 1) {
      // Second column contains the description
      column.classList.add('partnership-info-desc');
    }
  });
}
