import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DEV_STAFF_CREDENTIALS, DEV_STAFF_PASSWORD } from '@smartcloudkitchen/mock-data';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useSessionStore } from '../store/sessionStore';

const ROLE_LABEL: Record<string, string> = { line_cook: 'Line cook', kitchen_manager: 'Kitchen manager', owner: 'Owner' };

export function SignInScreen() {
  const loading = useSessionStore((s) => s.loading);
  const error = useSessionStore((s) => s.error);
  const signIn = useSessionStore((s) => s.signIn);

  return (
    <View style={styles.wrap}>
      <View style={{ gap: 6, marginBottom: 32 }}>
        <Text style={styles.eyebrow}>SMARTCLOUDKITCHEN</Text>
        <Text style={styles.title}>Sign in for this shift</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={kitchen.accent} />
      ) : (
        <View style={{ gap: 10, width: '100%' }}>
          {DEV_STAFF_CREDENTIALS.map((s) => (
            <Pressable key={s.email} onPress={() => signIn(s.email, DEV_STAFF_PASSWORD)} style={styles.row}>
              <Text style={styles.rowName}>{s.display_name}</Text>
              <Text style={styles.rowRole}>{ROLE_LABEL[s.role]}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: kitchen.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  eyebrow: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 2.2, color: kitchen.accent, textAlign: 'center' },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: kitchen.text, textAlign: 'center' },
  row: { minHeight: minTapTarget, borderRadius: 14, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, alignItems: 'center', justifyContent: 'center', gap: 3 },
  rowName: { fontFamily: type.display, fontWeight: '600', fontSize: 16, color: kitchen.text },
  rowRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  error: { marginTop: 20, fontFamily: type.display, fontSize: 12, color: kitchen.warn, textAlign: 'center' },
});
