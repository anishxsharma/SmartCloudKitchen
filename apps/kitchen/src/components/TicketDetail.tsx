import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MenuItem, Order, OrderLine } from '@smartcloudkitchen/types';
import { actionForStage, colorForBrand, ticketTiming } from '@smartcloudkitchen/domain';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';

export function TicketDetail({
  order,
  brandName,
  lines,
  items,
  now,
  onToggleLine,
  onAction,
  onBack,
}: {
  order: Order;
  brandName: string;
  lines: OrderLine[];
  items: MenuItem[];
  now: number;
  onToggleLine: (lineId: string) => void;
  onAction: () => void;
  onBack?: () => void;
}) {
  const timing = ticketTiming(order.placed_at, order.promise_minutes, now);
  const action = actionForStage(order.stage);
  const brandColor = colorForBrand(brandName);
  const edge = timing.pct >= 100 ? '#5B2E22' : kitchen.borderSoft;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← QUEUE</Text>
        </Pressable>
      ) : null}

      <View style={[styles.summary, { borderColor: edge }]}>
        <View style={{ gap: 7 }}>
          <Text style={styles.code}>{order.code}</Text>
          <View style={[styles.brandPill, { backgroundColor: brandColor + '22' }]}>
            <Text style={[styles.brandPillText, { color: brandColor }]}>{brandName}</Text>
          </View>
          <Text style={styles.meta}>
            {order.channel.toUpperCase()} · {order.stage.toUpperCase()}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={[styles.elapsed, { color: timing.color }]}>{timing.elapsedLabel}</Text>
          <Text style={styles.promise}>promise {timing.promiseMinutes} min</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>TAP AS YOU PLATE</Text>
      <View style={{ gap: 8 }}>
        {lines.map((line) => {
          const item = items.find((i) => i.id === line.menu_item_id);
          return (
            <Pressable
              key={line.id}
              onPress={() => onToggleLine(line.id)}
              style={[
                styles.lineRow,
                { backgroundColor: line.done ? kitchen.doneBg : kitchen.surface, borderColor: line.done ? kitchen.doneBorder : kitchen.borderSoft },
              ]}
            >
              <View style={[styles.checkbox, { backgroundColor: line.done ? kitchen.good : 'transparent', borderColor: line.done ? kitchen.good : '#4A4238' }]}>
                {line.done ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.lineName, { color: line.done ? '#8FD8AE' : kitchen.text }]}>
                  {line.qty} {item?.name ?? line.menu_item_id}
                </Text>
                <Text style={styles.lineSub}>
                  {item?.station} · {line.note ?? 'no mods'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>{order.note || 'No customer notes on this ticket.'}</Text>
      </View>

      <Pressable onPress={onAction} style={[styles.actionBtn, { backgroundColor: action.bg }]}>
        <Text style={[styles.actionLabel, { color: action.fg }]}>{action.label}</Text>
      </Pressable>
      <View style={styles.flagBtn}>
        <Text style={styles.flagLabel}>Flag a problem</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  back: { fontFamily: type.mono, fontWeight: '600', fontSize: 12, letterSpacing: 0.8, color: kitchen.textSoft },
  summary: { padding: 16, borderRadius: 16, borderWidth: 1, backgroundColor: kitchen.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontFamily: type.mono, fontWeight: '700', fontSize: 24, color: kitchen.text },
  brandPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  brandPillText: { fontFamily: type.display, fontWeight: '600', fontSize: 11 },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  elapsed: { fontFamily: type.mono, fontWeight: '600', fontSize: 40 },
  promise: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  sectionLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1.6, color: kitchen.textFaint },
  lineRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#14120F', fontWeight: '700', fontSize: 14 },
  lineName: { fontFamily: type.display, fontWeight: '600', fontSize: 16 },
  lineSub: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.4, color: kitchen.textFaint },
  noteBox: { padding: 13, borderRadius: 14, backgroundColor: kitchen.insightBg, borderWidth: 1, borderColor: kitchen.insightBorder },
  noteText: { fontFamily: type.display, fontWeight: '500', fontSize: 13, color: '#E8DCC4', lineHeight: 19 },
  actionBtn: { minHeight: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 17 },
  flagBtn: { minHeight: minTapTarget, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#35302A' },
  flagLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 14, color: kitchen.textSoft },
});
