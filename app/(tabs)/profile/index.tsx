import GoogleMap from "@/components/GoogleMap";
import Layout from "@/components/orther/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CreateStore from "../../page/createstore/index";
import { GetPosInfo } from "@/service/store";

export default function ProfileScreen() {
  const [storeName, setStoreName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [branchType, setBranchType] = useState<string>("");
  const router = useRouter();
  const { logout, getMerchantId } = useAuth();
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

  const merchantId = getMerchantId?.();

  if (!merchantId || merchantId === "") {
    // Inline render create store UI when merchant is missing
    return <CreateStore />;
  }

  useEffect(() => {
    let isMounted = true;
    const loadPos = async () => {
      try {
        const pos = await GetPosInfo();
        if (!isMounted) return;
        setStoreName(pos?.Name || "");
        setPhone(pos?.Phone || "");
        setBranchType(pos?.BranchType || "");
      } catch {
        // keep default
      }
    };
    loadPos();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Layout>
      {/* ส่วนบน: รูปโปรไฟล์ + ชื่อร้าน + เวลา + ปุ่มเปิด/ปิด */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://www.w3schools.com/w3images/avatar2.png" }}
          style={styles.profileImage}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.shopName}>{storeName || "ชื่อร้าน"}</Text>
          <Text style={styles.shopTime}>
            ประเภทสาขา: {branchType || "-"}   เบอร์: {phone || "-"}
          </Text>
        </View>
      </View>

      {/* แผนที่ร้านค้า */}
      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>ตำแหน่งร้านบนแผนที่</Text>
        {/* TODO: ปรับ latitude / longitude เป็นค่าจริงจากข้อมูลร้าน เมื่อมี API */}
        <GoogleMap
          latitude={13.7563}
          longitude={100.5018}
          onPress={() => guardedPush(`/page/profile/FullMap?lat=${13.7563}&lng=${100.5018}&zoom=16`)}
        />
        <View style={styles.mapActions}>
          <TouchableOpacity
            style={styles.mapButton}
            activeOpacity={0.85}
            onPress={() => guardedPush("/page/profile/InfoStore")}
          >
            <MaterialIcons name="edit-location-alt" size={18} color="#2563eb" />
            <Text style={styles.mapButtonText}>ตั้งค่าแผนที่</Text>
          </TouchableOpacity>
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
          icon={<MaterialIcons name="insights" size={22} color="#1f2937" />}
          label="รายงานการขาย"
          onPress={() => guardedPush("/page/profile/SalesReport")} />
        
        <MenuItem
          icon={<MaterialIcons name="rate-review" size={22} color="#1f2937" />}
          label="review"
          onPress={() => guardedPush("/page/profile/Review")} />
        
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
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  mapCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    gap: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  mapActions: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    gap: 6,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
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
