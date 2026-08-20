import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Order, OrderStage } from '@smartcloudkitchen/types';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';
import { Header } from '../components/Header';

const STAGE_INDEX: Record<OrderStage, number> = { new: 0, cooking: 1, ready: 2, picked: 3 };

const STEP_DEFS = [
  { label: 'Order accepted', note: 'kitchen confirmed' },
  { label: 'On the line', note: 'cooking now' },
  { label: 'Packed & ready', note: 'waiting for rider' },
  { label: 'On the way', note: 'arriving shortly' },
];

// Demo-only cadence for advanceTrackedOrder — a live Supabase link replaces
// this with a realtime subscription to the kitchen's own stage updates.
const DEMO_ADVANCE_MS = 15_000;

export function TrackScreen() {
  const { orders, trackOrderId, now, tick, advanceTrackedOrder } = useCustomerStore();
  const order = orders.find((o) => o.id === trackOrderId) ?? null;

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  useEffect(() => {
    if (!order || order.stage === 'picked') return;
    const id = setInterval(advanceTrackedOrder, DEMO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [order?.id, order?.stage, advanceTrackedOrder]);

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg }}>
      <Header title="Order tracking" subtitle="LIVE" />
      {!order ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No live order yet. Place one from the menu and it lands in the kitchen queue.</Text>
        </View>
      ) : (
        <TrackContent order={order} now={now} />
      )}
    </View>
  );
}

function TrackContent({ order, now }: { order: Order; now: number }) {
  const stageIdx = STAGE_INDEX[order.stage];
  const headline =
    stageIdx >= 3 ? 'Rider is on the way' : stageIdx === 2 ? 'Packed — rider arriving' : stageIdx === 1 ? 'Cooking now' : 'Kitchen has your order';
  const elapsedMin = Math.floor((now - new Date(order.placed_at).getTime()) / 60000);
  const etaMin = Math.max(1, order.promise_minutes - elapsedMin);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.summary}>
        <Text style={styles.summaryEyebrow}>{order.code} · {order.channel.toUpperCase()}</Text>
        <Text style={styles.summaryHeadline}>{headline}</Text>
        <Text style={styles.summarySub}>Arriving in about {etaMin} min. Watch it move as the kitchen bumps the ticket.</Text>
      </View>

      <View>
        {STEP_DEFS.map((step, idx) => {
          const done = idx < stageIdx;
          const active = idx === stageIdx;
          return (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, { backgroundColor: done ? '#4FD08E' : active ? '#E08A12' : '#E6DDCD', borderColor: done || active ? 'transparent' : '#EFE7D8' }]} />
                {idx < STEP_DEFS.length - 1 ? <View style={[styles.stepLine, { backgroundColor: done ? '#4FD08E' : '#E6DDCD' }]} /> : null}
              </View>
              <View style={{ paddingBottom: 14, gap: 3 }}>
                <Text style={[styles.stepLabel, { color: done || active ? customer.text : '#A79D8E' }]}>{step.label}</Text>
                <Text style={styles.stepNote}>{idx <= stageIdx ? step.note : '—'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.map}>
        <Text style={styles.mapLabel}>live rider map</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  empty: { margin: 16, padding: 44, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: customer.border, alignItems: 'center' },
  emptyText: { fontFamily: type.display, fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#9A9184', textAlign: 'center' },
  summary: { padding: 18, borderRadius: 18, backgroundColor: customer.text, gap: 8 },
  summaryEyebrow: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.6, color: '#C8B896' },
  summaryHeadline: { fontFamily: type.display, fontWeight: '700', fontSize: 24, lineHeight: 29, color: customer.bg },
  summarySub: { fontFamily: type.display, fontWeight: '400', fontSize: 13, lineHeight: 19, color: '#BFB4A2' },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepRail: { alignItems: 'center', width: 20 },
  stepDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  stepLine: { width: 2, flex: 1, minHeight: 44 },
  stepLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 15 },
  stepNote: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: customer.textFaint },
  map: { height: 150, borderRadius: 16, backgroundColor: '#EFE7D8', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  mapLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, color: '#A09684' },
});
