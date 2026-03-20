import React, { ReactNode } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";

const { height } = Dimensions.get("window");

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFF", // BG เต็มจอ
    paddingTop: height * 0.07,  // เว้นบน 5% แต่ BG ยังอยู่เต็ม
  },
  inner: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
});
