import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useKitchenStore } from '../store/kitchenStore';
import { useLocationName, useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';

export function StockScreen() {
  const { stock, items, stockOrdered, requestReorder, toggleItemAvailable } = useKitchenStore(
    useShallow((s) => ({
      stock: s.stock,
      items: s.items,
      stockOrdered: s.stockOrdered,
      requestReorder: s.requestReorder,
      toggleItemAvailable: s.toggleItemAvailable,
    }))
  );
  const visibleLocationIds = useVisibleLocationIds();
  const singleLocationName = useLocationName(visibleLocationIds.length === 1 ? visibleLocationIds[0] : null);

  const scopedStock = stock.filter((s) => visibleLocationIds.includes(s.location_id));
  const locationLabel = visibleLocationIds.length === 1 ? singleLocationName.toUpperCase() : 'ALL LOCATIONS';

  const withPct = scopedStock.map((s) => ({ ...s, pct: Math.round((s.qty / s.par) * 100) }));
  const lowCount = withPct.filter((s) => s.pct < 30).length;
  const okCount = withPct.length - lowCount;

  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      <Header title="Inventory" subtitle={locationLabel} />
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: kitchen.warn }]}>{lowCount}</Text>
          <Text style={styles.summaryLabel}>below par</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: kitchen.good }]}>{okCount}</Text>
          <Text style={styles.summaryLabel}>healthy</Text>
        </View>
      </View>

      <FlatList
        data={withPct}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: s }) => {
          const low = s.pct < 30;
          const color = s.pct < 25 ? kitchen.warn : s.pct < 50 ? kitchen.accent : kitchen.good;
          const linked = items.find((i) => i.id === s.linked_item_id);
          const off = linked && !linked.available;
          const ordered = !!stockOrdered[s.id];
          const foot = ordered ? "reorder placed · ETA tomorrow 07:00" : `${s.par} ${s.unit} par · feeds ${linked?.name ?? 'multiple items'}`;
          const actLabel = low && linked ? (off ? 'Back on menu' : `86 ${linked.name.split(' ')[0]}`) : ordered ? 'Ordered' : 'Reorder';

          return (
            <View style={[styles.row, { borderColor: low ? '#5B2E22' : kitchen.borderSoft }]}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={[styles.qty, { color }]}>{s.qty} {s.unit}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(100, s.pct)}%`, backgroundColor: color }]} />
              </View>
              <View style={styles.rowBottom}>
                <Text style={styles.foot}>{foot}</Text>
                <Pressable
                  onPress={() => (low && linked ? toggleItemAvailable(linked.id) : requestReorder(s.id))}
                  style={[styles.actBtn, { backgroundColor: low ? '#3A1F16' : kitchen.surface, borderColor: low ? '#5B2E22' : '#3A342B' }]}
                >
                  <Text style={[styles.actLabel, { color: low ? '#FF9B7F' : kitchen.textSoft }]}>{actLabel}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft },
  summaryValue: { fontFamily: type.mono, fontWeight: '700', fontSize: 26 },
  summaryLabel: { fontFamily: type.display, fontWeight: '500', fontSize: 11, color: kitchen.textFaint, marginTop: 6 },
  list: { padding: 16, gap: 14 },
  row: { padding: 14, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  name: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  qty: { fontFamily: type.mono, fontWeight: '600', fontSize: 13 },
  track: { height: 6, borderRadius: 99, backgroundColor: kitchen.borderSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  foot: { flex: 1, fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  actBtn: { height: 40, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 12 },
});
