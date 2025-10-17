import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext } from 'react';
import { Text as RNText, TextProps } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// 1️⃣ Context สำหรับ Text component
const FontContext = createContext<React.FC<TextProps> | null>(null);

// 2️⃣ CustomText component
const CustomText: React.FC<TextProps> = ({ style, ...props }) => {
  return <RNText {...props} style={[{ fontFamily: 'Kanit' }, style]} />;
};

// 3️⃣ Hook สำหรับดึง Text
export const useText = (): React.FC<TextProps> => {
  const context = useContext(FontContext);
  if (!context) throw new Error('useText must be used within FontProvider');
  return context;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    Kanit: require('../assets/fonts/Kanit-Regular.ttf'),
    KanitBold: require('../assets/fonts/Kanit-Bold.ttf'),
    KanitBlack: require('../assets/fonts/Kanit-Black.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <FontContext.Provider value={CustomText}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FontContext.Provider>
    </AuthProvider>
  );
}
