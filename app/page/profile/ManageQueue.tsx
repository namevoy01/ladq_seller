import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ManageQueue() {
  const navigation = useNavigation();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [maxQueue, setMaxQueue] = useState<number>(1);
  const [roundsPerHour, setRoundsPerHour] = useState<number>(4);
  const [modalVisible, setModalVisible] = useState(false);

  const maxQueueOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  const roundOptions = [
    { rounds: 1, label: '1 รอบต่อชั่วโมง (60 นาทีต่อรอบ)' },
    { rounds: 2, label: '2 รอบต่อชั่วโมง (30 นาทีต่อรอบ)' },
    { rounds: 3, label: '3 รอบต่อชั่วโมง (20 นาทีต่อรอบ)' },
    { rounds: 4, label: '4 รอบต่อชั่วโมง (15 นาทีต่อรอบ)' },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'จัดการคิว',
      headerBackTitle: 'ย้อนกลับ',
      headerTintColor: '#000',
    });
  }, [navigation]);

  const handleSave = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>จัดการคิว</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{isQueueOpen ? 'เปิด' : 'ปิด'}</Text>
            <Switch
              value={isQueueOpen}
              onValueChange={setIsQueueOpen}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>จำนวนคิวสูงสุด</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={maxQueue}
            onValueChange={(value: number) => setMaxQueue(value)}
            style={styles.picker}
          >
            {maxQueueOptions.map((num) => (
              <Picker.Item key={num} label={num.toString()} value={num} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ช่วงเวลาต่อรอบ</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={roundsPerHour}
            onValueChange={(value: number) => setRoundsPerHour(value)}
            style={styles.picker}
          >
            {roundOptions.map((option) => (
              <Picker.Item key={option.rounds} label={option.label} value={option.rounds} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveText}>บันทึกการตั้งค่า</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกสำเร็จ!</Text>
            <Text style={styles.modalText}>
              สถานะคิว: {isQueueOpen ? 'เปิด' : 'ปิด'}{'\n'}
              จำนวนคิวสูงสุด: {maxQueue}{'\n'}
              รอบต่อชั่วโมง: {roundsPerHour}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginRight: 10, fontSize: 14, fontWeight: '600', color: '#4b5563' },
  sectionLabel: { fontSize: 14, color: '#4b5563', marginBottom: 8, fontWeight: '600' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  picker: { height: 50, width: '100%' },
  saveButton: { marginTop: 24, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '82%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, color: '#111827' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#374151' },
  modalButton: { backgroundColor: '#16a34a', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 12 },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
