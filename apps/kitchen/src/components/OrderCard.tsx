import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MenuItem, Order, OrderLine } from '@smartcloudkitchen/types';
import { actionForStage, colorForBrand, ticketTiming } from '@smartcloudkitchen/domain';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';

export function OrderCard({
  order,
  brandName,
  lines,
  items,
  now,
  selected,
  onOpen,
  onAction,
}: {
  order: Order;
  brandName: string;
  lines: OrderLine[];
  items: MenuItem[];
  now: number;
  selected?: boolean;
  onOpen: () => void;
  onAction: () => void;
}) {
  const timing = ticketTiming(order.placed_at, order.promise_minutes, now);
  const action = actionForStage(order.stage);
  const brandColor = colorForBrand(brandName);
  const edge = order.stage === 'ready' ? '#2E5B44' : timing.pct >= 100 ? '#5B2E22' : kitchen.borderSoft;

  return (
    <View style={[styles.card, { borderColor: selected ? kitchen.accent : edge }]}>
      <Pressable onPress={onOpen} style={styles.body}>
        <View style={styles.topRow}>
          <View style={{ gap: 6 }}>
            <View style={styles.codeRow}>
              <Text style={styles.code}>{order.code}</Text>
              <View style={[styles.brandPill, { backgroundColor: brandColor + '22' }]}>
                <Text style={[styles.brandPillText, { color: brandColor }]}>{brandName}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {order.channel.toUpperCase()} · {order.stage.toUpperCase()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={[styles.elapsed, { color: timing.color }]}>{timing.elapsedLabel}</Text>
            <Text style={styles.promise}>/ {timing.promiseMinutes} min</Text>
          </View>
        </View>

        <View style={{ gap: 5 }}>
          {lines.map((line) => {
            const item = items.find((i) => i.id === line.menu_item_id);
            return (
              <View key={line.id} style={styles.lineRow}>
                <Text style={styles.lineQty}>{line.qty}×</Text>
                <Text style={styles.lineName}>{item?.name ?? line.menu_item_id}</Text>
                <Text style={styles.lineStation}>{item?.station}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${timing.pct}%`, backgroundColor: timing.color }]} />
        </View>
      </Pressable>

      <Pressable
        onPress={onAction}
        style={[styles.actionBar, { backgroundColor: action.bg }]}
      >
        <Text style={[styles.actionLabel, { color: action.fg }]}>{action.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, backgroundColor: kitchen.surface, overflow: 'hidden' },
  body: { padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontFamily: type.mono, fontWeight: '700', fontSize: 17, color: kitchen.text },
  brandPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  brandPillText: { fontFamily: type.display, fontWeight: '600', fontSize: 10.5 },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.5, color: kitchen.textFaint },
  elapsed: { fontFamily: type.mono, fontWeight: '600', fontSize: 26 },
  promise: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, color: kitchen.textFaint },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  lineQty: { fontFamily: type.mono, fontWeight: '600', fontSize: 13, color: kitchen.accent, minWidth: 22 },
  lineName: { fontFamily: type.display, fontWeight: '500', fontSize: 14, color: kitchen.text, flex: 1 },
  lineStation: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, letterSpacing: 0.6, color: kitchen.textFaint },
  track: { height: 4, borderRadius: 99, backgroundColor: kitchen.borderSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  actionBar: { minHeight: minTapTarget, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 15 },
});
