import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BRANDS, LOCATIONS } from '@smartcloudkitchen/mock-data';
import type { OrderStage } from '@smartcloudkitchen/types';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useKitchenStore } from '../store/kitchenStore';
import { useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';
import { OrderCard } from '../components/OrderCard';
import { TicketDetail } from '../components/TicketDetail';

const FILTERS: { id: 'all' | OrderStage; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'new', label: 'NEW' },
  { id: 'cooking', label: 'COOK' },
  { id: 'ready', label: 'READY' },
];

const TABLET_BREAKPOINT = 768;

export function QueueScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const { orders, lines, items, now, filter, selectedOrderId, tick, setFilter, selectOrder, advanceOrder, toggleLineDone } =
    useKitchenStore();
  const visibleLocationIds = useVisibleLocationIds();

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const brandName = (brandId: string) => BRANDS.find((b) => b.id === brandId)?.name ?? brandId;

  const scopedOrders = orders.filter((o) => visibleLocationIds.includes(o.location_id));
  const brandCount = BRANDS.filter((b) => visibleLocationIds.includes(b.location_id)).length;
  const locationLabel =
    visibleLocationIds.length === 1
      ? (LOCATIONS.find((l) => l.id === visibleLocationIds[0])?.name.toUpperCase() ?? '')
      : 'ALL LOCATIONS';

  const counts: Record<'all' | OrderStage, number> = { all: 0, new: 0, cooking: 0, ready: 0, picked: 0 };
  scopedOrders.forEach((o) => {
    counts.all += o.stage !== 'picked' ? 1 : 0;
    counts[o.stage] += 1;
  });

  const visible = scopedOrders
    .filter((o) => (filter === 'all' ? o.stage !== 'picked' : o.stage === filter))
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());

  const selected = scopedOrders.find((o) => o.id === selectedOrderId) ?? null;

  const list = (
    <View style={{ flex: 1 }}>
      <View style={styles.insight}>
        <View style={styles.insightDot} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.insightTitle}>Surge in 40 min</Text>
          <Text style={styles.insightBody}>
            Butter Chicken demand tracking 34% above last Thursday. Par 8 extra gravy portions and pre-grill 12 thighs
            now.
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
            >
              <Text style={[styles.filterCount, { color: active ? kitchen.accent : kitchen.textSoft }]}>{counts[f.id]}</Text>
              <Text style={[styles.filterLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing on this rail. All caught up.</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ gap: 14, paddingBottom: 24 }}
          renderItem={({ item: order }) => (
            <OrderCard
              order={order}
              brandName={brandName(order.brand_id)}
              lines={lines.filter((l) => l.order_id === order.id)}
              items={items}
              now={now}
              selected={isTablet && order.id === selectedOrderId}
              onOpen={() => selectOrder(order.id)}
              onAction={() => advanceOrder(order.id)}
            />
          )}
        />
      )}
    </View>
  );

  if (isTablet) {
    return (
      <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
        <Header title="Live queue" subtitle={`${locationLabel} · ${counts.all} OPEN · ${brandCount} BRANDS`} />
        <View style={styles.splitRow}>
          <View style={styles.splitList}>{list}</View>
          <View style={styles.splitDetail}>
            {selected ? (
              <TicketDetail
                order={selected}
                brandName={brandName(selected.brand_id)}
                lines={lines.filter((l) => l.order_id === selected.id)}
                items={items}
                now={now}
                onToggleLine={toggleLineDone}
                onAction={() => advanceOrder(selected.id)}
              />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Select a ticket to see the detail.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      {selected ? (
        <>
          <Header title="Ticket" subtitle={`${locationLabel} · ${counts.all} OPEN · ${brandCount} BRANDS`} />
          <TicketDetail
            order={selected}
            brandName={brandName(selected.brand_id)}
            lines={lines.filter((l) => l.order_id === selected.id)}
            items={items}
            now={now}
            onToggleLine={toggleLineDone}
            onAction={() => advanceOrder(selected.id)}
            onBack={() => selectOrder(null)}
          />
        </>
      ) : (
        <>
          <Header title="Live queue" subtitle={`${locationLabel} · ${counts.all} OPEN · ${brandCount} BRANDS`} />
          <View style={styles.phonePad}>{list}</View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  phonePad: { flex: 1, paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  splitRow: { flex: 1, flexDirection: 'row' },
  splitList: { width: 380, borderRightWidth: 1, borderRightColor: kitchen.border, paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  splitDetail: { flex: 1 },
  insight: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: kitchen.insightBg, borderWidth: 1, borderColor: kitchen.insightBorder, marginBottom: 14 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: kitchen.accent, marginTop: 6 },
  insightTitle: { fontFamily: type.display, fontWeight: '700', fontSize: 13, color: kitchen.accent },
  insightBody: { fontFamily: type.display, fontWeight: '400', fontSize: 12.5, lineHeight: 18, color: '#D8CFC0' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: { flex: 1, height: 44, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  filterCount: { fontFamily: type.mono, fontWeight: '700', fontSize: 13 },
  filterLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, letterSpacing: 0.6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 44 },
  emptyText: { fontFamily: type.display, fontWeight: '500', fontSize: 14, color: kitchen.textFaint, textAlign: 'center' },
});
