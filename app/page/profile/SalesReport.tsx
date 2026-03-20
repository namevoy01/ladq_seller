
import { getCompleteOrdersPagination } from "@/service/order";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
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

interface BestSellerRow {
  name: string;
  quantity: number;
  revenue: number;
}

export default function SalesReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompleteOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: ApiResponse = await getCompleteOrdersPagination(0, 100);
        setOrders(res?.Orders ?? []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "ไม่สามารถดึงข้อมูลรายงานการขายได้"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteOrders();
  }, []);

  const {
    totalRevenue,
    totalOrders,
    totalItems,
    bestSellers,
  } = useMemo(() => {
    let revenue = 0;
    let orderCount = orders.length;
    let itemCount = 0;

    const map = new Map<string, { quantity: number; revenue: number }>();

    for (const order of orders) {
      const fastLane = parseInt(order.fast_lane_price || "0", 10) || 0;
      let orderTotal = 0;

      for (const item of order.order_item || []) {
        const qty = item.quantity || 0;
        const price = item.menu?.menu_price || 0;
        const name = item.menu?.menu_name || "ไม่ทราบชื่อเมนู";

        const lineTotal = qty * price;
        orderTotal += lineTotal;
        itemCount += qty;

        const current = map.get(name) || { quantity: 0, revenue: 0 };
        current.quantity += qty;
        current.revenue += lineTotal;
        map.set(name, current);
      }

      revenue += orderTotal + fastLane;
    }

    const best: BestSellerRow[] = Array.from(map.entries())
      .map(([name, val]) => ({
        name,
        quantity: val.quantity,
        revenue: val.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalRevenue: revenue,
      totalOrders: orderCount,
      totalItems: itemCount,
      bestSellers: best,
    };
  }, [orders]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ marginTop: 8, color: "#4b5563" }}>
          กำลังโหลดรายงานการขาย...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: "#b91c1c", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>รายงานการขาย</Text>
      <Text style={styles.pageSubtitle}>
        สรุปยอดขายและเมนูขายดีจากออเดอร์ที่สำเร็จแล้ว
      </Text>

      {/* สรุปภาพรวม */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#ecfdf3" }]}>
          <Text style={styles.summaryLabel}>ยอดขายรวม</Text>
          <Text style={styles.summaryValue}>
            {totalRevenue.toLocaleString("th-TH")} ฿
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#e0f2fe" }]}>
          <Text style={styles.summaryLabel}>จำนวนออเดอร์</Text>
          <Text style={styles.summaryValue}>
            {totalOrders.toLocaleString("th-TH")} บิล
          </Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: "#fefce8" }]}>
        <Text style={styles.summaryLabel}>จำนวนเมนูที่ขายออก</Text>
        <Text style={styles.summaryValue}>
          {totalItems.toLocaleString("th-TH")} รายการ
        </Text>
      </View>

      {/* รายการขายดี */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>เมนูขายดี</Text>
        {bestSellers.length === 0 ? (
          <Text style={styles.emptyText}>
            ยังไม่มีข้อมูลเมนูขายดีจากออเดอร์ที่สำเร็จ
          </Text>
        ) : (
          <FlatList
            data={bestSellers}
            keyExtractor={(item) => item.name}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: "#e5e7eb" }} />
            )}
            renderItem={({ item, index }) => (
              <View style={styles.bestRow}>
                <View style={styles.bestLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.bestName}>{item.name}</Text>
                </View>
                <View style={styles.bestRight}>
                  <Text style={styles.bestQty}>
                    {item.quantity.toLocaleString("th-TH")} จาน
                  </Text>
                  <Text style={styles.bestRevenue}>
                    {item.revenue.toLocaleString("th-TH")} ฿
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* สรุปเพิ่มเติม */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>สรุป</Text>
        <Text style={styles.noteText}>
          - ข้อมูลนี้ดึงจากออเดอร์สถานะสำเร็จ (Complete){`\n`}
          - ยอดขายรวมรวมทั้งราคาสินค้าและค่าบริการ Fast Lane (ถ้ามี){`\n`}
          - คุณสามารถใช้ข้อมูลนี้เพื่อตัดสินใจเรื่องเมนูขายดีและวางแผนการขายต่อไป
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f4f7",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f4f7",
    padding: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    color: "#6b7280",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  sectionCard: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    paddingVertical: 8,
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  bestLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  bestName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  bestRight: {
    alignItems: "flex-end",
    minWidth: 90,
  },
  bestQty: {
    fontSize: 13,
    color: "#4b5563",
  },
  bestRevenue: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  noteCard: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 14,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3730a3",
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: "#4f46e5",
    lineHeight: 18,
  },
});
