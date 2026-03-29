import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GetPosInfo } from '@/service/store';

export default function InfoStore() {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchType, setBranchType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPos = async () => {
      try {
        setLoading(true);
        setError(null);
        const pos = await GetPosInfo();
        setShopName(pos?.Name || '');
        setPhone(pos?.Phone || '');
        setBranchType(pos?.BranchType || '');
      } catch (e: any) {
        setError(e?.message || 'โหลดข้อมูลร้านไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    loadPos();
  }, []);

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

        <Text style={styles.label}>เบอร์โทร</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกเบอร์โทร"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>ประเภทร้าน (BranchType)</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น mobile"
          value={branchType}
          onChangeText={setBranchType}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveText}>{loading ? 'กำลังโหลด...' : 'บันทึกข้อมูล'}</Text>
        </TouchableOpacity>

        {!!error && <Text style={{ color: '#b91c1c', marginTop: 8 }}>{error}</Text>}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกสำเร็จ!</Text>
            <Text style={styles.modalText}>
              ชื่อร้าน: {shopName}{'\n'}
              ประเภทสาขา: {branchType || '-'}{'\n'}
              เบอร์โทร: {phone || '-'}
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
