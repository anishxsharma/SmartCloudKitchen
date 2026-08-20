import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { canManageMenuAndStock, useCurrentStaff } from '../store/sessionStore';
import { QueueScreen } from '../screens/QueueScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { StockScreen } from '../screens/StockScreen';
import { SalesScreen } from '../screens/SalesScreen';

const Tab = createBottomTabNavigator();

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

export function AppNavigator() {
  // Line cooks work the queue; menu/stock/sales are manager+owner
  // decisions — mirrors the manager_update_menu_items / manager_update_stock
  // RLS policies, so the app's gating matches what the database would
  // reject anyway rather than inventing its own rule.
  const staff = useCurrentStaff();
  const canManage = canManageMenuAndStock(staff);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Queue" component={QueueScreen} />
      {canManage ? <Tab.Screen name="Menu" component={MenuScreen} /> : null}
      {canManage ? <Tab.Screen name="Stock" component={StockScreen} /> : null}
      {canManage ? <Tab.Screen name="Sales" component={SalesScreen} /> : null}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: kitchen.border, backgroundColor: kitchen.surfaceNav },
  tabItem: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 24, height: 4, borderRadius: 99 },
  tabLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 11.5 },
});
