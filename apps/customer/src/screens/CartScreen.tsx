import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { money } from '@smartcloudkitchen/domain';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';
import { Header } from '../components/Header';

export function CartScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartInc, cartDec, placeOrder, placingOrder, error, signedInCustomer } = useCustomerStore(
    useShallow((s) => ({
      cart: s.cart,
      cartInc: s.cartInc,
      cartDec: s.cartDec,
      placeOrder: s.placeOrder,
      placingOrder: s.placingOrder,
      error: s.error,
      signedInCustomer: s.customer,
    }))
  );

  const sub = cart.reduce((a, c) => a + c.priceCents * c.qty, 0);
  const fee = cart.length ? 3900 : 0;
  const tax = Math.round(sub * 0.05);
  const total = sub + fee + tax;

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg }}>
      <Header title="Your bag" subtitle={`${cart.reduce((a, c) => a + c.qty, 0)} ITEM(S)`} />
      <FlatList
        data={cart}
        keyExtractor={(c) => c.menuItemId}
        contentContainerStyle={styles.wrap}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your bag is empty.</Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.meta}>{c.brandName} · {money(c.priceCents * c.qty)}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => cartDec(c.menuItemId)} style={styles.stepBtn}>
                <Text style={styles.stepLabel}>−</Text>
              </Pressable>
              <Text style={styles.stepQty}>{c.qty}</Text>
              <Pressable onPress={() => cartInc(c.menuItemId)} style={styles.stepBtn}>
                <Text style={styles.stepLabel}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          cart.length ? (
            <View style={{ gap: 14 }}>
              <View style={styles.bill}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal</Text>
                  <Text style={styles.billValue}>{money(sub)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery</Text>
                  <Text style={styles.billValue}>{money(fee)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Taxes</Text>
                  <Text style={styles.billValue}>{money(tax)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotalLabel}>Total</Text>
                  <Text style={styles.billTotalValue}>{money(total)}</Text>
                </View>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable
                disabled={placingOrder}
                onPress={async () => {
                  if (!signedInCustomer) {
                    navigation.navigate('PhoneAuth');
                    return;
                  }
                  await placeOrder();
                  if (useCustomerStore.getState().trackOrderId) navigation.getParent()?.navigate('Orders');
                }}
                style={[styles.cta, placingOrder && { opacity: 0.6 }]}
              >
                {placingOrder ? (
                  <ActivityIndicator color={customer.ctaFg} />
                ) : (
                  <Text style={styles.ctaLabel}>Place order · {money(total)}</Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  empty: { padding: 44, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: customer.border, alignItems: 'center' },
  emptyText: { fontFamily: type.display, fontWeight: '500', fontSize: 14, color: '#9A9184' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: customer.surface, borderWidth: 1, borderColor: customer.border, marginBottom: 12 },
  name: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: customer.text },
  meta: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: customer.textFaint },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, borderColor: customer.border, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 18, color: customer.text },
  stepQty: { fontFamily: type.mono, fontWeight: '600', fontSize: 15, minWidth: 16, textAlign: 'center', color: customer.text },
  bill: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: customer.surface, borderWidth: 1, borderColor: customer.border },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontFamily: type.display, fontWeight: '500', fontSize: 13, color: '#6E6559' },
  billValue: { fontFamily: type.mono, fontWeight: '500', fontSize: 13, color: '#6E6559' },
  divider: { height: 1, backgroundColor: '#EDE4D5', marginVertical: 4 },
  billTotalLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 17, color: customer.text },
  billTotalValue: { fontFamily: type.mono, fontWeight: '700', fontSize: 17, color: customer.text },
  errorText: { fontFamily: type.display, fontWeight: '500', fontSize: 12, color: '#C0472A', textAlign: 'center' },
  cta: { minHeight: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: customer.ctaBg },
  ctaLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 16, color: customer.ctaFg },
});
