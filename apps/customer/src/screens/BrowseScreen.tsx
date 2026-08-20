import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { money } from '@smartcloudkitchen/domain';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';
import { Header } from '../components/Header';

export function BrowseScreen() {
  const navigation = useNavigation<any>();
  const { brands, items, loading, error, shopBrandId, setShopBrand, openItem, loadCatalog } = useCustomerStore();
  const brandItems = items.filter((i) => i.brand_id === shopBrandId);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg }}>
      <Header title={brands.find((b) => b.id === shopBrandId)?.name ?? 'Storefront'} subtitle="DELIVERS IN 25–35 MIN · HSR" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {brands.map((b) => {
          const active = b.id === shopBrandId;
          return (
            <Pressable
              key={b.id}
              onPress={() => setShopBrand(b.id)}
              style={[styles.tab, { backgroundColor: active ? customer.text : customer.surface, borderColor: active ? customer.text : customer.border }]}
            >
              <Text style={[styles.tabLabel, { color: active ? customer.bg : '#6E6559' }]}>{b.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.blurb}>
        Cooked to order in our HSR kitchen. Four kitchens, one bag — mix brands and it still arrives together.
      </Text>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={customer.text} />
        </View>
      ) : (
        <FlatList
          data={brandItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              disabled={!item.available}
              onPress={() => {
                openItem(item.id);
                navigation.navigate('Item');
              }}
              style={[styles.card, { opacity: item.available ? 1 : 0.45 }]}
            >
              <View style={styles.photo}>
                <Text style={styles.photoLabel}>food shot</Text>
              </View>
              <View style={{ flex: 1, gap: 5, paddingTop: 2 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{money(item.price_cents)}</Text>
                  <Text style={[styles.tag, { color: item.available ? '#7A7065' : '#C0472A' }]}>
                    {item.available ? `${item.prep_minutes} MIN` : 'SOLD OUT TODAY'}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  tab: { height: 44, paddingHorizontal: 15, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 13 },
  blurb: { fontFamily: type.display, fontWeight: '400', fontSize: 13, lineHeight: 19, color: customer.textSoft, paddingHorizontal: 16, paddingTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 44 },
  errorText: { fontFamily: type.display, fontWeight: '500', fontSize: 13, color: '#C0472A', textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', gap: 13, padding: 12, borderRadius: 16, backgroundColor: customer.surface, borderWidth: 1, borderColor: customer.border },
  photo: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#EFE7D8', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  photoLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 8, color: '#A09684' },
  name: { fontFamily: type.display, fontWeight: '600', fontSize: 16, color: customer.text },
  desc: { fontFamily: type.display, fontWeight: '400', fontSize: 12, lineHeight: 17, color: customer.textSoft },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  price: { fontFamily: type.mono, fontWeight: '600', fontSize: 15, color: customer.text },
  tag: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 0.4 },
});
