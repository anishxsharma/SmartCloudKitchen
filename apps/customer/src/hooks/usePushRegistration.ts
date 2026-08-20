import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and fetches this device's Expo push token — what
 * the notify-order-stage-change Edge Function pushes to once an order
 * moves past "new" and the customer has backgrounded the app.
 *
 * Only gets you the token; registering it against a customer_id happens
 * separately via api-client's registerPushToken, once real phone-OTP
 * auth exists to know who the signed-in customer actually is (there's no
 * fake customer_id to attach this to yet — see the Auth section of the
 * build plan). Push tokens also only resolve on a physical device / EAS
 * build, never a simulator.
 */
export function usePushRegistration() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!Device.isDevice) {
        setError('Push tokens only resolve on a physical device.');
        return;
      }

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') {
        setError('Notification permission was not granted.');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      if (!cancelled) setExpoPushToken(token.data);
    }

    register().catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return { expoPushToken, error };
}
