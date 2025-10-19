import { useAuth } from "@/contexts/AuthContext";
import { sendOtp, verifyPhone } from "@/service/otp";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        console.log("Check auth - stored token:", token);
        
        // If session token exists, user is authenticated
        if (token && token.startsWith('session_')) {
          console.log("User already authenticated with session token");
          setIsNavigating(true);
          router.replace("/order");
          return;
        }
        
        if (token && !isNavigating) {
          // User is already authenticated, redirect to main app
          setIsNavigating(true);
          router.replace("/order");
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    
    checkAuth();
  }, [router, isNavigating]);

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If starts with 0, remove it and add +66
    if (digits.startsWith('0')) {
      return '+66' + digits.substring(1);
    }
    
    // If already starts with 66, add + prefix
    if (digits.startsWith('66')) {
      return '+' + digits;
    }
    
    // If doesn't start with 66, add +66 prefix
    return '+66' + digits;
  };

  // remove testing-only JWT creation fallback


  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert("กรุณากรอกเบอร์มือถือ");
      return;
    }

    // Format phone number to ensure +66 prefix
    const formattedPhone = formatPhoneNumber(phone);
    
    // Validate that it's a proper Thai phone number
    if (!formattedPhone.match(/^\+66[0-9]{9}$/)) {
      Alert.alert("รูปแบบเบอร์มือถือไม่ถูกต้อง", "กรุณากรอกเบอร์มือถือ 10 หลัก เช่น 0987654321");
      return;
    }

    try {
      setLoading(true);
      const data = await sendOtp(formattedPhone);
      console.log("OTP Response:", data);

      Alert.alert("สำเร็จ", "ส่ง OTP ไปที่ " + formattedPhone);
      setStep("otp");
    } catch (error: any) {
      console.error(error);
      Alert.alert("ผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("กรุณากรอก OTP 6 หลัก");
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = formatPhoneNumber(phone);
      const result = await verifyPhone(formattedPhone, otp);
      console.log("Verify Result:", result);
      console.log("JWT Token from result:", result.jwtToken);
      console.log("Cookies from result:", result.cookies);

      // Store the token from the response
      if (result.token) {
        await authLogin(result.token);
        Alert.alert("เข้าสู่ระบบสำเร็จ");
        setIsNavigating(true);
        // Small delay to ensure token is stored
        setTimeout(() => {
          router.replace("/order");
        }, 100);
      } else if (result.Message === "Success") {
        // API returns success - require JWT token from backend
        if (result.jwtToken) {
          console.log("Login successful - using JWT token from backend:", result.jwtToken);
          await authLogin(result.jwtToken);
        } else {
          Alert.alert("ผิดพลาด", "ไม่พบ token จากระบบ โปรดลองใหม่หรือติดต่อผู้ดูแล");
          return;
        }

        // Also store cookies if they exist
        if (result.cookies) {
          await AsyncStorage.setItem('auth_cookies', result.cookies);
        }
        
        Alert.alert("เข้าสู่ระบบสำเร็จ");
        setIsNavigating(true);
        // Small delay to ensure token is stored
        setTimeout(() => {
          router.replace("/order");
        }, 100);
      } else {
        Alert.alert("ผิดพลาด", "ไม่พบ token ใน response");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("ผิดพลาด", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isNavigating) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>กำลังเข้าสู่ระบบ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step === "phone" ? (
        <>
          <Text style={styles.title}>Login ด้วยเบอร์มือถือ</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกเบอร์มือถือ เช่น 0987654321"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Button title={loading ? "กำลังส่ง..." : "ส่ง OTP"} onPress={handleSendOtp} disabled={loading || isNavigating} />
        </>
      ) : (
        <>
          <Text style={styles.title}>กรอก OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="OTP 6 หลัก"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
          <Button title={loading ? "กำลังตรวจสอบ..." : "ยืนยัน"} onPress={handleVerifyOtp} disabled={loading || isNavigating} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 5,
  },
});
