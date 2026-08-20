import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SMARTCLOUDKITCHEN</Text>
      <Text style={styles.title}>Kitchen console</Text>
      <Text style={styles.sub}>Phase 0 scaffold — screens land in Phase 1.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kitchen.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  eyebrow: {
    fontFamily: type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: kitchen.textFaint,
  },
  title: {
    fontFamily: type.display,
    fontWeight: '800',
    fontSize: 28,
    color: kitchen.text,
  },
  sub: {
    fontFamily: type.display,
    fontSize: 13,
    color: kitchen.textSoft,
  },
});
