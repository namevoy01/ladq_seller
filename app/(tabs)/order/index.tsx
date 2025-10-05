import { useText } from '@/app/_layout';
import NewOrder from '@/app/page/order/NewOrder';
import SendOrder from '@/app/page/order/SendOrder';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import SlideButton from '../../../components/order/SlideButton';

type Order = {
  id: string;
  customer: string;
  items: { name: string; qty: number; price: number }[];
  status: 'pending' | 'in-progress' | 'done';
};

const mockOrders: Order[] = [
  {
    id: 'V001',
    customer: 'คุณเอ',
    items: [
      { name: 'กาแฟเย็น', qty: 2, price: 50 },
      { name: 'เค้กช็อคโกแลต', qty: 1, price: 70 },
      { name: 'ชาเขียว', qty: 3, price: 60 },
      { name: 'มัฟฟิน', qty: 2, price: 40 },
      { name: 'สโคน', qty: 1, price: 35 },
    ],
    status: 'pending',
  },
];

const { height } = Dimensions.get('window');

export default function OrderScreen() {
  const [selected, setSelected] = useState(0);
  const buttons = ["ออเดอร์", "ออเดอร์รอส่ง", "ออเดอร์ใหม่"];
  const TextComponent = useText(); // ใช้ custom Text
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  // ปิด hardware back button ของ Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // แปลง status เป็นข้อความ
  const statusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'รอรับออเดอร์';
      case 'in-progress': return 'กำลังทำ';
      case 'done': return 'เสร็จสิ้น';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.card}>
        <Text style={styles.id}>{item.id}</Text>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 3, textAlign: 'left', paddingLeft: 20 }]}>รายการ</Text>
          <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>จำนวน</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>ราคา</Text>
        </View>

        {/* Items */}
        <ScrollView style={{ maxHeight: height * 0.43 }}>
          {item.items.map((it, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.customer, { flex: 3, textAlign: 'left', paddingLeft: 20 }]}>{it.name}</Text>
              <Text style={[styles.items, { flex: 2, textAlign: 'center' }]}>{it.qty}</Text>
              <Text style={[styles.price, { flex: 1, textAlign: 'center' }]}>{it.price}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Status */}
        <Text style={[styles.status, { paddingLeft: 20 }]}>
          รายละเอียดเพิ่มเติม : {statusText(item.status)}
        </Text>
      </View>

      {/* Cancel button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => alert(`ยกเลิกออเดอร์ ${item.id}`)}
      >
        <Text style={styles.cancelText}>ยกเลิก</Text>
      </TouchableOpacity>

      {/* Slide button */}
      <SlideButton
        height={60}
        onSlideComplete={() => alert(`ยืนยันออเดอร์ ${item.id} เรียบร้อย!`)}
      />

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryDone}>ออเดอร์ที่สำเร็จแล้ว: 30</Text>
          <Text style={styles.summaryPending}>ออเดอร์ที่เหลือ: 10</Text>
        </View>
        <Text style={styles.summaryTotal}>ออเดอร์ทั้งหมด: 40</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top buttons */}
      <View style={styles.buttonRow}>
        {buttons.map((label, index) => {
          const isActive = selected === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelected(index)}
              style={[
                styles.button,
                isActive
                  ? { backgroundColor: '#C42127' }
                  : { backgroundColor: 'rgba(153, 172, 195, 0.1)', borderColor: '#99ACC3', borderWidth: 1 },
                index === 1 && { marginStart: 5, marginEnd: 5 }
              ]}
            >
              <Text style={[styles.text, { color: isActive ? '#fff' : '#000' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {selected === 0 && (
        <View>
          {/* Switch row */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{isSwitchOn ? 'เปิดรับออเดอร์อัตโนมัติ' : 'ปิดรับออเดอร์อัตโนมัติ'}</Text>
            <Switch
              value={isSwitchOn}
              onValueChange={setIsSwitchOn}
              trackColor={{ false: "#d1d5db", true: "#C42127" }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }], marginStart: 8 }}
            />
          </View>

          {/* Orders list */}
          <FlatList
            data={mockOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrder}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}

      {selected === 1 && <SendOrder />}
      {selected === 2 && <NewOrder />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    paddingBottom: 10,
    height: height * 0.43,
  },
  id: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.24)',
    paddingVertical: 10,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: "#F9FBFF",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.24)',
  },
  headerText: { fontSize: 16 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customer: { fontSize: 16, color: '#374151', fontWeight: '600' },
  items: { fontSize: 16, color: '#374151' },
  price: { fontSize: 16, color: '#374151' },
  status: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#C42127',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelText: { color: '#F9FBFF', fontSize: 16, fontWeight: 'bold' },
  summaryContainer: { paddingTop: 6, paddingHorizontal: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryDone: { fontSize: 14, fontWeight: '600', color: '#16a34a', flex: 1 },
  summaryPending: { fontSize: 14, fontWeight: '600', color: '#dc2626', textAlign: 'right', flex: 1 },
  summaryTotal: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'left' },
});
