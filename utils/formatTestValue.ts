import { CardConfig } from '../types';

/**
 * Formats a test value according to card formatting preferences
 * Used in both Preview and Editor for consistent value formatting
 */
export const formatTestValue = (raw: number, card: CardConfig): string => {
  const { formatType, decimalPlaces = 0, prefix = '', suffix = '' } = card;
  const abs = Math.abs(raw);
  const fmt = (n: number, dec = decimalPlaces) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  if (formatType === 'none') return `${prefix}${raw}${suffix}`;
  if (formatType === 'integer') return raw.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (formatType === 'percent') return `${(raw * 100).toFixed(decimalPlaces)}%`;
  if (formatType === 'currency') return `${prefix || 'R$ '}${fmt(raw)}${suffix}`;
  if (formatType === 'currency_short' || formatType === 'short') {
    const pre = formatType === 'currency_short' ? (prefix || 'R$ ') : prefix;
    if (abs >= 1e9) return `${pre}${fmt(raw / 1e9)} B${suffix}`;
    if (abs >= 1e6) return `${pre}${fmt(raw / 1e6)} M${suffix}`;
    if (abs >= 1e3) return `${pre}${fmt(raw / 1e3)} K${suffix}`;
    return `${pre}${fmt(raw)}${suffix}`;
  }
  return `${prefix}${fmt(raw)}${suffix}`;
};
