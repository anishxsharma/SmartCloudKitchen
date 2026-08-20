import { useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BRANDS, LOCATIONS } from '@smartcloudkitchen/mock-data';
import { money } from '@smartcloudkitchen/domain';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useKitchenStore } from '../store/kitchenStore';
import { useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';

export function MenuScreen() {
  const { items, menuBrandId, setMenuBrand, toggleItemAvailable } = useKitchenStore();
  const visibleLocationIds = useVisibleLocationIds();

  const scopedBrands = BRANDS.filter((b) => visibleLocationIds.includes(b.location_id));
  const locationLabel =
    visibleLocationIds.length === 1
      ? (LOCATIONS.find((l) => l.id === visibleLocationIds[0])?.name.toUpperCase() ?? '')
      : 'ALL LOCATIONS';

  // Owner switched locations (or a manager's brand fell out of scope) —
  // fall back to the first brand this screen can actually show.
  useEffect(() => {
    if (scopedBrands.length && !scopedBrands.some((b) => b.id === menuBrandId)) {
      setMenuBrand(scopedBrands[0].id);
    }
  }, [scopedBrands, menuBrandId, setMenuBrand]);

  const brandItems = items.filter((i) => i.brand_id === menuBrandId);
  const outCount = brandItems.filter((i) => !i.available).length;
  const summary = outCount
    ? `${outCount} item(s) 86'd — hidden from every channel right now.`
    : 'Everything on this brand is live across all channels.';

  return (
    <View style={{ flex: 1, backgroundColor: kitchen.bg }}>
      <Header title="Menu & 86s" subtitle={`${locationLabel} · ${scopedBrands.length} BRANDS`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {scopedBrands.map((b) => {
          const active = b.id === menuBrandId;
          return (
            <Pressable
              key={b.id}
              onPress={() => setMenuBrand(b.id)}
              style={[styles.tab, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
            >
              <Text style={[styles.tabLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{b.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.summary}>{summary}</Text>

      <FlatList
        data={brandItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const margin = Math.round((1 - item.cost_cents / item.price_cents) * 100);
          return (
            <View style={[styles.row, { borderColor: item.available ? kitchen.borderSoft : '#5B2E22' }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.name, { color: item.available ? kitchen.text : kitchen.textFaint }]}>{item.name}</Text>
                <Text style={styles.meta}>
                  {money(item.price_cents)} · {margin}% margin · {item.station}
                </Text>
              </View>
              <Pressable
                onPress={() => toggleItemAvailable(item.id)}
                style={[
                  styles.toggleTrack,
                  { backgroundColor: item.available ? kitchen.good : '#2A251E', borderColor: item.available ? kitchen.good : '#4A4238', justifyContent: item.available ? 'flex-end' : 'flex-start' },
                ]}
              >
                <View style={styles.toggleKnob} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  tab: { height: 44, paddingHorizontal: 15, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 13 },
  summary: { fontFamily: type.display, fontWeight: '500', fontSize: 12, lineHeight: 17, color: kitchen.textFaint, paddingHorizontal: 16, paddingTop: 14 },
  list: { padding: 16, gap: 8 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1 },
  name: { fontFamily: type.display, fontWeight: '600', fontSize: 15 },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.4, color: kitchen.textFaint },
  toggleTrack: { width: 64, height: 36, borderRadius: 99, borderWidth: 1, padding: 3, flexDirection: 'row' },
  toggleKnob: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0F2318' },
});
