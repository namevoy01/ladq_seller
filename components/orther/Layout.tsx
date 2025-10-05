import React, { ReactNode } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { height } = Dimensions.get("window");

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>{children}</View>
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
    flex: 1,
    paddingHorizontal: 10,
  },
});
