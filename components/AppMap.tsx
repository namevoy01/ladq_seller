import WebMap from "@/components/WebMap";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type AppMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
  onPress?: () => void;
};

export default function AppMap({
  latitude,
  longitude,
  zoom = 16,
  height = 220,
  onPress,
}: AppMapProps) {
  return (
    <View style={[styles.container, { height }]}>
      <WebMap latitude={latitude} longitude={longitude} zoom={zoom} height="100%" />
      {!!onPress && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
});


