import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

type GoogleMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
  onPress?: () => void;
};

export default function GoogleMap({
  latitude,
  longitude,
  zoom = 16,
  height = 220,
  onPress,
}: GoogleMapProps) {
  // ใช้ Google Static Maps API แสดงรูปแผนที่ (ง่ายและเสถียรบน Android)
  // ใส่คีย์แบบฮาร์ดโค้ดตามที่ร้องขอ
  const GOOGLE_STATIC_MAPS_KEY = "AIzaSyC_1kxfXVTaF9Oliw22dqm-IjQjWf3vBek";
  // เอาหมุด (markers) ออก โดยไม่ใส่พารามิเตอร์ markers ลงใน Static Maps URL
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=640x320&key=${GOOGLE_STATIC_MAPS_KEY}`;

  return (
    <View style={[styles.container, { height }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress} style={{ flex: 1 }}>
        <Image
          source={{ uri: url }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
});


