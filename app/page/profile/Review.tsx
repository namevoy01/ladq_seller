import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Review = {
  id: string;
  user: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
};

export default function ReviewScreen() {
  const mockReviews: Review[] = useMemo(
    () => [
      {
        id: "r1",
        user: "ลูกค้าท่านที่ 1",
        rating: 5,
        comment: "อร่อยมาก เส้นกำลังดี!",
        createdAt: "2026-03-20T10:00:00.000Z",
      },
      {
        id: "r2",
        user: "ลูกค้าท่านที่ 2",
        rating: 4,
        comment: "รสชาติดี บริการโอเค",
        createdAt: "2026-03-21T12:30:00.000Z",
      },
    ],
    []
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>review</Text>

      <View style={styles.list}>
        {mockReviews.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.user}>{r.user}</Text>
            <Text style={styles.rating}>ให้คะแนน: {r.rating}/5</Text>
            <Text style={styles.comment}>{r.comment}</Text>
            <Text style={styles.date}>
              {new Date(r.createdAt).toLocaleDateString("th-TH")}
            </Text>
          </View>
        ))}
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

