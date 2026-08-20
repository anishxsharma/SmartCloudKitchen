import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { canManageMenuAndStock, useCurrentStaff, useSessionStore, useVisibleLocationIds } from '../store/sessionStore';
import { useKitchenStore } from '../store/kitchenStore';
import { SignInScreen } from '../screens/SignInScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { MenuItemFormScreen } from '../screens/MenuItemFormScreen';
import { StockScreen } from '../screens/StockScreen';
import { SalesScreen } from '../screens/SalesScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();

function MenuStackNavigator() {
  return (
    <MenuStack.Navigator screenOptions={{ headerShown: false }}>
      <MenuStack.Screen name="MenuList" component={MenuScreen} />
      <MenuStack.Screen name="MenuItemForm" component={MenuItemFormScreen} />
    </MenuStack.Navigator>
  );
}

function TabBar({ state, navigation }: any) {
  const labels: Record<string, string> = { Queue: 'Queue', Menu: 'Menu', Stock: 'Stock', Sales: 'Sales' };
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
          >
            <View style={[styles.dot, { backgroundColor: focused ? kitchen.accent : 'transparent' }]} />
            <Text style={[styles.tabLabel, { color: focused ? kitchen.text : '#7E7568' }]}>{labels[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SignedInTabs() {
  // Line cooks work the queue; menu/stock/sales are manager+owner
  // decisions — mirrors the manager_update_menu_items / manager_update_stock
  // RLS policies, so the app's gating matches what the database would
  // reject anyway rather than inventing its own rule.
  const staff = useCurrentStaff();
  const canManage = canManageMenuAndStock(staff);
  const visibleLocationIds = useVisibleLocationIds();
  const loadForLocations = useKitchenStore((s) => s.loadForLocations);

  useEffect(() => {
    loadForLocations(visibleLocationIds);
    // Tear down the realtime subscriptions this call opens before the
    // effect fires again (React's dev-mode double-invoke included) —
    // loadForLocations also unsubscribes at its own start, but not
    // waiting for that here is what let two subscribe calls race in the
    // first place.
    return () => {
      useKitchenStore.getState().unsubscribe?.();
    };
  }, [visibleLocationIds.join(','), loadForLocations]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Queue" component={QueueScreen} />
      {canManage ? <Tab.Screen name="Menu" component={MenuStackNavigator} /> : null}
      {canManage ? <Tab.Screen name="Stock" component={StockScreen} /> : null}
      {canManage ? <Tab.Screen name="Sales" component={SalesScreen} /> : null}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const staff = useCurrentStaff();
  const bootstrapping = useSessionStore((s) => s.loading);
  const bootstrap = useSessionStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!staff) {
    if (bootstrapping) {
      return (
        <View style={{ flex: 1, backgroundColor: kitchen.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={kitchen.accent} />
        </View>
      );
    }
    return <SignInScreen />;
  }

  return <SignedInTabs />;
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: kitchen.border, backgroundColor: kitchen.surfaceNav },
  tabItem: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 24, height: 4, borderRadius: 99 },
  tabLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 11.5 },
});
