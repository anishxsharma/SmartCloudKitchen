import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DEV_STAFF_CREDENTIALS, DEV_STAFF_PASSWORD } from '@smartcloudkitchen/mock-data';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useCurrentStaff, useSessionStore } from '../store/sessionStore';

const ROLE_LABEL: Record<string, string> = { line_cook: 'Line cook', kitchen_manager: 'Kitchen manager', owner: 'Owner' };

/**
 * Real Supabase Auth underneath (see api-client's signInStaff) — this is
 * the dev-only bridge that picks from the seeded staff accounts instead
 * of a PIN pad, so role/location gating stays demoable without building
 * real auth UI yet.
 */
export function StaffSwitcher() {
  const staff = useCurrentStaff();
  const loading = useSessionStore((s) => s.loading);
  const signIn = useSessionStore((s) => s.signIn);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.chip}>
        {loading ? (
          <ActivityIndicator size="small" color={kitchen.accent} />
        ) : staff ? (
          <>
            <Text style={styles.chipName}>{staff.display_name}</Text>
            <Text style={styles.chipRole}>{ROLE_LABEL[staff.role]}</Text>
          </>
        ) : (
          <Text style={styles.chipName}>Sign in</Text>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>SIGN IN AS</Text>
            {DEV_STAFF_CREDENTIALS.map((s) => (
              <Pressable
                key={s.email}
                onPress={() => {
                  signIn(s.email, DEV_STAFF_PASSWORD);
                  setOpen(false);
                }}
                style={[styles.row, { backgroundColor: s.display_name === staff?.display_name ? '#2A2419' : 'transparent' }]}
              >
                <View style={{ gap: 2 }}>
                  <Text style={styles.rowName}>{s.display_name}</Text>
                  <Text style={styles.rowRole}>{ROLE_LABEL[s.role]}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 32, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, alignItems: 'flex-end', justifyContent: 'center' },
  chipName: { fontFamily: type.display, fontWeight: '600', fontSize: 12.5, color: kitchen.text },
  chipRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 9.5, color: kitchen.textFaint },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: kitchen.surfaceNav, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32, gap: 4 },
  sheetTitle: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1.4, color: kitchen.textFaint, paddingBottom: 8, paddingLeft: 4 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 12 },
  rowName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  rowRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
});
