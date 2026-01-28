import React from "react";
import { Image, StyleSheet, View } from "react-native";

type GoogleMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
};

export default function GoogleMap({
  latitude,
  longitude,
  zoom = 16,
  height = 220,
}: GoogleMapProps) {
  // ใช้ Google Static Maps API แสดงรูปแผนที่ (ง่ายและเสถียรบน Android)
  const GOOGLE_STATIC_MAPS_KEY = "AIzaSyC_1kxfXVTaF9Oliw22dqm-IjQjWf3vBek";
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=640x320&markers=color:red|${latitude},${longitude}&key=${GOOGLE_STATIC_MAPS_KEY}`;

  return (
    <View style={[styles.container, { height }]}>
      <Image
        source={{ uri: url }}
        style={styles.mapImage}
        resizeMode="cover"
      />
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


