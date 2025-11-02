import { useText } from "@/app/_layout";
import { closeOrder, getCompleteOrdersPagination } from "@/service/order";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

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
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

        {/* ปุ่มส่งออเดอร์ */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={() => handleSendOrder(item.order_id)}
          >
            <RNText style={styles.buttonText}>ส่งออเดอร์</RNText>
          </TouchableOpacity>
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  sendButton: { backgroundColor: "#1E7D37" },
  buttonText: { color: "#fff", fontWeight: "bold" },
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
});
