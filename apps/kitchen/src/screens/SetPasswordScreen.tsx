import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useSessionStore } from '../store/sessionStore';

export function SetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const loading = useSessionStore((s) => s.loading);
  const error = useSessionStore((s) => s.error);
  const completePasswordSetup = useSessionStore((s) => s.completePasswordSetup);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && !loading;

  return (
    <View style={styles.wrap}>
      <View style={{ gap: 6, marginBottom: 32 }}>
        <Text style={styles.eyebrow}>WELCOME TO SMARTCLOUDKITCHEN</Text>
        <Text style={styles.title}>Set your password</Text>
      </View>

      <View style={{ gap: 12, width: '100%' }}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="New password (min 8 characters)"
          placeholderTextColor={kitchen.textFaint}
          autoCapitalize="none"
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          placeholderTextColor={kitchen.textFaint}
          autoCapitalize="none"
          secureTextEntry
          editable={!loading}
        />

        <Pressable
          disabled={!canSubmit}
          onPress={() => completePasswordSetup(password)}
          style={[styles.submitBtn, !canSubmit && { opacity: 0.5 }]}
        >
          {loading ? <ActivityIndicator color="#191510" /> : <Text style={styles.submitLabel}>Set password &amp; sign in</Text>}
        </Pressable>
      </View>

      {mismatch ? <Text style={styles.error}>Passwords don't match</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: kitchen.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  eyebrow: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 2.2, color: kitchen.accent, textAlign: 'center' },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: kitchen.text, textAlign: 'center' },
  input: { minHeight: minTapTarget, borderRadius: 12, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, paddingHorizontal: 14, color: kitchen.text, fontFamily: type.display, fontSize: 15 },
  submitBtn: { minHeight: minTapTarget, borderRadius: 14, backgroundColor: kitchen.accent, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 15, color: '#191510' },
  error: { marginTop: 20, fontFamily: type.display, fontSize: 12, color: kitchen.warn, textAlign: 'center' },
});
