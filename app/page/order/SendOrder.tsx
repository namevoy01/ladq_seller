import { useText } from "@/app/_layout";
import { useAuth } from "@/contexts/AuthContext";
import { closeOrder, getCompleteOrdersPagination } from "@/service/order";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Modal,
    Text as RNText,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface Menu {
  menu_name: string;
  menu_price: number;
}

interface OrderItem {
  order_item_id: string;
  menu: Menu;
  quantity: number;
  order_item_option: any[];
}

interface Order {
  order_id: string;
  fast_lane_price: string;
  order_status: string;
  pickup_at: string;
  created_at: string;
  updated_at: string | null;
  order_item: OrderItem[];
}

interface ApiResponse {
  Orders: Order[];
  TotalPage: number;
}

export default function SendOrder() {
  const Text = useText();
  const { getUserId, getUserInfo } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [arriveModalVisible, setArriveModalVisible] = useState(false);
  const [arriveOrderId, setArriveOrderId] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async (offset: number = 0, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: ApiResponse = await getCompleteOrdersPagination(offset, limit);
      setOrders(response.Orders);
      setTotalPages(response.TotalPage);
      setCurrentPage(offset);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";

      // ถ้าเป็น 500 ให้แสดงเป็น empty state เฉย ๆ ไม่ต้องขึ้น error เต็มจอ
      if (message.includes("500")) {
        setOrders([]);
        setError(null);
        console.warn("Error fetching complete orders (500) - show empty list instead");
      } else {
        setError(message);
        console.error("Error fetching orders:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // WebSocket สำหรับแจ้ง Arrive ในหน้าออเดอร์รอส่ง
  useEffect(() => {
    const userId =
      getUserId?.() ||
      getUserInfo?.()?.id ||
      getUserInfo?.()?.userId ||
      null;
    if (!userId) {
      console.warn("SendOrder WS: missing user_id");
      return;
    }

    const base = "ws://36392702-688e-41b5-a3e0-c23bd85e0b29.cloud.ce.kmitl.ac.th";
    const urls = [
      `${base}/api/notification/ws?user_id=${encodeURIComponent(userId)}`,
      `${base}/ws?user_id=${encodeURIComponent(userId)}`,
    ];

    let ws: WebSocket | null = null;
    let connected = false;
    let closedByUnmount = false;

    const connectAt = (idx: number) => {
      if (idx >= urls.length) {
        console.warn("SendOrder WS: all endpoints failed");
        return;
      }
      const url = urls[idx];
      console.log("SendOrder WS connecting:", url);
      ws = new WebSocket(url);

      ws.onopen = () => {
        connected = true;
        console.log("SendOrder WS connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          console.log("SendOrder WS message:", data);
          const state = data?.State || data?.state;
          if (state === "Arrive" && data?.Message) {
            setArriveOrderId(String(data.Message));
            setArriveModalVisible(true);
          }
        } catch (e) {
          console.warn("SendOrder WS parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.warn("SendOrder WS error:", e);
      };

      ws.onclose = () => {
        console.log("SendOrder WS closed");
        if (!closedByUnmount && !connected) {
          connectAt(idx + 1);
        }
      };
    };

    connectAt(0);

    return () => {
      closedByUnmount = true;
      ws?.close();
    };
  }, [getUserId, getUserInfo]);

  const handleArriveComplete = async () => {
    if (!arriveOrderId) return;
    try {
      await closeOrder(arriveOrderId);
      await fetchOrders(currentPage);
      setArriveModalVisible(false);
      setArriveOrderId(null);
    } catch (e) {
      console.error("Close order from Arrive failed:", e);
      // ตั้งใจค้าง popup ต่อจนกว่าจะส่งสำเร็จ
    }
  };

  const handleSendOrder = useCallback(async (orderId: string) => {
    try {
      await closeOrder(orderId);
      // Refresh ข้อมูลหลังจากส่งออเดอร์สำเร็จ
      await fetchOrders();
      alert('ส่งออเดอร์เรียบร้อย!');
    } catch (error) {
      console.error('Error sending order:', error);
      alert('เกิดข้อผิดพลาดในการส่งออเดอร์');
    }
  }, [fetchOrders]);

  const renderOrder = ({ item }: ListRenderItemInfo<Order>) => {
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    return (
      <View style={styles.orderContainer}>
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RNText style={styles.orderTitle}>บิลเลขที่: {item.order_id.slice(0, 8)}</RNText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <RNText style={styles.orderTime}>{formatTime(item.created_at)}</RNText>
            <RNText style={styles.orderDate}>{formatDate(item.created_at)}</RNText>
          </View>
        </View>

        {/* Fast Lane Price */}
        {item.fast_lane_price && item.fast_lane_price !== "0" && (
          <View style={styles.fastLaneContainer}>
            <RNText style={styles.fastLaneText}>
              Fast Lane: +{item.fast_lane_price} บาท
            </RNText>
          </View>
        )}

        {/* Table Header */}
        <View style={[styles.row, styles.header]}>
          <RNText style={styles.cell}>รายการ</RNText>
          <RNText style={styles.cell}>จำนวน</RNText>
          <RNText style={styles.cell}>ราคา</RNText>
        </View>

        {/* Items */}
        {item.order_item.map((orderItem, i) => (
          <View style={styles.row} key={`${item.order_id}-item-${i}-${orderItem.order_item_id}`}>
            <RNText style={styles.cell}>{orderItem.menu.menu_name}</RNText>
            <RNText style={styles.cell}>{orderItem.quantity}</RNText>
            <RNText style={styles.cell}>{orderItem.menu.menu_price}</RNText>
          </View>
        ))}

        {/* Summary */}
        <View style={[styles.row, styles.footer]}>
          <RNText style={styles.cell}>รวม</RNText>
          <RNText style={styles.cell}>
            {item.order_item.reduce((sum, p) => sum + p.quantity, 0)}
          </RNText>
          <RNText style={styles.cell}>
            {item.order_item.reduce((sum, p) => sum + (p.quantity * p.menu.menu_price), 0)}
          </RNText>
        </View>

        {/* Pickup Time */}
        <View style={styles.pickupContainer}>
          <RNText style={styles.pickupText}>
            รับสินค้า: {formatDate(item.pickup_at)} {formatTime(item.pickup_at)}
          </RNText>
        </View>

      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E7D37" />
        <RNText style={styles.loadingText}>กำลังโหลดข้อมูล...</RNText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <RNText style={styles.errorText}>{error}</RNText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchOrders()}
        >
          <RNText style={styles.retryButtonText}>ลองใหม่</RNText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <RNText style={styles.emptyText}>ไม่มีออเดอร์รอส่ง</RNText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={arriveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.arriveBackdrop}>
          <View style={styles.arriveCard}>
            <RNText style={styles.arriveTitle}>ลูกค้ามาถึงแล้ว</RNText>
            <RNText style={styles.arriveText}>
              กรุณากดเสร็จสิ้นเพื่อยืนยันการส่งออเดอร์
            </RNText>
            <RNText style={styles.arriveOrderId}>
              Order: {arriveOrderId?.slice(0, 8)}
            </RNText>
            <TouchableOpacity
              style={styles.arriveDoneButton}
              onPress={handleArriveComplete}
              activeOpacity={0.9}
            >
              <RNText style={styles.arriveDoneText}>เสร็จสิ้น</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  orderContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderTitle: { fontWeight: "bold", fontSize: 16 },
  orderTime: { fontSize: 14, color: "#666" },
  orderDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  header: { backgroundColor: "#f0f0f0" },
  footer: { backgroundColor: "#ddd" },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  buttonRow: {},
  button: {},
  sendButton: {},
  buttonText: {},
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#C42127",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1E7D37",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  fastLaneContainer: {
    backgroundColor: "#FFE4B5",
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  fastLaneText: {
    color: "#DA8D10",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  pickupContainer: {
    backgroundColor: "#E8F5E8",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  pickupText: {
    color: "#1E7D37",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  arriveBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  arriveCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },
  arriveTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  arriveText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  arriveOrderId: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 14,
    textAlign: "center",
  },
  arriveDoneButton: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  arriveDoneText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
