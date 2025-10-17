import Layout from "@/components/orther/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Image, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const { logout } = useAuth();
  const isNavigatingRef = useRef(false);

  const guardedPush = (path: Href) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(path);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 700);
  };

  const handleLogout = () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบหรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <Layout>
      {/* ส่วนบน: รูปโปรไฟล์ + ชื่อร้าน + เวลา + ปุ่มเปิด/ปิด */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://www.w3schools.com/w3images/avatar2.png" }}
          style={styles.profileImage}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.shopName}>ร้านก๋วยเตี๋ยวป้าแดง</Text>
          <Text style={styles.shopTime}>เวลาเปิด–ปิด: 09:00 - 20:00</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{isOpen ? "เปิดร้าน" : "ปิดร้าน"}</Text>
            <Switch value={isOpen} onValueChange={setIsOpen} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>ตั้งค่าโปรไฟล์</Text>

        <MenuItem
          icon={<MaterialIcons name="queue" size={22} color="#1f2937" />}
          label="ตั้งค่าการจัดการคิว"
          onPress={() => guardedPush("/page/profile/ManageQueue")} />

        <MenuItem
          icon={<MaterialIcons name="restaurant-menu" size={22} color="#1f2937" />}
          label="ตั้งค่าเมนูในร้าน"
          onPress={() => guardedPush("/page/profile/SettingMenu")} />

        <MenuItem
          icon={<MaterialIcons name="storefront" size={22} color="#1f2937" />}
          label="ข้อมูลร้านค้า / แก้ไขร้านค้า"
          onPress={() => guardedPush("/page/profile/InfoStore")} />
        <MenuItem
          icon={<MaterialIcons name="payment" size={22} color="#1f2937" />}
          label="ช่องทางการรับเงิน / แก้ไข"
          onPress={() => guardedPush("/page/profile/Payment")} />
        
        <MenuItem
          icon={<MaterialIcons name="logout" size={22} color="#dc2626" />}
          label="ออกจากระบบ"
          onPress={handleLogout} />
      </View>
    </Layout>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  shopTime: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconBox: {
    width: 28,
    alignItems: "center",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    color: "#1f2937",
    fontWeight: "600",
  },
});
