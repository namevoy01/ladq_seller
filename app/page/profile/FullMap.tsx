import WebMap from "@/components/WebMap";
import { useAuth } from "@/contexts/AuthContext";
import { GetPosLocation, PostPosLocation } from "@/service/store";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FullMap() {
  const TH_CENTER = { latitude: 13.7563, longitude: 100.5018 };
  const params = useLocalSearchParams();
  const { getBranchId } = useAuth();

  const { lat, lng, zoom } = useMemo(() => {
    const latNum = typeof params.lat === "string" ? parseFloat(params.lat) : 0;
    const lngNum = typeof params.lng === "string" ? parseFloat(params.lng) : 0;
    const zoomNum = typeof params.zoom === "string" ? parseInt(params.zoom, 10) : 16;
    return { lat: isNaN(latNum) ? 0 : latNum, lng: isNaN(lngNum) ? 0 : lngNum, zoom: isNaN(zoomNum) ? 16 : zoomNum };
  }, [params]);

  const [currentLocation, setCurrentLocation] = useState({
    latitude: lat || TH_CENTER.latitude,
    longitude: lng || TH_CENTER.longitude,
  });
  const [pickedLocation, setPickedLocation] = useState(currentLocation);

  useEffect(() => {
    const branchId = getBranchId();
    if (!branchId) return;
    (async () => {
      try {
        const res = await GetPosLocation(branchId);
        if (res && typeof res.Lat === "number" && typeof res.Lng === "number") {
          const next = { latitude: res.Lat, longitude: res.Lng };
          setCurrentLocation(next);
          setPickedLocation(next);
        }
      } catch {
        // ignore fetch errors
      }
    })();
  }, [getBranchId]);

  const handlePin = () => {
    const lat = Number(pickedLocation.latitude.toFixed(4));
    const lng = Number(pickedLocation.longitude.toFixed(4));

    console.log("PIN_LOCATION:", {
      latitude: lat,
      longitude: lng,
    });
    // เรียก API ตามสเปก: POST /api/v1/Location/Pos
    PostPosLocation({
      lat,
      lng,
      province: 1,
    })
      .then(() => {
        Alert.alert("สำเร็จ", "บันทึกตำแหน่งร้านเรียบร้อย");
      })
      .catch((err) => {
        Alert.alert("ผิดพลาด", err?.message || "บันทึกตำแหน่งไม่สำเร็จ");
      });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.mapArea}>
          <WebMap
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            zoom={zoom}
            height={"100%"}
            searchEnabled
            onLocationChange={(loc) =>
              setPickedLocation({ latitude: loc.latitude, longitude: loc.longitude })
            }
          />
        </View>
        <View style={styles.pinBar}>
          <TouchableOpacity style={styles.pinButton} activeOpacity={0.9} onPress={handlePin}>
            <Text style={styles.pinButtonText}>ปักหมุด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
    width: "100%",
  },
  pinBar: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  pinButton: {
    backgroundColor: "#C42127",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    elevation: 2,
  },
  pinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

