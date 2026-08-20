import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { customer, type } from '@smartcloudkitchen/design-tokens';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SMARTCLOUDKITCHEN</Text>
      <Text style={styles.title}>Storefront</Text>
      <Text style={styles.sub}>Phase 0 scaffold — screens land in Phase 1.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customer.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  eyebrow: {
    fontFamily: type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: customer.textFaint,
  },
  title: {
    fontFamily: type.display,
    fontWeight: '800',
    fontSize: 28,
    color: customer.text,
  },
  sub: {
    fontFamily: type.display,
    fontSize: 13,
    color: customer.textSoft,
  },
});
