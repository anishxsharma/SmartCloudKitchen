/**
 * Ported directly from "SmartCloudKitchen App.dc.html" — the source of truth
 * for both palettes. Keep these in sync with the prototype rather than
 * drifting into app-local hex values.
 */

export const kitchen = {
  bg: '#14120F',
  surface: '#1F1C17',
  surfaceNav: '#181510',
  border: '#2A251E',
  borderSoft: '#2E2921',
  text: '#F5F0E8',
  textSoft: '#A39A8C',
  textFaint: '#8C8376',
  accent: '#FFB020',
  good: '#4FD08E',
  warn: '#FF6B4A',
  insightBg: '#231D12',
  insightBorder: '#4A3A18',
  doneBg: '#17251C',
  doneBorder: '#2E5B44',
} as const;

export const customer = {
  bg: '#F7F2E9',
  surface: '#FFFFFF',
  border: '#E6DDCD',
  text: '#1B1712',
  textSoft: '#7A7065',
  textFaint: '#8A8073',
  ctaBg: '#1B1712',
  ctaFg: '#FFF3DE',
} as const;

/** Per-brand accent — same four brands as the prototype's fixture data. */
export const brandColor = {
  'Curry Line': '#FFB020',
  'Wok Theory': '#4FD08E',
  'Bowl & Bird': '#7FB2FF',
  'Slice Lab': '#FF8A5C',
} as const;

export const type = {
  display: 'Archivo',
  mono: 'IBM Plex Mono',
  weight: { medium: '500', semibold: '600', bold: '700', heavy: '800' },
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

/** Every kitchen tap target must clear this — staff wear gloves on the line. */
export const minTapTarget = 56;
