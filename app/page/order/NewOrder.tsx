import { useText } from "@/app/_layout";
import { useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Product {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  items: Product[];
  waitEdit?: boolean; // ถ้า true จะข้ามแก้ไข
}

const initialData: Order[] = [
  {
    id: "001",
    items: [
      { name: "สินค้า A", qty: 2, price: 100 },
      { name: "สินค้า B", qty: 1, price: 50 },
    ],
    waitEdit: true,
  },
  {
    id: "002",
    items: [
      { name: "สินค้า C", qty: 5, price: 20 },
      { name: "สินค้า D", qty: 3, price: 200 },
      { name: "สินค้า E", qty: 1, price: 150 },
    ],
    waitEdit: true,
  },
  {
    id: "003",
    items: [
      { name: "สินค้า C", qty: 5, price: 20 },
      { name: "สินค้า D", qty: 3, price: 200 },
      { name: "สินค้า E", qty: 1, price: 150 },
    ],
  },
];

export default function NewOrder() {
  const Text = useText();
  const [orders, setOrders] = useState<Order[]>(initialData);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const firstEditableIndex = orders.findIndex((o) => !o.waitEdit);

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleDeleteItem = (index: number) => {
    if (!selectedOrder) return;
    const updatedItems = selectedOrder.items.filter((_, i) => i !== index);
    setSelectedOrder({ ...selectedOrder, items: updatedItems });
  };

  const handleSend = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? selectedOrder : o))
    );
    setModalVisible(false);
  };

  const handleCancel = () => setModalVisible(false);

  const renderOrder = ({ item, index }: ListRenderItemInfo<Order>) => (
    <View style={styles.orderContainer}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <RNText style={styles.orderTitle}>บิลเลขที่: {item.id}</RNText>
          {item.waitEdit && (
            <View style={styles.badge}>
              <RNText style={styles.badgeText}>รอแก้ไข</RNText>
            </View>
          )}
        </View>
        <RNText style={styles.orderTime}>16:00</RNText>
      </View>

      {/* Table Header */}
      <View style={[styles.row, styles.header]}>
        <RNText style={styles.cell}>รายการ</RNText>
        <RNText style={styles.cell}>จำนวน</RNText>
        <RNText style={styles.cell}>ราคา</RNText>
      </View>

      {/* Items */}
      {item.items.map((it, i) => (
        <View style={styles.row} key={i}>
          <RNText style={styles.cell}>{it.name}</RNText>
          <RNText style={styles.cell}>{it.qty}</RNText>
          <RNText style={styles.cell}>{it.price}</RNText>
        </View>
      ))}

      {/* Summary */}
      <View style={[styles.row, styles.footer]}>
        <RNText style={styles.cell}>รวม</RNText>
        <RNText style={styles.cell}>
          {item.items.reduce((sum, p) => sum + p.qty, 0)}
        </RNText>
        <RNText style={styles.cell}>
          {item.items.reduce((sum, p) => sum + p.qty * p.price, 0)}
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

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* Modal แก้ไข */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <RNText style={styles.modalTitle}>
              แก้ไขบิล: {selectedOrder?.id}
            </RNText>

            {selectedOrder?.items.map((item, index) => (
              <View style={styles.row} key={index}>
                <RNText style={styles.cell}>{item.name}</RNText>
                <RNText style={styles.cell}>{item.qty}</RNText>
                <RNText style={styles.cell}>{item.price}</RNText>
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
});
