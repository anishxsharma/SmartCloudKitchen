import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';

/**
 * Real device connectivity, not simulated — this is what a staff member
 * actually sees if the kitchen's wifi drops mid-service. Ticket taps
 * still apply locally either way (see kitchenStore); this is just making
 * the state visible rather than leaving it silent, since a stalled screen
 * with no explanation is the one failure mode staff can't work around.
 */
export function OfflineBanner() {
  const netInfo = useNetInfo();
  const offline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
  if (!offline) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dot} />
      <Text style={styles.label}>Offline — ticket taps still apply, syncing resumes on reconnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#3A1F16', borderBottomWidth: 1, borderBottomColor: '#5B2E22' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: kitchen.warn },
  label: { flex: 1, fontFamily: type.display, fontWeight: '600', fontSize: 12, color: '#FF9B7F' },
});
