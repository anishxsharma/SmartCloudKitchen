import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  fetchFeedbackForLocations,
  fetchTodayHourly,
  fetchTodaySalesByBrand,
  fetchTodaySalesByLocation,
  type FeedbackWithOrder,
} from '@smartcloudkitchen/api-client';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import type { DailyBrandSales, DailyLocationSales, HourlyOrders } from '@smartcloudkitchen/types';
import { money, colorForBrand } from '@smartcloudkitchen/domain';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => String(h));

function mmss(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function SalesScreen() {
  const visibleLocationIds = useVisibleLocationIds();
  const multiLocation = visibleLocationIds.length > 1;
  const locationLabel = multiLocation
    ? 'ALL LOCATIONS'
    : (LOCATIONS.find((l) => l.id === visibleLocationIds[0])?.name.toUpperCase() ?? '');

  const [loading, setLoading] = useState(true);
  const [byLocation, setByLocation] = useState<DailyLocationSales[]>([]);
  const [byBrand, setByBrand] = useState<DailyBrandSales[]>([]);
  const [hourly, setHourly] = useState<HourlyOrders[]>([]);
  const [feedback, setFeedback] = useState<FeedbackWithOrder[]>([]);

  useEffect(() => {
    if (!visibleLocationIds.length) return;
    setLoading(true);
    Promise.all([
      fetchTodaySalesByLocation(visibleLocationIds),
      fetchTodaySalesByBrand(visibleLocationIds),
      fetchTodayHourly(visibleLocationIds),
      fetchFeedbackForLocations(visibleLocationIds),
    ])
      .then(([loc, brand, hour, fb]) => {
        setByLocation(loc);
        setByBrand(brand);
        setHourly(hour);
        setFeedback(fb);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visibleLocationIds.join(',')]);

  const revenueCents = byLocation.reduce((a, l) => a + l.revenue_cents, 0);
  const costCents = byLocation.reduce((a, l) => a + l.cost_cents, 0);
  const orders = byLocation.reduce((a, l) => a + l.completed_orders, 0);
  const marginPct = revenueCents > 0 ? Math.round((1 - costCents / revenueCents) * 100) : 0;

  const prepSamples = byLocation.filter((l) => l.avg_prep_seconds != null && l.completed_orders > 0);
  const weightedPrepSeconds = prepSamples.reduce((a, l) => a + l.avg_prep_seconds! * l.completed_orders, 0);
  const prepWeight = prepSamples.reduce((a, l) => a + l.completed_orders, 0);
  const avgPrep = prepWeight > 0 ? weightedPrepSeconds / prepWeight : null;

  const kpis = [
    { label: 'REVENUE', value: money(revenueCents) },
    { label: 'ORDERS', value: String(orders) },
    { label: 'AVG PREP', value: avgPrep != null ? mmss(avgPrep) : '—' },
    { label: 'MARGIN', value: orders > 0 ? `${marginPct}%` : '—' },
  ];

  const hours = HOUR_LABELS.map((_, h) => hourly.filter((r) => r.hour === h).reduce((a, r) => a + r.order_count, 0));
  const hmax = Math.max(1, ...hours);

  const brandRows = byBrand.map((b) => {
    const locName = LOCATIONS.find((l) => l.id === b.location_id)?.name ?? '';
    const margin = b.revenue_cents > 0 ? Math.round((1 - b.cost_cents / b.revenue_cents) * 100) : 0;
    return { ...b, key: `${b.location_id}-${b.brand_id}`, suffix: multiLocation ? ` · ${locName}` : '', margin };
  });
  const bmax = Math.max(1, ...brandRows.map((b) => b.revenue_cents));

  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      <Header title="Today" subtitle={locationLabel} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={kitchen.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
              </View>
            ))}
          </View>
          {orders === 0 ? (
            <Text style={styles.noDataNote}>No completed orders yet today — numbers fill in as tickets get picked up.</Text>
          ) : null}

          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>ORDERS BY HOUR</Text>
            <View style={styles.chartRow}>
              {hours.map((v, idx) => (
                <View key={idx} style={styles.chartCol}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        { height: `${Math.round((v / hmax) * 100)}%`, backgroundColor: v === hmax && v > 0 ? kitchen.accent : '#3E382E' },
                      ]}
                    />
                  </View>
                  {idx % 3 === 0 ? <Text style={styles.chartHourLabel}>{HOUR_LABELS[idx]}</Text> : null}
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionLabel, { paddingLeft: 2 }]}>BRAND CONTRIBUTION</Text>
          {brandRows.length === 0 ? (
            <View style={styles.feedbackEmpty}>
              <Text style={styles.feedbackEmptyText}>No completed orders yet today.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {brandRows.map((b) => {
                const pct = Math.round((b.revenue_cents / bmax) * 100);
                return (
                  <View key={b.key} style={styles.brandRow}>
                    <View style={styles.brandTop}>
                      <Text style={styles.brandName}>{b.brand_name}{b.suffix}</Text>
                      <Text style={styles.brandRev}>{money(b.revenue_cents)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorForBrand(b.brand_name) }]} />
                    </View>
                    <Text style={styles.brandFoot}>
                      {b.margin}% margin · {b.completed_orders} orders
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={[styles.sectionLabel, { paddingLeft: 2 }]}>RECENT FEEDBACK</Text>
          {feedback.length === 0 ? (
            <View style={styles.feedbackEmpty}>
              <Text style={styles.feedbackEmptyText}>No ratings yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {feedback.map((f) => (
                <View key={f.id} style={styles.feedbackRow}>
                  <View style={styles.feedbackTop}>
                    <Text style={styles.feedbackCode}>{f.order.code}</Text>
                    <Text style={styles.feedbackStars}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</Text>
                  </View>
                  {f.comment ? <Text style={styles.feedbackComment}>{f.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flexBasis: '45%', flexGrow: 1, padding: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 6 },
  kpiLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, letterSpacing: 1.2, color: kitchen.textFaint },
  kpiValue: { fontFamily: type.mono, fontWeight: '700', fontSize: 25, color: kitchen.text, letterSpacing: -0.5 },
  noDataNote: { fontFamily: type.display, fontWeight: '500', fontSize: 12, lineHeight: 17, color: kitchen.textFaint, marginTop: -6 },
  chartCard: { padding: 16, paddingHorizontal: 14, borderRadius: 16, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 12 },
  sectionLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1.4, color: kitchen.textFaint },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 110 },
  chartCol: { flex: 1, gap: 6, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBarTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 2 },
  chartHourLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 9, color: '#6F675C' },
  brandRow: { padding: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 9 },
  brandTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  brandName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  brandRev: { fontFamily: type.mono, fontWeight: '600', fontSize: 14, color: kitchen.text },
  track: { height: 6, borderRadius: 99, backgroundColor: kitchen.borderSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  brandFoot: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  feedbackEmpty: { padding: 24, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: kitchen.borderSoft, alignItems: 'center' },
  feedbackEmptyText: { fontFamily: type.display, fontWeight: '500', fontSize: 13, color: kitchen.textFaint },
  feedbackRow: { padding: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 6 },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackCode: { fontFamily: type.mono, fontWeight: '600', fontSize: 13, color: kitchen.text },
  feedbackStars: { fontFamily: type.display, fontSize: 14, color: kitchen.accent, letterSpacing: 1 },
  feedbackComment: { fontFamily: type.display, fontWeight: '400', fontSize: 12.5, lineHeight: 18, color: kitchen.textSoft },
});
