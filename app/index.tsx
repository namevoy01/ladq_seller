import { sendOtp, verifyPhone } from "@/service/otp";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert("กรุณากรอกเบอร์มือถือ");
      router.push("/order");

      return;
    }

    try {
      setLoading(true);
      const data = await sendOtp(phone);
      console.log("OTP Response:", data);

      Alert.alert("สำเร็จ", "ส่ง OTP ไปที่ " + phone);
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
      const result = await verifyPhone(phone, otp);
      console.log("Verify Result:", result);

      Alert.alert("เข้าสู่ระบบสำเร็จ");
      router.push("/order");
    } catch (error: any) {
      console.error(error);
      Alert.alert("ผิดพลาด", error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === "phone" ? (
        <>
          <Text style={styles.title}>Login ด้วยเบอร์มือถือ</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกเบอร์มือถือ เช่น +66943341222"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Button title={loading ? "กำลังส่ง..." : "ส่ง OTP"} onPress={handleSendOtp} disabled={loading} />
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
          <Button title={loading ? "กำลังตรวจสอบ..." : "ยืนยัน"} onPress={handleVerifyOtp} disabled={loading} />
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
