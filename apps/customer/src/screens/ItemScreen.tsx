import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { money } from '@smartcloudkitchen/domain';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';

export function ItemScreen() {
  const navigation = useNavigation<any>();
  const { items, itemId, qty, incQty, decQty, addToCart } = useCustomerStore(
    useShallow((s) => ({
      items: s.items,
      itemId: s.itemId,
      qty: s.qty,
      incQty: s.incQty,
      decQty: s.decQty,
      addToCart: s.addToCart,
    }))
  );
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  return (
    <ScrollView style={{ backgroundColor: customer.bg }} contentContainerStyle={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={styles.back}>← MENU</Text>
      </Pressable>

      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.hero} />
      ) : (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>hero food shot 4:3</Text>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.meta}>{item.station} · ready in {item.prep_minutes} min</Text>
      </View>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <View style={styles.qtyControls}>
          <Pressable onPress={decQty} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnLabel}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{qty}</Text>
          <Pressable onPress={incQty} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnLabel}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => {
          addToCart();
          navigation.getParent()?.navigate('Bag');
        }}
        style={styles.cta}
      >
        <Text style={styles.ctaLabel}>Add {qty} to bag · {money(item.price_cents * qty)}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  back: { fontFamily: type.mono, fontWeight: '600', fontSize: 12, letterSpacing: 0.8, color: customer.textFaint },
  hero: { height: 190, borderRadius: 18, backgroundColor: '#EFE7D8', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  heroLabel: { fontFamily: type.mono, fontWeight: '500', fontSize: 10, color: '#A09684' },
  name: { fontFamily: type.display, fontWeight: '700', fontSize: 26, letterSpacing: -0.3, color: customer.text },
  desc: { fontFamily: type.display, fontWeight: '400', fontSize: 14, lineHeight: 21, color: customer.textSoft },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11.5, letterSpacing: 0.4, color: customer.textFaint },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: customer.surface, borderWidth: 1, borderColor: customer.border },
  qtyLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 14, color: customer.text },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: customer.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 20, color: customer.text },
  qtyValue: { fontFamily: type.mono, fontWeight: '600', fontSize: 18, minWidth: 22, textAlign: 'center', color: customer.text },
  cta: { minHeight: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: customer.ctaBg },
  ctaLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 16, color: customer.ctaFg },
});
