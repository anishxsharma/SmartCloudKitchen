import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import { money, colorForBrand } from '@smartcloudkitchen/domain';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';

interface LocationSales {
  revenueCents: number;
  orders: number;
  avgPrepSeconds: number;
  marginPct: number;
  revenueDelta: string;
  ordersDelta: string;
  prepDelta: string;
  marginDelta: string;
  hours: number[];
  brands: { name: string; revCents: number; margin: number }[];
}

const HOUR_LABELS = ['11', '12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Fixture numbers per location — a real Sales screen reads these from
// aggregated Postgres views instead. Deltas ("+18% vs last Thu") aren't
// combined across locations when "All locations" is selected since that
// needs real historical data to mean anything; the primary location's
// deltas are shown as a representative figure in that case.
const SALES_BY_LOCATION: Record<string, LocationSales> = {
  loc1: {
    revenueCents: 13400000, orders: 156, avgPrepSeconds: 700, marginPct: 63,
    revenueDelta: '+18% vs last Thu', ordersDelta: '+12% vs last Thu', prepDelta: '−90s vs last Thu', marginDelta: '−2 pts · chicken cost',
    hours: [4, 7, 9, 14, 22, 17, 9, 6, 8, 15, 26, 19],
    brands: [
      { name: 'Curry Line', revCents: 4820000, margin: 62 },
      { name: 'Slice Lab', revCents: 3910000, margin: 68 },
      { name: 'Bowl & Bird', revCents: 2740000, margin: 59 },
      { name: 'Wok Theory', revCents: 1890000, margin: 64 },
    ],
  },
  loc2: {
    revenueCents: 4180000, orders: 52, avgPrepSeconds: 650, marginPct: 61,
    revenueDelta: '+9% vs last Thu', ordersDelta: '+6% vs last Thu', prepDelta: '−20s vs last Thu', marginDelta: '+1 pt vs last Thu',
    hours: [1, 2, 2, 4, 6, 5, 3, 2, 2, 4, 7, 5],
    brands: [
      { name: 'Curry Line', revCents: 2480000, margin: 60 },
      { name: 'Wok Theory', revCents: 1700000, margin: 63 },
    ],
  },
};

function mmss(totalSeconds: number): string {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function SalesScreen() {
  const visibleLocationIds = useVisibleLocationIds();
  const multiLocation = visibleLocationIds.length > 1;

  const locationLabel = multiLocation
    ? 'ALL LOCATIONS'
    : (LOCATIONS.find((l) => l.id === visibleLocationIds[0])?.name.toUpperCase() ?? '');

  const perLocation = visibleLocationIds.map((id) => SALES_BY_LOCATION[id]).filter(Boolean);
  const primary = perLocation[0] ?? SALES_BY_LOCATION.loc1;

  const revenueCents = perLocation.reduce((a, l) => a + l.revenueCents, 0);
  const orders = perLocation.reduce((a, l) => a + l.orders, 0);
  const hmaxLen = Math.max(...perLocation.map((l) => l.hours.length));
  const hours = Array.from({ length: hmaxLen }, (_, i) => perLocation.reduce((a, l) => a + (l.hours[i] ?? 0), 0));
  const hmax = Math.max(...hours);

  const kpis = [
    { label: 'REVENUE', value: money(revenueCents), delta: primary.revenueDelta, good: true },
    { label: 'ORDERS', value: String(orders), delta: primary.ordersDelta, good: true },
    { label: 'AVG PREP', value: mmss(primary.avgPrepSeconds), delta: primary.prepDelta, good: true },
    { label: 'MARGIN', value: `${primary.marginPct}%`, delta: primary.marginDelta, good: !primary.marginDelta.startsWith('−') },
  ];

  const brandRows = perLocation.flatMap((l, idx) => {
    const locName = LOCATIONS.find((loc) => loc.id === visibleLocationIds[idx])?.name ?? '';
    return l.brands.map((b) => ({ ...b, key: `${visibleLocationIds[idx]}-${b.name}`, suffix: multiLocation ? ` · ${locName}` : '' }));
  });
  const bmax = Math.max(...brandRows.map((b) => b.revCents));

  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      <Header title="Today" subtitle={locationLabel} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.kpiGrid}>
          {kpis.map((k) => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={[styles.kpiDelta, { color: k.good ? kitchen.good : kitchen.warn }]}>{k.delta}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionLabel}>ORDERS BY HOUR</Text>
          <View style={styles.chartRow}>
            {hours.map((v, idx) => (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${Math.round((v / hmax) * 100)}%`, backgroundColor: v === hmax ? kitchen.accent : '#3E382E' },
                    ]}
                  />
                </View>
                <Text style={styles.chartHourLabel}>{HOUR_LABELS[idx]}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { paddingLeft: 2 }]}>BRAND CONTRIBUTION</Text>
        <View style={{ gap: 10 }}>
          {brandRows.map((b) => {
            const pct = Math.round((b.revCents / bmax) * 100);
            const orderCount = Math.round(b.revCents / 34000);
            return (
              <View key={b.key} style={styles.brandRow}>
                <View style={styles.brandTop}>
                  <Text style={styles.brandName}>{b.name}{b.suffix}</Text>
                  <Text style={styles.brandRev}>{money(b.revCents)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorForBrand(b.name) }]} />
                </View>
                <Text style={styles.brandFoot}>
                  {b.margin}% margin · {orderCount} orders
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flexBasis: '45%', flexGrow: 1, padding: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 6 },
  kpiLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, letterSpacing: 1.2, color: kitchen.textFaint },
  kpiValue: { fontFamily: type.mono, fontWeight: '700', fontSize: 25, color: kitchen.text, letterSpacing: -0.5 },
  kpiDelta: { fontFamily: type.display, fontWeight: '500', fontSize: 11 },
  chartCard: { padding: 16, paddingHorizontal: 14, borderRadius: 16, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 12 },
  sectionLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1.4, color: kitchen.textFaint },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 110 },
  chartCol: { flex: 1, gap: 6, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBarTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4 },
  chartHourLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 9, color: '#6F675C' },
  brandRow: { padding: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, gap: 9 },
  brandTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  brandName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  brandRev: { fontFamily: type.mono, fontWeight: '600', fontSize: 14, color: kitchen.text },
  track: { height: 6, borderRadius: 99, backgroundColor: kitchen.borderSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  brandFoot: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
});
