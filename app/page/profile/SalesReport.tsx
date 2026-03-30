
import { GetSalesReport } from "@/service/store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function SalesReport() {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<7 | 15 | 30>(7);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const fetchReport = async (spanDays: 7 | 15 | 30) => {
    try {
      setLoading(true);
      setError(null);
      const end = new Date();
      // endDate ต้อง +1 วันเพื่อให้ครอบคลุมทั้งวันสุดท้าย
      const endPlusOne = new Date(end);
      endPlusOne.setDate(endPlusOne.getDate() + 1);
      const start = new Date();
      start.setDate(end.getDate() - (spanDays - 1));
      const startDate = formatDate(start);
      const endDate = formatDate(endPlusOne);
      const total = await GetSalesReport(startDate, endDate);
      setAmount(total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่สามารถดึงรายงานการขายได้");
      setAmount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(days);
  }, [days]);

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - (days - 1));
  const dateRangeLabel = `${formatDate(start)} ถึง ${formatDate(now)}`;

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
      <Text style={styles.pageSubtitle}>ช่วงเวลา: {dateRangeLabel}</Text>

      {/* ตัวเลือกช่วงเวลา */}
      <View style={styles.rangeRow}>
        {[7, 15, 30].map((d) => (
          <TouchableOpacity
            key={`range-${d}`}
            style={[
              styles.rangeButton,
              days === d && styles.rangeButtonActive,
            ]}
            onPress={() => setDays(d as 7 | 15 | 30)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.rangeText,
                days === d && styles.rangeTextActive,
              ]}
            >
              {d} วัน
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* สรุปภาพรวม */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#ecfdf3" }]}>
          <Text style={styles.summaryLabel}>ยอดขายรวม</Text>
          <Text style={styles.summaryValue}>
            {amount.toLocaleString("th-TH")} ฿
          </Text>
        </View>
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
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  rangeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  rangeButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  rangeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4b5563",
  },
  rangeTextActive: {
    color: "#1d4ed8",
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
