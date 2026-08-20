import { StyleSheet, Text, View } from 'react-native';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { StaffSwitcher } from './StaffSwitcher';
import { LocationSwitcher } from './LocationSwitcher';

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={{ gap: 3, flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <StaffSwitcher />
      </View>
      <LocationSwitcher />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: kitchen.border,
    backgroundColor: kitchen.bg,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 19, color: kitchen.text },
  sub: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.6, color: kitchen.textSoft },
});
