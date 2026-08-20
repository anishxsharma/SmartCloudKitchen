import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { STAFF } from '@smartcloudkitchen/mock-data';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useCurrentStaff, useSessionStore } from '../store/sessionStore';

const ROLE_LABEL: Record<string, string> = { line_cook: 'Line cook', kitchen_manager: 'Kitchen manager', owner: 'Owner' };

/**
 * Stands in for a shift PIN login — lets you demo role/location gating
 * without building real auth UI. Tap the chip, pick who's signed in.
 */
export function StaffSwitcher() {
  const staff = useCurrentStaff();
  const signIn = useSessionStore((s) => s.signIn);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.chip}>
        <Text style={styles.chipName}>{staff.display_name}</Text>
        <Text style={styles.chipRole}>{ROLE_LABEL[staff.role]}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>SWITCH STAFF</Text>
            {STAFF.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  signIn(s.id);
                  setOpen(false);
                }}
                style={[styles.row, { backgroundColor: s.id === staff.id ? '#2A2419' : 'transparent' }]}
              >
                <View style={{ gap: 2 }}>
                  <Text style={styles.rowName}>{s.display_name}</Text>
                  <Text style={styles.rowRole}>{ROLE_LABEL[s.role]}</Text>
                </View>
                {s.id === staff.id ? <Text style={styles.rowCheck}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, alignItems: 'flex-end' },
  chipName: { fontFamily: type.display, fontWeight: '600', fontSize: 12.5, color: kitchen.text },
  chipRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 9.5, color: kitchen.textFaint },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: kitchen.surfaceNav, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32, gap: 4 },
  sheetTitle: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1.4, color: kitchen.textFaint, paddingBottom: 8, paddingLeft: 4 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 12 },
  rowName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  rowRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  rowCheck: { color: kitchen.accent, fontWeight: '700', fontSize: 16 },
});
