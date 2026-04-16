export const formatCurrency = (value: number, currency = 'VND'): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`;
