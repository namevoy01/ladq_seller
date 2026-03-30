import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext } from 'react';
import { LogBox, Text as RNText, TextProps } from 'react-native';
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

// ปิด toast warning บางประเภทใน dev (เช่น Text strings must be rendered within a <Text> component)
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

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
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="page/profile/InfoStore" options={{ title: 'ข้อมูลร้านค้า' }} />
            <Stack.Screen name="page/profile/ManageQueue" options={{ title: 'ตั้งค่าการจัดการคิว' }} />
            <Stack.Screen name="page/profile/SettingMenu" options={{ title: 'ตั้งค่าเมนู' }} />
            <Stack.Screen name="page/profile/FullMap" options={{ title: 'แผนที่ร้าน' }} />
            <Stack.Screen name="page/profile/Payment" options={{ title: 'ช่องทางการรับเงิน' }} />
            <Stack.Screen name="page/profile/SalesReport" options={{ title: 'รายงานการขาย' }} />
            <Stack.Screen name="page/profile/Review" options={{ title: 'รีวิว' }} />
            <Stack.Screen name="page/order/NewOrder" options={{ title: 'ออเดอร์ใหม่' }} />
            <Stack.Screen name="page/order/SendOrder" options={{ title: 'ออเดอร์รอส่ง' }} />
            <Stack.Screen name="page/order/AllQueue" options={{ title: 'ออเดอร์ทั้งหมด' }} />
            <Stack.Screen name="page/createstore/index" options={{ title: 'สร้างร้านค้า' }} />
            <Stack.Screen name="page/createstore/claim" options={{ title: 'เคลมร้านค้า' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FontContext.Provider>
    </AuthProvider>
  );
}
