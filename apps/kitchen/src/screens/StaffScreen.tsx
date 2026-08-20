import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchScopedStaff, inviteStaff } from '@smartcloudkitchen/api-client';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import type { Staff, StaffRole } from '@smartcloudkitchen/types';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useCurrentStaff } from '../store/sessionStore';

const ROLE_LABEL: Record<StaffRole, string> = { line_cook: 'Line cook', kitchen_manager: 'Kitchen manager', owner: 'Owner' };

export function StaffScreen() {
  const me = useCurrentStaff();
  const isOwner = me?.role === 'owner';

  const [team, setTeam] = useState<Staff[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<StaffRole>('line_cook');
  const [locationId, setLocationId] = useState<string | null>(isOwner ? null : (me?.location_id ?? null));
  const [inviting, setInviting] = useState(false);

  const invitableRoles: StaffRole[] = isOwner ? ['line_cook', 'kitchen_manager', 'owner'] : ['line_cook', 'kitchen_manager'];
  const orgLocations = isOwner ? LOCATIONS.filter((l) => l.org_id === me?.org_id) : [];

  const loadTeam = useCallback(async () => {
    setLoadingTeam(true);
    try {
      setTeam(await fetchScopedStaff());
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  async function submitInvite() {
    if (!email.trim() || !displayName.trim()) return Alert.alert('Name and email are required');
    if (role !== 'owner' && !locationId) return Alert.alert('Choose a location');

    setInviting(true);
    try {
      await inviteStaff({ email: email.trim(), displayName: displayName.trim(), role, locationId: role === 'owner' ? null : locationId });
      setEmail('');
      setDisplayName('');
      setRole('line_cook');
      Alert.alert('Invite sent', `${displayName.trim()} will get an email to set their password.`);
      await loadTeam();
    } catch (err) {
      Alert.alert('Could not send invite', err instanceof Error ? err.message : String(err));
    } finally {
      setInviting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: kitchen.bg }} contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Staff</Text>

      {loadingTeam ? (
        <ActivityIndicator color={kitchen.accent} />
      ) : (
        <View style={{ gap: 8 }}>
          {team.map((s) => (
            <View key={s.id} style={styles.row}>
              <Text style={styles.rowName}>{s.display_name}</Text>
              <Text style={styles.rowRole}>{ROLE_LABEL[s.role]}</Text>
            </View>
          ))}
          {team.length === 0 ? <Text style={styles.empty}>No team members yet.</Text> : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>Invite someone</Text>

      <Field label="Name">
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Full name" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="Email">
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={kitchen.textFaint}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Field>

      <Field label="Role">
        <View style={styles.chipRow}>
          {invitableRoles.map((r) => {
            const active = r === role;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.chip, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
              >
                <Text style={[styles.chipLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {role !== 'owner' && isOwner ? (
        <Field label="Location">
          <View style={styles.chipRow}>
            {orgLocations.map((l) => {
              const active = l.id === locationId;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => setLocationId(l.id)}
                  style={[styles.chip, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
                >
                  <Text style={[styles.chipLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{l.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      ) : null}

      <Pressable disabled={inviting} onPress={submitInvite} style={[styles.inviteBtn, inviting && { opacity: 0.6 }]}>
        {inviting ? <ActivityIndicator color="#191510" /> : <Text style={styles.inviteLabel}>Send invite</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: kitchen.text },
  sectionTitle: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 1, color: kitchen.textFaint, marginTop: 8 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderRadius: 12, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft },
  rowName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  rowRole: { fontFamily: type.mono, fontWeight: '500', fontSize: 11, color: kitchen.textFaint },
  empty: { fontFamily: type.display, fontSize: 13, color: kitchen.textFaint },
  fieldLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1, color: kitchen.textFaint },
  input: { minHeight: minTapTarget, borderRadius: 12, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, paddingHorizontal: 14, color: kitchen.text, fontFamily: type.display, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 12 },
  inviteBtn: { minHeight: 60, borderRadius: 16, backgroundColor: kitchen.accent, alignItems: 'center', justifyContent: 'center' },
  inviteLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 16, color: '#191510' },
});
