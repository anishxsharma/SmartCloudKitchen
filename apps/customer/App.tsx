import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePushRegistration } from './src/hooks/usePushRegistration';
import { useOAuthPopupSelfClose } from './src/hooks/useOAuthPopupSelfClose';
import { useCustomerStore } from './src/store/customerStore';

export default function App() {
  const { expoPushToken } = usePushRegistration();
  const setPushToken = useCustomerStore((s) => s.setPushToken);
  useOAuthPopupSelfClose();

  useEffect(() => {
    if (expoPushToken) setPushToken(expoPushToken);
  }, [expoPushToken, setPushToken]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
