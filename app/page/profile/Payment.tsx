import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type PaymentMethod = {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
};

export default function Payment() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const resetForm = () => {
    setBank('');
    setAccountNumber('');
    setAccountName('');
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const saveMethod = () => {
    const newItem: PaymentMethod = {
      id: Date.now().toString(),
      bank: bank.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
    };
    setMethods([newItem, ...methods]);
    setModalVisible(false);
  };

  const removeMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  const renderItem = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeftStripe} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemBank}>{item.bank}</Text>
        <Text style={styles.itemDetail}>เลขบัญชี: {item.accountNumber}</Text>
        <Text style={styles.itemDetail}>ชื่อบัญชี: {item.accountName}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeMethod(item.id)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="delete" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>ช่องทางการรับเงิน / แก้ไขช่องทางการรับเงิน</Text>
        <Text style={styles.subtitle}>เพิ่ม/จัดการบัญชีธนาคารสำหรับรับเงินจากลูกค้า</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.85}>
          <MaterialIcons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addButtonText}>เพิ่มช่องทางการชำระเงิน</Text>
        </TouchableOpacity>

        <FlatList
          data={methods}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีช่องทางการรับเงิน</Text>}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>เพิ่มช่องทางการชำระเงิน</Text>

          <Text style={styles.label}>ธนาคาร</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
            value={bank}
            onChangeText={setBank}
          />

          <Text style={styles.label}>เลขบัญชี</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น 123-4-56789-0"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>ชื่อบัญชี</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น นายสมชาย ใจดี"
            value={accountName}
            onChangeText={setAccountName}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveMethod} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f4f7' },

  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  addButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 14 },

  itemContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemLeftStripe: {
    width: 4,
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  itemBank: { fontSize: 16, fontWeight: '700', color: '#111827' },
  itemDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 10,
  },

  modalContainer: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: '#111827', textAlign: 'center' },
  label: { fontSize: 14, color: '#4b5563', marginBottom: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 14,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  saveButton: { backgroundColor: '#16a34a' },
  cancelButton: { backgroundColor: '#9ca3af' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
