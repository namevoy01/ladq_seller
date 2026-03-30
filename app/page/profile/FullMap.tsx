import GoogleMap from "@/components/GoogleMap";
import WebMap from "@/components/WebMap";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, SafeAreaView, StyleSheet, View } from "react-native";

// Define minimal Region type locally to avoid importing native module types
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function FullMap() {
  const params = useLocalSearchParams();

  const { lat, lng, zoom } = useMemo(() => {
    const latNum = typeof params.lat === "string" ? parseFloat(params.lat) : 0;
    const lngNum = typeof params.lng === "string" ? parseFloat(params.lng) : 0;
    const zoomNum = typeof params.zoom === "string" ? parseInt(params.zoom, 10) : 16;
    return { lat: isNaN(latNum) ? 0 : latNum, lng: isNaN(lngNum) ? 0 : lngNum, zoom: isNaN(zoomNum) ? 16 : zoomNum };
  }, [params]);

  const screenHeight = Dimensions.get("window").height;

  // interactive region + selected pin
  const [region, setRegion] = useState<Region>({
    latitude: lat || 13.7563,
    longitude: lng || 100.5018,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02 * 1.2,
  });
  const [selected, setSelected] = useState<{ latitude: number; longitude: number }>({
    latitude: region.latitude,
    longitude: region.longitude,
  });
  const [mapErrored, setMapErrored] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback to static map if native map never becomes ready (gray screen cases)
  useEffect(() => {
    if (mapErrored || mapReady) return;
    readyTimeoutRef.current = setTimeout(() => {
      if (!mapReady) setMapErrored(true);
    }, 1500);
    return () => {
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    };
  }, [mapReady, mapErrored]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ height: screenHeight, width: "100%", position: "relative" }}>
        {/* Always render static map as background so user sees map immediately */}
        <GoogleMap
          latitude={selected.latitude}
          longitude={selected.longitude}
          zoom={zoom}
          height={screenHeight}
        />

        {/* Overlay interactive web-based map (Leaflet + OSM) */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
          <WebMap latitude={selected.latitude} longitude={selected.longitude} zoom={zoom} height={"100%"} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
});

