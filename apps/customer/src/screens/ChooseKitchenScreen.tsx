import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';

/**
 * First screen a diner sees — shared marketplace app, so ordering starts
 * with picking which kitchen business/location to order from, rather
 * than a single location baked into the build. Persisted afterward (see
 * selectLocation/AsyncStorage in customerStore) so a returning customer
 * skips straight to the menu.
 */
export function ChooseKitchenScreen() {
  const { locations, locationsLoading, loadLocations, selectLocation } = useCustomerStore((s) => ({
    locations: s.locations,
    locationsLoading: s.locationsLoading,
    loadLocations: s.loadLocations,
    selectLocation: s.selectLocation,
  }));

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SMARTCLOUDKITCHEN</Text>
        <Text style={styles.title}>Where are you ordering from?</Text>
      </View>

      {locationsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={customer.text} />
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No kitchens available yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => selectLocation(item.id)} style={styles.card}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardArrow}>→</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, gap: 6 },
  eyebrow: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 2.2, color: customer.textFaint },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 24, color: customer.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    backgroundColor: customer.surface,
    borderWidth: 1,
    borderColor: customer.border,
  },
  cardName: { fontFamily: type.display, fontWeight: '600', fontSize: 16, color: customer.text },
  cardArrow: { fontFamily: type.display, fontSize: 18, color: customer.textFaint },
  empty: { padding: 44, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: customer.border, alignItems: 'center' },
  emptyText: { fontFamily: type.display, fontWeight: '500', fontSize: 14, color: '#9A9184' },
});
