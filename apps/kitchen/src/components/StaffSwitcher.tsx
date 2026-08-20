import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useCurrentStaff, useSessionStore } from '../store/sessionStore';

const ROLE_LABEL: Record<string, string> = { line_cook: 'Line cook', kitchen_manager: 'Kitchen manager', owner: 'Owner' };

export function StaffSwitcher() {
  const staff = useCurrentStaff();
  const loading = useSessionStore((s) => s.loading);
  const signOut = useSessionStore((s) => s.signOut);

  function confirmSignOut() {
    if (!staff) return;
    Alert.alert('Sign out', `Sign out ${staff.display_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <Pressable onPress={confirmSignOut} style={styles.chip} disabled={!staff}>
      {loading ? (
        <ActivityIndicator size="small" color={kitchen.accent} />
      ) : staff ? (
        <>
          <Text style={styles.chipName}>{staff.display_name}</Text>
          <Text style={styles.chipRole}>{ROLE_LABEL[staff.role]}</Text>
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 32, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, alignItems: 'flex-end', justifyContent: 'center' },
  chipName: { fontFamily: type.display, fontWeight: '600', fontSize: 12.5, color: kitchen.text },
  chipRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 9.5, color: kitchen.textFaint },
});
