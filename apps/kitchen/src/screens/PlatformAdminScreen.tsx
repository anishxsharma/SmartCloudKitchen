import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { errorMessage, fetchOrganizations, onboardOrganization } from '@smartcloudkitchen/api-client';
import type { Organization } from '@smartcloudkitchen/types';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useSessionStore } from '../store/sessionStore';

/**
 * The only screen a platform_admin ever sees — they belong to no
 * org/location themselves, so none of the Queue/Menu/Stock/Sales/Staff
 * tabs (all org-scoped) apply. Onboards a brand-new, independent kitchen
 * business: creates its org + first location, and invites its owner —
 * see the onboard-organization Edge Function for the actual work.
 */
export function PlatformAdminScreen() {
  const signOut = useSessionStore((s) => s.signOut);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const [orgName, setOrgName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const [onboarding, setOnboarding] = useState(false);

  const loadOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      setOrgs(await fetchOrganizations());
    } catch (err) {
      Alert.alert('Could not load organizations', errorMessage(err));
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  async function submit() {
    if (!orgName.trim() || !locationName.trim() || !ownerEmail.trim() || !ownerDisplayName.trim()) {
      return Alert.alert('All fields are required');
    }
    setOnboarding(true);
    try {
      await onboardOrganization({
        orgName: orgName.trim(),
        locationName: locationName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerDisplayName: ownerDisplayName.trim(),
      });
      setOrgName('');
      setLocationName('');
      setOwnerEmail('');
      setOwnerDisplayName('');
      Alert.alert('Organization created', `${ownerDisplayName.trim()} will get an email to set up their owner account.`);
      await loadOrgs();
    } catch (err) {
      Alert.alert('Could not onboard organization', errorMessage(err));
    } finally {
      setOnboarding(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: kitchen.bg }} contentContainerStyle={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Platform admin</Text>
        <Pressable onPress={signOut} hitSlop={12}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Organizations</Text>
      {loadingOrgs ? (
        <ActivityIndicator color={kitchen.accent} />
      ) : (
        <View style={{ gap: 8 }}>
          {orgs.map((o) => (
            <View key={o.id} style={styles.row}>
              <Text style={styles.rowName}>{o.name}</Text>
            </View>
          ))}
          {orgs.length === 0 ? <Text style={styles.empty}>No organizations yet.</Text> : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>Onboard a new organization</Text>

      <Field label="Business name">
        <TextInput style={styles.input} value={orgName} onChangeText={setOrgName} placeholder="Acme Kitchens" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="First location name">
        <TextInput style={styles.input} value={locationName} onChangeText={setLocationName} placeholder="Acme Kitchens — Koramangala" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="Owner name">
        <TextInput style={styles.input} value={ownerDisplayName} onChangeText={setOwnerDisplayName} placeholder="Full name" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="Owner email">
        <TextInput
          style={styles.input}
          value={ownerEmail}
          onChangeText={setOwnerEmail}
          placeholder="owner@example.com"
          placeholderTextColor={kitchen.textFaint}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Field>

      <Pressable disabled={onboarding} onPress={submit} style={[styles.submitBtn, onboarding && { opacity: 0.6 }]}>
        {onboarding ? <ActivityIndicator color="#191510" /> : <Text style={styles.submitLabel}>Create organization</Text>}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: kitchen.text },
  signOut: { fontFamily: type.display, fontWeight: '600', fontSize: 13, color: kitchen.textSoft },
  sectionTitle: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 1, color: kitchen.textFaint, marginTop: 8 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft },
  rowName: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: kitchen.text },
  empty: { fontFamily: type.display, fontSize: 13, color: kitchen.textFaint },
  fieldLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1, color: kitchen.textFaint },
  input: { minHeight: minTapTarget, borderRadius: 12, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, paddingHorizontal: 14, color: kitchen.text, fontFamily: type.display, fontSize: 15 },
  submitBtn: { minHeight: 60, borderRadius: 16, backgroundColor: kitchen.accent, alignItems: 'center', justifyContent: 'center' },
  submitLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 16, color: '#191510' },
});
