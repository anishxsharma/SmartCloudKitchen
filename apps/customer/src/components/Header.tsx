import { StyleSheet, Text, View } from 'react-native';
import { customer, type } from '@smartcloudkitchen/design-tokens';

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: customer.border,
    backgroundColor: customer.bg,
    gap: 3,
  },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 19, color: customer.text },
  sub: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, letterSpacing: 0.4, color: customer.textFaint },
});
