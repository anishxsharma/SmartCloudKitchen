import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customer, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';
import { ChooseKitchenScreen } from '../screens/ChooseKitchenScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { ItemScreen } from '../screens/ItemScreen';
import { CartScreen } from '../screens/CartScreen';
import { PhoneAuthScreen } from '../screens/PhoneAuthScreen';
import { TrackScreen } from '../screens/TrackScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const BagStack = createNativeStackNavigator();

function MenuStackNavigator() {
  return (
    <MenuStack.Navigator screenOptions={{ headerShown: false }}>
      <MenuStack.Screen name="Browse" component={BrowseScreen} />
      <MenuStack.Screen name="Item" component={ItemScreen} />
    </MenuStack.Navigator>
  );
}

function BagStackNavigator() {
  return (
    <BagStack.Navigator screenOptions={{ headerShown: false }}>
      <BagStack.Screen name="CartHome" component={CartScreen} />
      <BagStack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
    </BagStack.Navigator>
  );
}

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const cartCount = useCustomerStore((s) => s.cart.reduce((a, c) => a + c.qty, 0));
  const labels: Record<string, string> = {
    Menu: 'Menu',
    Bag: cartCount ? `Bag · ${cartCount}` : 'Bag',
    Orders: 'Orders',
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        return (
          <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={styles.tabItem}>
            <View style={[styles.dot, { backgroundColor: focused ? customer.text : 'transparent' }]} />
            <Text style={[styles.tabLabel, { color: focused ? customer.text : '#9A9184' }]}>{labels[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppNavigator() {
  const bootstrapCustomer = useCustomerStore((s) => s.bootstrapCustomer);
  const bootstrapLocation = useCustomerStore((s) => s.bootstrapLocation);
  const locationBootstrapped = useCustomerStore((s) => s.locationBootstrapped);
  const selectedLocationId = useCustomerStore((s) => s.selectedLocationId);

  useEffect(() => {
    bootstrapCustomer();
    bootstrapLocation();
  }, [bootstrapCustomer, bootstrapLocation]);

  if (!locationBootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: customer.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={customer.text} />
      </View>
    );
  }

  if (!selectedLocationId) {
    return <ChooseKitchenScreen />;
  }

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Menu" component={MenuStackNavigator} />
      <Tab.Screen name="Bag" component={BagStackNavigator} />
      <Tab.Screen name="Orders" component={TrackScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: customer.border, backgroundColor: customer.surface },
  tabItem: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 24, height: 4, borderRadius: 99 },
  tabLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 11.5 },
});
