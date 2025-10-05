import Layout from "@/components/orther/Layout";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

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

          {/* Switch พร้อมข้อความ */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{isOpen ? "เปิดร้าน" : "ปิดร้าน"}</Text>
            <Switch value={isOpen} onValueChange={setIsOpen} />
          </View>
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>ตั้งค่าโปรไฟล์</Text>

        <MenuItem
          icon={<MaterialIcons name="queue" size={22} color="#333" />}
          label="ตั้งค่าการจัดการคิว"
          onPress={() => router.push("/page/profile/ManageQueue")} />

        <MenuItem
          icon={<MaterialIcons name="restaurant-menu" size={22} color="#333" />}
          label="ตั้งค่าเมนูในร้าน"
          onPress={() => router.push("/page/profile/SettingMenu")} />

        <MenuItem
          icon={<MaterialIcons name="storefront" size={22} color="#333" />}
          label="ข้อมูลร้านค้า / แก้ไขร้านค้า"
        />
        <MenuItem
          icon={<MaterialIcons name="payment" size={22} color="#333" />}
          label="ช่องทางการรับเงิน / แก้ไข"
        />
      </View>
    </Layout>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#aaa" />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  shopTime: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8, // ช่องว่างระหว่างข้อความกับ switch
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconBox: {
    width: 28,
    alignItems: "center",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
});
