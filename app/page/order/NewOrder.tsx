import { useText } from "@/app/_layout";
import { getNewOrdersPagination } from "@/service/order";
import { useEffect, useState } from "react";
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
  waitEdit?: boolean; // ถ้า true จะข้ามแก้ไข
}

interface ApiResponse {
  Orders: Order[];
  TotalPage: number;
}

export default function NewOrder() {
  const Text = useText();
  const [orders, setOrders] = useState<Order[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch orders from API
  const fetchOrders = async (offset: number = 0, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: ApiResponse = await getNewOrdersPagination(offset, limit);
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

  const firstEditableIndex = orders?.findIndex((o) => !o.waitEdit) ?? -1;

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleDeleteItem = (index: number) => {
    if (!selectedOrder) return;
    const updatedItems = selectedOrder.order_item.filter((_, i) => i !== index);
    setSelectedOrder({ ...selectedOrder, order_item: updatedItems });
  };

  const handleSend = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.order_id === selectedOrder.order_id ? selectedOrder : o))
    );
    setModalVisible(false);
  };

  const handleCancel = () => setModalVisible(false);

  const renderOrder = ({ item, index }: ListRenderItemInfo<Order>) => {
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
            {item.waitEdit && (
              <View style={styles.badge}>
                <RNText style={styles.badgeText}>รอแก้ไข</RNText>
              </View>
            )}
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

        {/* Buttons สำหรับบิลแก้ไขได้ */}
        {index === firstEditableIndex && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]}>
              <RNText style={styles.buttonText}>รับ</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <RNText style={styles.buttonText}>แก้ไข</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]}>
              <RNText style={styles.buttonText}>ยกเลิก</RNText>
            </TouchableOpacity>
          </View>
        )}
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
            <RNText style={styles.emptyText}>ไม่มีคำสั่งซื้อใหม่</RNText>
          </View>
        }
      />

      {/* Modal แก้ไข */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <RNText style={styles.modalTitle}>
              แก้ไขบิล: {selectedOrder?.order_id.slice(0, 8)}
            </RNText>

            {selectedOrder?.order_item.map((orderItem, index) => (
              <View style={styles.row} key={`${selectedOrder.order_id}-modal-item-${index}-${orderItem.order_item_id}`}>
                <RNText style={styles.cell}>{orderItem.menu.menu_name}</RNText>
                <RNText style={styles.cell}>{orderItem.quantity}</RNText>
                <RNText style={styles.cell}>{orderItem.menu.menu_price}</RNText>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(index)}
                >
                  <RNText style={styles.buttonText}>ลบ</RNText>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.sendButton]}
                onPress={handleSend}
              >
                <RNText style={styles.buttonText}>ส่ง</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <RNText style={styles.buttonText}>ยกเลิก</RNText>
              </TouchableOpacity>
            </View>
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
    justifyContent: "space-around",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  acceptButton: { backgroundColor: "#1E7D37" },
  editButton: { backgroundColor: "#DA8D10" },
  cancelButton: { backgroundColor: "#C42127" },
  sendButton: { backgroundColor: "#1E7D37" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  deleteButton: {
    backgroundColor: "#C42127",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badge: {
    backgroundColor: "#DA8D10",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
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
  orderDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
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
