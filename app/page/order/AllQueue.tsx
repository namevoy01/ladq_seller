import { useText } from "@/app/_layout";
import { getAllQueueOrdersPagination } from "@/service/order";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  View,
  Text as RNText,
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
  fast_lane_price: number;
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

export default function AllQueue() {
  const Text = useText();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchOrders = async (offset: number = 0, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: ApiResponse = await getAllQueueOrdersPagination(offset, limit);
      setOrders(response.Orders);
      setTotalPages(response.TotalPage);
      setCurrentPage(offset);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      setError(message);
      console.error("Error fetching all queue orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrder = ({ item }: ListRenderItemInfo<Order>) => {
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const totalQty = item.order_item.reduce((sum, it) => sum + it.quantity, 0);
    const totalPrice = item.order_item.reduce(
      (sum, it) => sum + it.quantity * it.menu.menu_price,
      0
    );

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>บิล: {item.order_id.slice(0, 8)}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <RNText style={styles.orderTime}>{formatTime(item.created_at)}</RNText>
            <RNText style={styles.orderDate}>{formatDate(item.created_at)}</RNText>
          </View>
        </View>

        {item.order_item.map((oi) => (
          <View
            key={oi.order_item_id}
            style={styles.row}
          >
            <RNText style={[styles.cell, { flex: 2, textAlign: "left" }]}>
              {oi.menu.menu_name}
            </RNText>
            <RNText style={styles.cell}>{oi.quantity}</RNText>
            <RNText style={styles.cell}>{oi.menu.menu_price}</RNText>
          </View>
        ))}

        <View style={[styles.row, styles.footer]}>
          <RNText style={[styles.cell, { flex: 2, textAlign: "left" }]}>
            รวม
          </RNText>
          <RNText style={styles.cell}>{totalQty}</RNText>
          <RNText style={styles.cell}>{totalPrice}</RNText>
        </View>

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C42127" />
        <RNText style={styles.loadingText}>กำลังโหลดออเดอร์ทั้งหมด...</RNText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <RNText style={styles.errorText}>{error}</RNText>
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
          <View style={styles.center}>
            <RNText style={styles.emptyText}>ยังไม่มีออเดอร์ในคิวทั้งหมด</RNText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: { fontWeight: "bold", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: { backgroundColor: "#f0f0f0" },
  footer: { backgroundColor: "#f9fafb" },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  pickupContainer: {
    marginTop: 8,
    paddingVertical: 6,
  },
  pickupText: {
    textAlign: "center",
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  orderTime: { fontSize: 12, color: "#666" },
  orderDate: { fontSize: 11, color: "#999", marginTop: 2 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#C42127",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

