import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { money } from '@smartcloudkitchen/domain';
import { colorForBrand } from '@smartcloudkitchen/domain';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { Header } from '../components/Header';

const KPIS = [
  { label: 'REVENUE', value: '₹1.34L', delta: '+18% vs last Thu', good: true },
  { label: 'ORDERS', value: '156', delta: '+12% vs last Thu', good: true },
  { label: 'AVG PREP', value: '11:40', delta: '−90s vs last Thu', good: true },
  { label: 'MARGIN', value: '63%', delta: '−2 pts · chicken cost', good: false },
];

const HOURS = [4, 7, 9, 14, 22, 17, 9, 6, 8, 15, 26, 19];
const HOUR_LABELS = ['11', '12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const HMAX = Math.max(...HOURS);

const BRAND_TOTALS = [
  { name: 'Curry Line', revCents: 4820000, margin: 62 },
  { name: 'Slice Lab', revCents: 3910000, margin: 68 },
  { name: 'Bowl & Bird', revCents: 2740000, margin: 59 },
  { name: 'Wok Theory', revCents: 1890000, margin: 64 },
];
const BMAX = BRAND_TOTALS[0].revCents;

export function SalesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      <Header title="Today" subtitle="HSR KITCHEN 04 · 4 BRANDS" />
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.kpiGrid}>
          {KPIS.map((k) => (
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
            {HOURS.map((v, idx) => (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${Math.round((v / HMAX) * 100)}%`, backgroundColor: v === HMAX ? kitchen.accent : '#3E382E' },
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
          {BRAND_TOTALS.map((b) => {
            const pct = Math.round((b.revCents / BMAX) * 100);
            const orders = Math.round(b.revCents / 34000);
            return (
              <View key={b.name} style={styles.brandRow}>
                <View style={styles.brandTop}>
                  <Text style={styles.brandName}>{b.name}</Text>
                  <Text style={styles.brandRev}>{money(b.revCents)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorForBrand(b.name) }]} />
                </View>
                <Text style={styles.brandFoot}>
                  {b.margin}% margin · {orders} orders
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
