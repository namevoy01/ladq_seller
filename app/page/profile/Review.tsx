import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GetBranchReviews, BranchReview } from "@/service/store";
import { useAuth } from "@/contexts/AuthContext";

export default function ReviewScreen() {
  const { getBranchId } = useAuth();
  const [reviews, setReviews] = useState<BranchReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const branchId = getBranchId();
        if (!branchId) {
          setError("ไม่พบรหัสสาขา");
          setLoading(false);
          return;
        }
        const data = await GetBranchReviews(branchId);
        setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ไม่สามารถโหลดรีวิวได้");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getBranchId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>รีวิว</Text>

      {loading && (
        <View style={styles.card}>
          <Text>กำลังโหลดรีวิว...</Text>
        </View>
      )}
      {error && !loading && (
        <View style={styles.card}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      )}

      <View style={styles.list}>
        {!loading && !error && reviews.length === 0 && (
          <View style={styles.card}>
            <Text style={{ color: "#6b7280" }}>ยังไม่มีรีวิว</Text>
          </View>
        )}
        {reviews.map((r) => {
          const stars = "★★★★★☆☆☆☆☆".slice(5 - Math.min(5, Math.max(0, r.rating))), x=1;
          const date = new Date(r.created_at).toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
          });
          return (
            <View key={r.id} style={styles.card}>
              <Text style={styles.user}>ออเดอร์: {r.order_id.slice(0, 8)}</Text>
              <Text style={styles.rating}>ให้คะแนน: {r.rating}/5</Text>
              <Text style={styles.comment}>{r.comment || "-"}</Text>
              <Text style={styles.date}>{date}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  user: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
});

