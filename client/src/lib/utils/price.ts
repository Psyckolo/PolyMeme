export function formatPrice(price: number): string {
  if (price === 0) return "$0.0000";
  
  if (price < 0.01) {
    const priceStr = price.toFixed(20);
    const match = priceStr.match(/\.0*[1-9]/);
    if (match) {
      const zerosCount = match[0].length - 2;
      const significantDecimals = Math.min(zerosCount + 4, 10);
      return `$${price.toFixed(significantDecimals)}`;
    }
  }
  
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(0)}`;
}
