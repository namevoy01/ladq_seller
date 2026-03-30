import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type WebMapProps = {
	latitude: number;
	longitude: number;
	zoom?: number;
	height?: number | string;
	searchEnabled?: boolean;
	onLocationChange?: (location: { latitude: number; longitude: number; type?: string; name?: string }) => void;
};

export default function WebMap({
	latitude,
	longitude,
	zoom = 16,
	height = "100%",
	searchEnabled = false,
	onLocationChange,
}: WebMapProps) {
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
      .search-wrap {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        z-index: 9999;
        display: ${searchEnabled ? "block" : "none"};
      }
      .search-row { display: flex; gap: 8px; }
      .search-input {
        flex: 1;
        height: 40px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 0 12px;
        font-size: 14px;
        background: #fff;
      }
      .search-btn {
        height: 40px;
        padding: 0 14px;
        border: 0;
        border-radius: 10px;
        background: #2563eb;
        color: #fff;
        font-weight: 700;
      }
      .suggestions {
        margin-top: 6px;
        max-height: 220px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        display: none;
      }
      .suggestion-item {
        padding: 10px 12px;
        font-size: 13px;
        border-bottom: 1px solid #f3f4f6;
      }
      .suggestion-item:last-child { border-bottom: 0; }
      .suggestion-item:active { background: #eff6ff; }
    </style>
  </head>
  <body>
    <div class="search-wrap">
      <div class="search-row">
        <input id="searchInput" class="search-input" placeholder="ค้นหาสถานที่..." />
        <button id="searchBtn" class="search-btn">ค้นหา</button>
      </div>
      <div id="suggestions" class="suggestions"></div>
    </div>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${latitude};
      const lng = ${longitude};
      const zoom = ${zoom};
      const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], zoom);

      // ใช้ tile โทน Google Maps (road map) เพื่อหน้าตาคล้ายภาพตัวอย่าง
      // และมี fallback เป็น OSM ถ้า tile โหลดไม่ผ่าน
      const googleRoad = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data © Google'
      });

      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      });

      googleRoad.addTo(map);
      let hasFallback = false;
      googleRoad.on('tileerror', function () {
        if (hasFallback) return;
        hasFallback = true;
        map.removeLayer(googleRoad);
        osm.addTo(map);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tile_fallback', provider: 'osm' }));
        }
      });
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

      async function searchPlace() {
        const q = document.getElementById('searchInput').value.trim();
        if (!q) return;
        try {
          const endpoint = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
          const res = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
          });
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) return;
          const first = data[0];
          const latFound = parseFloat(first.lat);
          const lngFound = parseFloat(first.lon);
          if (!isFinite(latFound) || !isFinite(lngFound)) return;
          map.setView([latFound, lngFound], Math.max(zoom, 15));
          marker.setLatLng([latFound, lngFound]);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'search_result',
              latitude: latFound,
              longitude: lngFound,
              name: first.display_name || q
            }));
          }
        } catch (e) {
          // no-op
        }
      }

      function renderSuggestions(items) {
        const box = document.getElementById('suggestions');
        if (!box) return;
        if (!Array.isArray(items) || items.length === 0) {
          box.style.display = 'none';
          box.innerHTML = '';
          return;
        }
        box.innerHTML = items.map((item, idx) =>
          '<div class="suggestion-item" data-idx="' + idx + '">' +
          (item.display_name || '') +
          '</div>'
        ).join('');
        box.style.display = 'block';
      }

      async function searchSuggest(q) {
        if (!q || q.trim().length < 2) {
          renderSuggestions([]);
          return [];
        }
        try {
          const endpoint = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&q=' + encodeURIComponent(q);
          const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          renderSuggestions(list);
          return list;
        } catch {
          renderSuggestions([]);
          return [];
        }
      }

      const searchBtn = document.getElementById('searchBtn');
      const searchInput = document.getElementById('searchInput');
      const suggestionsBox = document.getElementById('suggestions');
      let suggestTimer = null;
      let currentSuggestions = [];

      if (searchBtn) searchBtn.addEventListener('click', searchPlace);
      if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') searchPlace();
        });
        searchInput.addEventListener('input', function (e) {
          const q = e.target.value || '';
          if (suggestTimer) clearTimeout(suggestTimer);
          suggestTimer = setTimeout(async function () {
            currentSuggestions = await searchSuggest(q);
          }, 250);
        });
      }

      if (suggestionsBox) {
        suggestionsBox.addEventListener('click', function (e) {
          const target = e.target.closest('.suggestion-item');
          if (!target) return;
          const idx = Number(target.getAttribute('data-idx'));
          const item = currentSuggestions[idx];
          if (!item) return;
          const latFound = parseFloat(item.lat);
          const lngFound = parseFloat(item.lon);
          if (!isFinite(latFound) || !isFinite(lngFound)) return;
          map.setView([latFound, lngFound], Math.max(zoom, 15));
          marker.setLatLng([latFound, lngFound]);
          if (searchInput) searchInput.value = item.display_name || '';
          renderSuggestions([]);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'search_result',
              latitude: latFound,
              longitude: lngFound,
              name: item.display_name || ''
            }));
          }
        });
      }
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
				onMessage={(event) => {
					try {
						const payload = JSON.parse(event.nativeEvent.data || "{}");
						if (
							payload &&
							typeof payload.latitude === "number" &&
							typeof payload.longitude === "number"
						) {
							onLocationChange?.({
								latitude: payload.latitude,
								longitude: payload.longitude,
								type: payload.type,
								name: payload.name,
							});
						}
					} catch {
						// ignore invalid messages from web content
					}
				}}
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

