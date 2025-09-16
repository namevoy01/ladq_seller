import { useText } from "@/app/_layout";
import {
    Alert,
    FlatList,
    ListRenderItemInfo,
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

  const renderOrder = ({ item, index }: ListRenderItemInfo<Order>) => (
    <View style={styles.orderContainer}>
      {/* Header บิล */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>บิลเลขที่: {item.id}</Text>
        <Text style={styles.orderTime}>16:00</Text>
      </View>

      {/* Table Header */}
      <View style={[styles.row, styles.header]}>
        <Text style={styles.cell}>รายการ</Text>
        <Text style={styles.cell}>จำนวน</Text>
        <Text style={styles.cell}>ราคา</Text>
      </View>

      {/* Table Rows */}
      {item.items.map((it, i) => (
        <View style={styles.row} key={i}>
          <Text style={styles.cell}>{it.name}</Text>
          <Text style={styles.cell}>{it.qty}</Text>
          <Text style={styles.cell}>{it.price}</Text>
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

      {/* แสดงปุ่มเฉพาะบิลแรก */}
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
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  orderTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  orderTime: {
    fontSize: 14,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 6,
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
