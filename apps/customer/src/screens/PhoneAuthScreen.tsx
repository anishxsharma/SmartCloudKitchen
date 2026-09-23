import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { customer, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useCustomerStore } from '../store/customerStore';

/** Bare 10-digit input is assumed local (India) and gets a +91 prefix; anything starting with + is used as-is. */
function toE164(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');
  return `+91${trimmed.replace(/\D/g, '')}`;
}

export function PhoneAuthScreen() {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  // Shown when a CTA is tapped with an invalid field — the placeholder
  // text below ("98765 43210") looks exactly like a real typed number, so
  // a silently-disabled button gave zero feedback when someone tapped
  // Send Code without having actually typed anything.
  const [validationHint, setValidationHint] = useState<string | null>(null);

  const {
    otpPhone,
    sendingOtp,
    verifyingOtp,
    authError,
    customer: signedInCustomer,
    sendOtp,
    verifyOtp,
    cancelPhoneAuth,
    placeOrder,
    signInWithGoogle,
    googleSigningIn,
    pendingGoogleProfile,
    finishGoogleSignup,
    finishingGoogleSignup,
  } = useCustomerStore(
    useShallow((s) => ({
      otpPhone: s.otpPhone,
      sendingOtp: s.sendingOtp,
      verifyingOtp: s.verifyingOtp,
      authError: s.authError,
      customer: s.customer,
      sendOtp: s.sendOtp,
      verifyOtp: s.verifyOtp,
      cancelPhoneAuth: s.cancelPhoneAuth,
      placeOrder: s.placeOrder,
      signInWithGoogle: s.signInWithGoogle,
      googleSigningIn: s.googleSigningIn,
      pendingGoogleProfile: s.pendingGoogleProfile,
      finishGoogleSignup: s.finishGoogleSignup,
      finishingGoogleSignup: s.finishingGoogleSignup,
    }))
  );

  // Verification just succeeded — this screen only exists to unblock
  // checkout, so finish the order that brought the customer here.
  useEffect(() => {
    if (!signedInCustomer) return;
    placeOrder().then(() => {
      // Pop back to the cart within the Bag tab's own stack either way —
      // otherwise the Bag tab is left stranded on this screen (same class
      // of bug as ItemScreen's blank-Menu issue: switching tabs doesn't
      // reset the tab's own internal navigation stack).
      navigation.goBack();
      if (useCustomerStore.getState().trackOrderId) {
        navigation.getParent()?.navigate('Orders');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInCustomer]);

  const busy = sendingOtp || verifyingOtp || googleSigningIn || finishingGoogleSignup;

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ gap: 6, marginBottom: 28, alignItems: 'center' }}>
        <Text style={styles.eyebrow}>ONE STEP LEFT</Text>
        <Text style={styles.title}>
          {pendingGoogleProfile ? 'Add a phone number' : otpPhone ? 'Enter the code' : 'Sign in to order'}
        </Text>
        <Text style={styles.subtitle}>
          {pendingGoogleProfile
            ? "You're signed in — we just need a number to reach you about this order."
            : otpPhone
              ? `We sent a code to ${otpPhone}`
              : "We'll text you a code to confirm your order and keep you posted on it."}
        </Text>
      </View>

      <View style={{ gap: 12, width: '100%' }}>
        {pendingGoogleProfile ? (
          <>
            <TextInput
              style={styles.input}
              value={googlePhone}
              onChangeText={(v) => { setGooglePhone(v); setValidationHint(null); }}
              placeholder="98765 43210"
              placeholderTextColor={customer.textFaint}
              keyboardType="phone-pad"
              autoFocus
              editable={!finishingGoogleSignup}
            />
            <Pressable
              disabled={finishingGoogleSignup}
              onPress={() => {
                if (googlePhone.trim().length < 6) { setValidationHint('Enter your phone number first.'); return; }
                setValidationHint(null);
                finishGoogleSignup(toE164(googlePhone));
              }}
              style={[styles.cta, (googlePhone.trim().length < 6 || finishingGoogleSignup) && { opacity: 0.5 }]}
            >
              {finishingGoogleSignup ? <ActivityIndicator color={customer.ctaFg} /> : <Text style={styles.ctaLabel}>Continue &amp; place order</Text>}
            </Pressable>
          </>
        ) : otpPhone ? (
          <>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(v) => { setCode(v); setValidationHint(null); }}
              placeholder="6-digit code"
              placeholderTextColor={customer.textFaint}
              keyboardType="number-pad"
              editable={!verifyingOtp}
            />
            <Pressable
              disabled={verifyingOtp}
              onPress={() => {
                if (code.trim().length === 0) { setValidationHint('Enter the code we texted you.'); return; }
                setValidationHint(null);
                verifyOtp(code.trim());
              }}
              style={[styles.cta, (code.trim().length === 0 || verifyingOtp) && { opacity: 0.5 }]}
            >
              {verifyingOtp ? <ActivityIndicator color={customer.ctaFg} /> : <Text style={styles.ctaLabel}>Verify &amp; place order</Text>}
            </Pressable>
            <Pressable onPress={() => { cancelPhoneAuth(); setValidationHint(null); }} hitSlop={12}>
              <Text style={styles.link}>Use a different number</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(v) => { setPhone(v); setValidationHint(null); }}
              placeholder="98765 43210"
              placeholderTextColor={customer.textFaint}
              keyboardType="phone-pad"
              autoFocus
              editable={!busy}
            />
            <Pressable
              disabled={busy}
              onPress={() => {
                if (phone.trim().length < 6) { setValidationHint('Enter your phone number first — the box above is just an example.'); return; }
                setValidationHint(null);
                sendOtp(toE164(phone));
              }}
              style={[styles.cta, (phone.trim().length < 6 || busy) && { opacity: 0.5 }]}
            >
              {sendingOtp ? <ActivityIndicator color={customer.ctaFg} /> : <Text style={styles.ctaLabel}>Send code</Text>}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable disabled={busy} onPress={() => { setValidationHint(null); signInWithGoogle(); }} style={[styles.googleBtn, busy && { opacity: 0.5 }]}>
              {googleSigningIn ? <ActivityIndicator color={customer.text} /> : <Text style={styles.googleLabel}>Continue with Google</Text>}
            </Pressable>
          </>
        )}
      </View>

      {validationHint ? <Text style={styles.hint}>{validationHint}</Text> : authError ? <Text style={styles.error}>{authError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: type.mono, fontWeight: '600', fontSize: 11, letterSpacing: 2.2, color: customer.textFaint },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: customer.text, textAlign: 'center' },
  subtitle: { fontFamily: type.display, fontWeight: '400', fontSize: 13, color: customer.textSoft, textAlign: 'center', paddingHorizontal: 12 },
  input: { minHeight: minTapTarget, borderRadius: 12, borderWidth: 1, borderColor: customer.border, backgroundColor: customer.surface, paddingHorizontal: 14, color: customer.text, fontFamily: type.display, fontSize: 15 },
  cta: { minHeight: minTapTarget, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: customer.ctaBg, marginTop: 4 },
  ctaLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 15, color: customer.ctaFg },
  link: { fontFamily: type.display, fontWeight: '600', fontSize: 12.5, color: customer.textSoft, textAlign: 'center', marginTop: 4 },
  error: { marginTop: 20, fontFamily: type.display, fontSize: 12, color: '#C0472A', textAlign: 'center' },
  hint: { marginTop: 20, fontFamily: type.display, fontSize: 12, color: customer.textSoft, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: customer.border },
  dividerLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1, color: customer.textFaint },
  googleBtn: { minHeight: minTapTarget, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: customer.surface, borderWidth: 1, borderColor: customer.border },
  googleLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 15, color: customer.text },
});
