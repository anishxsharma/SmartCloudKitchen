import { kitchen, brandColor } from '@smartcloudkitchen/design-tokens';
import type { OrderStage } from '@smartcloudkitchen/types';

/** ₹340 style formatting. Prices/costs are stored in paise (price_cents). */
export function money(cents: number): string {
  return '₹' + Math.round(cents / 100).toLocaleString('en-IN');
}

export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export interface TicketTiming {
  elapsedLabel: string;
  pct: number;
  color: string;
  promiseMinutes: number;
}

/**
 * Elapsed/remaining state for one ticket, derived on every tick rather than
 * stored — mirrors the prototype's timing(o), including rush-mode
 * compressing the promise window by 30%.
 */
export function ticketTiming(
  placedAt: string,
  promiseMinutes: number,
  now: number,
  rushMode = false
): TicketTiming {
  const promise = promiseMinutes * (rushMode ? 0.7 : 1);
  const elapsedSeconds = (now - new Date(placedAt).getTime()) / 1000;
  const frac = elapsedSeconds / (promise * 60);
  const color = frac > 1 ? kitchen.warn : frac > 0.7 ? kitchen.accent : kitchen.good;
  return {
    elapsedLabel: mmss(elapsedSeconds),
    pct: Math.min(100, frac * 100),
    color,
    promiseMinutes: Math.round(promise),
  };
}

const NEXT_STAGE: Record<OrderStage, OrderStage> = {
  new: 'cooking',
  cooking: 'ready',
  ready: 'picked',
  picked: 'picked',
};

export function nextStage(stage: OrderStage): OrderStage {
  return NEXT_STAGE[stage];
}

export function actionForStage(stage: OrderStage): { label: string; bg: string; fg: string } {
  if (stage === 'new') return { label: 'Start cooking', bg: kitchen.accent, fg: '#191510' };
  if (stage === 'cooking') return { label: 'Mark ready', bg: kitchen.good, fg: '#0F2318' };
  if (stage === 'ready') return { label: 'Hand to rider', bg: kitchen.border, fg: kitchen.text };
  return { label: 'Picked up', bg: kitchen.border, fg: kitchen.textFaint };
}

export function colorForBrand(brand: string): string {
  return (brandColor as Record<string, string>)[brand] ?? kitchen.accent;
}
