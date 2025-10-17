import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InfoStore() {
  const [shopName, setShopName] = useState('ร้านก๋วยเตี๋ยวป้าแดง');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ข้อมูลร้านค้า / แก้ไขร้านค้า</Text>

        <Text style={styles.label}>ชื่อร้านค้า</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกชื่อร้านค้า"
          value={shopName}
          onChangeText={setShopName}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label]}>เวลาเปิด</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น 09:00"
              value={openTime}
              onChangeText={setOpenTime}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label]}>เวลาปิด</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น 20:00"
              value={closeTime}
              onChangeText={setCloseTime}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveText}>บันทึกข้อมูล</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกสำเร็จ!</Text>
            <Text style={styles.modalText}>
              ชื่อร้าน: {shopName}{'\n'}เวลาเปิด–ปิด: {openTime} - {closeTime}
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f4f7' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  label: { fontSize: 14, color: '#4b5563', marginBottom: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  saveButton: { marginTop: 8, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '82%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, color: '#111827' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#374151' },
  modalButton: { backgroundColor: '#16a34a', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 12 },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
