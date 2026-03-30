import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type WebMapProps = {
	latitude: number;
	longitude: number;
	zoom?: number;
	height?: number | string;
};

export default function WebMap({ latitude, longitude, zoom = 16, height = "100%" }: WebMapProps) {
	const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .leaflet-container { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${latitude};
      const lng = ${longitude};
      const zoom = ${zoom};
      const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', function (e) {
        const p = marker.getLatLng();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dragend', latitude: p.lat, longitude: p.lng }));
        }
      });
      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'click', latitude: e.latlng.lat, longitude: e.latlng.lng }));
        }
      });
    </script>
  </body>
</html>
`;

	return (
		<View style={[styles.container, { height }]}>
			<WebView
				originWhitelist={["*"]}
				source={{ html }}
				style={styles.webview}
				setSupportMultipleWindows={false}
				allowsInlineMediaPlayback
				javaScriptEnabled
				domStorageEnabled
				mixedContentMode="always"
				scrollEnabled={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		overflow: "hidden",
		backgroundColor: "#e5e7eb",
		borderRadius: Platform.OS === "android" ? 0 : 0,
	},
	webview: {
		width: "100%",
		height: "100%",
		backgroundColor: "transparent",
	},
});

