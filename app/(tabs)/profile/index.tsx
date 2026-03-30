import AppMap from "@/components/AppMap";
import Layout from "@/components/orther/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { GetPosInfo, GetPosLocation, PostPosLocation } from "@/service/store";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import CreateStore from "../../page/createstore/index";

export default function ProfileScreen() {
  const TH_CENTER = { latitude: 13.7563, longitude: 100.5018 };
  const [storeName, setStoreName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [branchType, setBranchType] = useState<string>("");
  const [mapCenter, setMapCenter] = useState(TH_CENTER);
  const router = useRouter();
  const { logout, getMerchantId, getBranchId } = useAuth();
  const isNavigatingRef = useRef(false);
  const [gpsFollow, setGpsFollow] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);
  const TH_BOUNDS = { minLat: 5.6, maxLat: 20.5, minLng: 97.3, maxLng: 105.7 };
  const isInThailand = (lat: number, lng: number) =>
    lat >= TH_BOUNDS.minLat && lat <= TH_BOUNDS.maxLat && lng >= TH_BOUNDS.minLng && lng <= TH_BOUNDS.maxLng;

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

  useEffect(() => {
    let active = true;
    const id = getBranchId?.();
    if (!id) return;
    (async () => {
      try {
        const res = await GetPosLocation(id);
        if (!active) return;
        if (res && typeof res.Lat === "number" && typeof res.Lng === "number") {
          setMapCenter({ latitude: res.Lat, longitude: res.Lng });
        }
      } catch {
        // ignore load errors for small map
      }
    })();
    return () => {
      active = false;
    };
  }, [getBranchId]);

  const handleToggleGps = async (next: boolean) => {
    try {
      setGpsFollow(next);
      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('ต้องเปิดสิทธิ์ตำแหน่ง', 'กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อใช้งานติดตาม GPS');
          setGpsFollow(false);
          return;
        }
        // ใช้ last known เป็นค่าเริ่ม (เร็ว) แล้วตามด้วยตำแหน่งปัจจุบันแบบแม่นยำสูง
        // ใช้ last known เฉพาะถ้าอยู่ในไทยเท่านั้น
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last?.coords) {
            const lat = Number((last.coords.latitude ?? 0).toFixed(6));
            const lng = Number((last.coords.longitude ?? 0).toFixed(6));
            if (isInThailand(lat, lng)) {
              setGpsCoords({ latitude: lat, longitude: lng });
            }
          }
        } catch {}
        try {
          const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          const lat = Number((now.coords.latitude ?? 0).toFixed(6));
          const lng = Number((now.coords.longitude ?? 0).toFixed(6));
          if (isInThailand(lat, lng)) {
            setGpsCoords({ latitude: lat, longitude: lng });
            // ส่งขึ้นเซิร์ฟเวอร์ด้วยความละเอียด 4 ตำแหน่ง
            try {
              await PostPosLocation({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)), province: 1 });
            } catch {}
          }
        } catch {}
        // ติดตามต่อเนื่องแบบความแม่นยำสูง
        watchSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, distanceInterval: 5, timeInterval: 2000 },
          async (loc) => {
            const lat6 = Number((loc.coords.latitude ?? 0).toFixed(6));
            const lng6 = Number((loc.coords.longitude ?? 0).toFixed(6));
            if (!isInThailand(lat6, lng6)) return;
            setGpsCoords({ latitude: lat6, longitude: lng6 });
            try {
              await PostPosLocation({ lat: Number(lat6.toFixed(4)), lng: Number(lng6.toFixed(4)), province: 1 });
            } catch {
              // silent
            }
          }
        );
      } else {
        if (watchSubRef.current) {
          watchSubRef.current.remove();
          watchSubRef.current = null;
        }
      }
    } catch {
      setGpsFollow(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchSubRef.current) {
        watchSubRef.current.remove();
        watchSubRef.current = null;
      }
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
        {branchType?.toLowerCase() === 'mobile' ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                ติดตามตำแหน่ง GPS อัตโนมัติ
              </Text>
              <Switch
                value={gpsFollow}
                onValueChange={handleToggleGps}
                trackColor={{ false: "#d1d5db", true: "#C42127" }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
            </View>
            <View style={{ paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>
                {gpsFollow
                  ? gpsCoords
                    ? `กำลังติดตาม • ${gpsCoords.latitude.toFixed(6)}, ${gpsCoords.longitude.toFixed(6)}`
                    : 'กำลังติดตาม • กำลังอ่านตำแหน่ง...'
                  : 'ปิดการติดตาม GPS'}
              </Text>
            </View>
          </View>
        ) : (
          <AppMap
            latitude={mapCenter.latitude}
            longitude={mapCenter.longitude}
            onPress={() =>
              guardedPush(
                `/page/profile/FullMap?lat=${mapCenter.latitude}&lng=${mapCenter.longitude}&zoom=16`
              )
            }
          />
        )}
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
