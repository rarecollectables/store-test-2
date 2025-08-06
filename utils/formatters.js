export const formatPrice = (price) => {
  if (typeof price !== 'number') {
    try {
      price = parseFloat(price);
    } catch (e) {
      return 'N/A';
    }
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(price);
};
