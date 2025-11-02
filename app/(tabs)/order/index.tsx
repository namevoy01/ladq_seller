import { useText } from '@/app/_layout';
import NewOrder from '@/app/page/order/NewOrder';
import SendOrder from '@/app/page/order/SendOrder';
import { completeOrder, getCookOrders } from '@/service/order';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

// Types for API response
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

interface ApiOrder {
  order_id: string;
  fast_lane_price: string;
  order_status: string;
  pickup_at: string;
  created_at: string;
  updated_at: string | null;
  order_item: OrderItem[];
}

interface ApiResponse {
  order?: ApiOrder;
  orders?: ApiOrder[];
  Orders?: ApiOrder[];
}

// UI Order type
type Order = {
  id: string;
  orderId: string; // order_id จริงจาก API สำหรับส่งกลับไป
  customer: string;
  items: { name: string; qty: number; price: number }[];
  status: 'pending' | 'in-progress' | 'done';
};

const { height } = Dimensions.get('window');

export default function OrderScreen() {
  const [selected, setSelected] = useState(0);
  const buttons = ["ออเดอร์", "ออเดอร์รอส่ง", "ออเดอร์ใหม่"];
  const TextComponent = useText(); // ใช้ custom Text
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // แปลงข้อมูลจาก API เป็น format ของ UI
  const transformApiOrderToUiOrder = useCallback((apiOrder: ApiOrder): Order => {
    return {
      id: apiOrder.order_id.slice(0, 8), // ใช้ 8 ตัวแรกของ order_id สำหรับแสดง
      orderId: apiOrder.order_id, // เก็บ order_id จริงไว้สำหรับส่ง API
      customer: '', // API ไม่มี customer field
      items: apiOrder.order_item.map(item => ({
        name: item.menu.menu_name,
        qty: item.quantity,
        price: item.menu.menu_price,
      })),
      status: apiOrder.order_status === 'cook' ? 'in-progress' : 'pending',
    };
  }, []);

  // ดึงข้อมูลจาก API
  const fetchCookOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await getCookOrders();
      
      let apiOrders: ApiOrder[] = [];
      
      // จัดการกับ response format ที่แตกต่างกัน
      // กรณี 1: { order: {...} }
      if (response?.order && !Array.isArray(response.order)) {
        apiOrders = [response.order];
      }
      // กรณี 2: { orders: [...] } หรือ { Orders: [...] }
      else if (response?.orders && Array.isArray(response.orders)) {
        apiOrders = response.orders;
      } else if (response?.Orders && Array.isArray(response.Orders)) {
        apiOrders = response.Orders;
      }
      // กรณี 3: Array โดยตรง [{ order: {...} }, ...] หรือ [ApiOrder, ...]
      else if (Array.isArray(response)) {
        apiOrders = response.map((item: any) => {
          // ถ้า item มี order property ให้ใช้ order
          if (item?.order) {
            return item.order;
          }
          // ถ้า item เป็น ApiOrder โดยตรง
          return item;
        }).filter((item: any) => item && item.order_id); // กรองเฉพาะที่มี order_id
      }
      // กรณี 4: { order: [...] } (array ใน order property)
      else if (Array.isArray(response?.order)) {
        apiOrders = response.order;
      }
      
      // แปลงข้อมูลเป็น format ของ UI
      const transformedOrders = apiOrders.map(transformApiOrderToUiOrder);
      setOrders(transformedOrders);
    } catch (err) {
      // ถ้าเป็น error 500 หรือไม่มีข้อมูล ให้แสดง empty state แทน error
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      
      // ถ้า error message มี "500" หรือ "no data" ให้แสดง empty state
      if (errorMessage.includes('500') || errorMessage.includes('No data')) {
        setOrders([]);
        setError(null);
      } else {
        setError(errorMessage);
      }
      console.error('Error fetching cook orders:', err);
    } finally {
      setLoading(false);
    }
  }, [transformApiOrderToUiOrder]);

  // ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    if (selected === 0) {
      fetchCookOrders();
    }
  }, [selected, fetchCookOrders]);

  // ดึงข้อมูลเมื่อหน้าถูก focus
  useFocusEffect(
    useCallback(() => {
      if (selected === 0) {
        fetchCookOrders();
      }
    }, [selected, fetchCookOrders])
  );

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

  // ฟังก์ชันสำหรับจัดการการสไลด์เสร็จ
  const handleSlideComplete = useCallback(async (orderId: string) => {
    try {
      await completeOrder(orderId);
      // Refresh ข้อมูลหลังจากส่งออเดอร์สำเร็จ
      await fetchCookOrders();
      alert('ยืนยันออเดอร์เรียบร้อย!');
    } catch (error) {
      console.error('Error completing order:', error);
      alert('เกิดข้อผิดพลาดในการยืนยันออเดอร์');
    }
  }, [fetchCookOrders]);

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
            <View key={`${item.id}-item-${index}-${it.name}`} style={styles.itemRow}>
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
        onSlideComplete={() => handleSlideComplete(item.orderId)}
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
              key={`button-${label}-${index}`}
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

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C42127" />
              <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
            </View>
          )}

          {/* Error state */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchCookOrders}
              >
                <Text style={styles.retryButtonText}>ลองใหม่</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Orders list */}
          {!loading && !error && orders.length > 0 && (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrder}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}

          {/* Empty state - แสดงเมื่อไม่มีออเดอร์และไม่ใช่ loading/error */}
          {!loading && !error && orders.length === 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={styles.card}>
                <Text style={styles.id}>ไม่มีออเดอร์</Text>

                {/* Header row */}
                <View style={styles.headerRow}>
                  <Text style={[styles.headerText, { flex: 3, textAlign: 'left', paddingLeft: 20 }]}>รายการ</Text>
                  <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>จำนวน</Text>
                  <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>ราคา</Text>
                </View>

                {/* Items - แสดงข้อความว่าไม่มีออเดอร์ */}
                <ScrollView style={{ maxHeight: height * 0.43 }}>
                  <View style={styles.emptyMessageContainer}>
                    <Text style={styles.emptyMessageText}>ยังไม่มีออเดอร์ที่ต้องทำ</Text>
                    <Text style={styles.emptyMessageSubtext}>รอรับออเดอร์ใหม่จากลูกค้า</Text>
                  </View>
                </ScrollView>

                {/* Status */}
                <Text style={[styles.status, { paddingLeft: 20 }]}>
                  รายละเอียดเพิ่มเติม : รอรับออเดอร์
                </Text>
              </View>

              {/* Cancel button */}
              <TouchableOpacity
                style={[styles.cancelButton, { opacity: 0.5 }]}
                disabled={true}
              >
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>

              {/* Slide button */}
              <View style={{ opacity: 0.5 }}>
                <SlideButton
                  height={60}
                  onSlideComplete={() => {}}
                />
              </View>

              {/* Summary */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryDone}>ออเดอร์ที่สำเร็จแล้ว: 0</Text>
                  <Text style={styles.summaryPending}>ออเดอร์ที่เหลือ: 0</Text>
                </View>
                <Text style={styles.summaryTotal}>ออเดอร์ทั้งหมด: 0</Text>
              </View>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#C42127',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#C42127',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.15,
    paddingHorizontal: 20,
    minHeight: height * 0.35,
  },
  emptyMessageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
