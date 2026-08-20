import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import { money } from '@smartcloudkitchen/domain';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useKitchenStore } from '../store/kitchenStore';
import { useVisibleLocationIds } from '../store/sessionStore';
import { Header } from '../components/Header';

export function MenuScreen() {
  const navigation = useNavigation<any>();
  const { brands: scopedBrands, items, menuBrandId, setMenuBrand, toggleItemAvailable } = useKitchenStore(
    useShallow((s) => ({
      brands: s.brands,
      items: s.items,
      menuBrandId: s.menuBrandId,
      setMenuBrand: s.setMenuBrand,
      toggleItemAvailable: s.toggleItemAvailable,
    }))
  );
  const visibleLocationIds = useVisibleLocationIds();

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

      <View style={styles.summaryRow}>
        <Text style={styles.summary}>{summary}</Text>
        <Pressable
          disabled={!menuBrandId}
          onPress={() => navigation.navigate('MenuItemForm', {})}
          style={[styles.addBtn, !menuBrandId && { opacity: 0.4 }]}
        >
          <Text style={styles.addBtnLabel}>+ Add dish</Text>
        </Pressable>
      </View>

      <FlatList
        data={brandItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const margin = Math.round((1 - item.cost_cents / item.price_cents) * 100);
          return (
            <View style={[styles.row, { borderColor: item.available ? kitchen.borderSoft : '#5B2E22' }]}>
              <Pressable
                onPress={() => navigation.navigate('MenuItemForm', { itemId: item.id })}
                style={styles.rowMain}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder} />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.name, { color: item.available ? kitchen.text : kitchen.textFaint }]}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {money(item.price_cents)} · {margin}% margin · {item.station}
                  </Text>
                </View>
              </Pressable>
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
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  summary: { flex: 1, fontFamily: type.display, fontWeight: '500', fontSize: 12, lineHeight: 17, color: kitchen.textFaint },
  addBtn: { height: 36, paddingHorizontal: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: kitchen.accent },
  addBtnLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 12, color: '#191510' },
  list: { padding: 16, gap: 8 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  thumbPlaceholder: { width: 44, height: 44, borderRadius: 10, backgroundColor: kitchen.borderSoft },
  name: { fontFamily: type.display, fontWeight: '600', fontSize: 15 },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.4, color: kitchen.textFaint },
  toggleTrack: { width: 64, height: 36, borderRadius: 99, borderWidth: 1, padding: 3, flexDirection: 'row' },
  toggleKnob: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0F2318' },
});
