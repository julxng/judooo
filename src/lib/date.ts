export const todayIso = (): string => new Date().toISOString().split('T')[0];

export const shiftIsoDate = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const formatDateRange = (start: string, end: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
};
