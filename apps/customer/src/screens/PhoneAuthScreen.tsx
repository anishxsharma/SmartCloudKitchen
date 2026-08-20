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

  const { otpPhone, sendingOtp, verifyingOtp, authError, customer: signedInCustomer, sendOtp, verifyOtp, cancelPhoneAuth, placeOrder, trackOrderId } =
    useCustomerStore(
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
        trackOrderId: s.trackOrderId,
      }))
    );

  // Verification just succeeded — this screen only exists to unblock
  // checkout, so finish the order that brought the customer here.
  useEffect(() => {
    if (!signedInCustomer) return;
    placeOrder().then(() => {
      if (useCustomerStore.getState().trackOrderId) {
        navigation.getParent()?.navigate('Orders');
      } else {
        navigation.goBack();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInCustomer]);

  return (
    <View style={{ flex: 1, backgroundColor: customer.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ gap: 6, marginBottom: 28, alignItems: 'center' }}>
        <Text style={styles.eyebrow}>ONE STEP LEFT</Text>
        <Text style={styles.title}>{otpPhone ? 'Enter the code' : 'Verify your number'}</Text>
        <Text style={styles.subtitle}>
          {otpPhone ? `We sent a code to ${otpPhone}` : "We'll text you a code to confirm your order and keep you posted on it."}
        </Text>
      </View>

      <View style={{ gap: 12, width: '100%' }}>
        {otpPhone ? (
          <>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={customer.textFaint}
              keyboardType="number-pad"
              editable={!verifyingOtp}
            />
            <Pressable
              disabled={code.trim().length === 0 || verifyingOtp}
              onPress={() => verifyOtp(code.trim())}
              style={[styles.cta, (code.trim().length === 0 || verifyingOtp) && { opacity: 0.5 }]}
            >
              {verifyingOtp ? <ActivityIndicator color={customer.ctaFg} /> : <Text style={styles.ctaLabel}>Verify &amp; place order</Text>}
            </Pressable>
            <Pressable onPress={cancelPhoneAuth} hitSlop={12}>
              <Text style={styles.link}>Use a different number</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={customer.textFaint}
              keyboardType="phone-pad"
              autoFocus
              editable={!sendingOtp}
            />
            <Pressable
              disabled={phone.trim().length < 6 || sendingOtp}
              onPress={() => sendOtp(toE164(phone))}
              style={[styles.cta, (phone.trim().length < 6 || sendingOtp) && { opacity: 0.5 }]}
            >
              {sendingOtp ? <ActivityIndicator color={customer.ctaFg} /> : <Text style={styles.ctaLabel}>Send code</Text>}
            </Pressable>
          </>
        )}
      </View>

      {authError ? <Text style={styles.error}>{authError}</Text> : null}
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
});
