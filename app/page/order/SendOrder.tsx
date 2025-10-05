import { useText } from "@/app/_layout";
import { Alert, FlatList, ListRenderItemInfo, Text as RNText, StyleSheet, TouchableOpacity, View } from "react-native";

interface Product {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  items: Product[];
}

const data: Order[] = [
  {
    id: "001",
    items: [
      { name: "สินค้า A", qty: 2, price: 100 },
      { name: "สินค้า B", qty: 1, price: 50 },
    ],
  },
  {
    id: "002",
    items: [
      { name: "สินค้า C", qty: 5, price: 20 },
      { name: "สินค้า D", qty: 3, price: 200 },
      { name: "สินค้า E", qty: 1, price: 150 },
    ],
  },
];

export default function SendOrder() {
  const Text = useText();

  const handleSendOrder = (orderId: string) => {
    Alert.alert("ส่งออเดอร์", `ส่งออเดอร์บิลเลขที่ ${orderId} เรียบร้อยแล้ว`);
    // TODO: เรียก API ส่งออเดอร์ที่นี่
  };

  const renderOrder = ({ item }: ListRenderItemInfo<Order>) => (
    <View style={styles.orderContainer}>
      {/* Header บิล */}
      <View style={styles.orderHeader}>
        <RNText style={styles.orderTitle}>บิลเลขที่: {item.id}</RNText>
        <RNText style={styles.orderTime}>16:00</RNText>
      </View>

      {/* Table Header */}
      <View style={[styles.row, styles.header]}>
        <RNText style={styles.cell}>รายการ</RNText>
        <RNText style={styles.cell}>จำนวน</RNText>
        <RNText style={styles.cell}>ราคา</RNText>
      </View>

      {/* Table Rows */}
      {item.items.map((it, i) => (
        <View style={styles.row} key={i}>
          <RNText style={styles.cell}>{it.name}</RNText>
          <RNText style={styles.cell}>{it.qty}</RNText>
          <RNText style={styles.cell}>{it.price}</RNText>
        </View>
      ))}

      {/* รวมยอดต่อบิล */}
      <View style={[styles.row, styles.footer]}>
        <RNText style={styles.cell}>รวม</RNText>
        <RNText style={styles.cell}>
          {item.items.reduce((sum, p) => sum + p.qty, 0)}
        </RNText>
        <RNText style={styles.cell}>
          {item.items.reduce((sum, p) => sum + p.qty * p.price, 0)}
        </RNText>
      </View>

      {/* ปุ่มส่งออเดอร์ */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={() => handleSendOrder(item.id)}
        >
          <RNText style={styles.buttonText}>ส่งออเดอร์</RNText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList<Order>
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  orderContainer: {
    margin: 10,
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
  orderTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  orderTime: {
    fontSize: 14,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#f0f0f0",
  },
  footer: {
    backgroundColor: "#ddd",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
  },
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
  sendButton: {
    backgroundColor: "#1E7D37",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
