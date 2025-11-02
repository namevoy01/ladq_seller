import { useAuth } from '@/contexts/AuthContext';
import { GetTimeSlot, PostTimeSlot, PostTimeSlotPayload } from '@/service/store';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ManageQueue() {
  const navigation = useNavigation();
  const { getBranchId } = useAuth();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [maxQueue, setMaxQueue] = useState<number>(1);
  const [roundsPerHour, setRoundsPerHour] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState<string>(''); // HH:mm
  const [endTime, setEndTime] = useState<string>('');     // HH:mm
  const [saving, setSaving] = useState<boolean>(false);

  const roundOptions = [
    { rounds: 1, label: '1 รอบต่อชั่วโมง (60 นาทีต่อรอบ)' },
    { rounds: 2, label: '2 รอบต่อชั่วโมง (30 นาทีต่อรอบ)' },
    { rounds: 3, label: '3 รอบต่อชั่วโมง (20 นาทีต่อรอบ)' },
    { rounds: 4, label: '4 รอบต่อชั่วโมง (15 นาทีต่อรอบ)' },
  ];

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const branchId = getBranchId();
        if (!branchId) {
          throw new Error('ไม่พบสาขา (branch_id) จากโทเคน');
        }
        let result = await GetTimeSlot(branchId);
        // Expecting { Config: [ { interval_minutes, capacity, is_active, ... } ] }
        let cfg = Array.isArray(result?.Config) && result.Config.length > 0 ? result.Config[0] : null;
        // If no existing config, create one using current UI defaults, then refetch
        if (!cfg) {
          const interval = Math.max(1, Math.floor(60 / Math.max(1, roundsPerHour)));
          const payload: PostTimeSlotPayload = {
            interval_minutes: interval,
            capacity: Math.max(0, maxQueue | 0),
            start_at: startTime ? `${startTime}:00` : '00:00:00',
            end_at: endTime ? `${endTime}:00` : '00:00:00',
          };
          try {
            await PostTimeSlot(payload);
            result = await GetTimeSlot(branchId);
            cfg = Array.isArray(result?.Config) && result.Config.length > 0 ? result.Config[0] : null;
          } catch (createErr) {
            // If creation fails, keep cfg as null and surface error below as needed
            console.warn('สร้าง TimeSlot ครั้งแรกไม่สำเร็จ', createErr);
          }
        }
        if (cfg) {
          setIsQueueOpen(!!cfg.is_active);
          // capacity -> จำนวนคิวสูงสุด
          if (typeof cfg.capacity === 'number' && cfg.capacity > 0) {
            setMaxQueue(cfg.capacity);
          }
          // interval_minutes -> รอบต่อชั่วโมง = 60 / interval_minutes
          if (typeof cfg.interval_minutes === 'number' && cfg.interval_minutes > 0) {
            const rounds = Math.max(1, Math.floor(60 / cfg.interval_minutes));
            // Clamp to available options 1-4
            const clamped = Math.min(4, Math.max(1, rounds));
            setRoundsPerHour(clamped);
          }
          // Parse start_at / end_at -> HH:mm
          const pickHHmm = (isoLike?: string): string => {
            if (!isoLike || typeof isoLike !== 'string') return '';
            const m = isoLike.match(/T(\d{2}:\d{2}):\d{2}/);
            return m ? m[1] : '';
          };
          setStartTime(pickHHmm(cfg.start_at));
          setEndTime(pickHHmm(cfg.end_at));
        }
      } catch (e: any) {
        setError(e?.message || 'ไม่สามารถดึงการตั้งค่าคิวได้');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [getBranchId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'จัดการคิว',
      headerBackTitle: 'ย้อนกลับ',
      headerTintColor: '#000',
    });
  }, [navigation]);

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      // Convert roundsPerHour to interval minutes (1->60, 2->30, 3->20, 4->15)
      const interval = Math.max(1, Math.floor(60 / Math.max(1, roundsPerHour)));
      const payload: PostTimeSlotPayload = {
        interval_minutes: interval,
        capacity: Math.max(0, maxQueue | 0),
        start_at: startTime ? `${startTime}:00` : '00:00:00',
        end_at: endTime ? `${endTime}:00` : '00:00:00',
      };
      await PostTimeSlot(payload);
      setModalVisible(true);
    } catch (e: any) {
      setError(e?.message || 'บันทึกการตั้งค่าคิวไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator />
        </View>
      )}
      {!!error && (
        <Text style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</Text>
      )}
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
          <TextInput
            value={String(maxQueue)}
            onChangeText={(text) => {
              const onlyDigits = text.replace(/[^0-9]/g, '');
              const num = onlyDigits === '' ? 0 : parseInt(onlyDigits, 10);
              setMaxQueue(Number.isNaN(num) ? 0 : num);
            }}
            keyboardType="number-pad"
            style={{ height: 50, paddingHorizontal: 12 }}
            placeholder="ระบุจำนวนคิวสูงสุด"
          />
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

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>เวลาเปิด-ปิด</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.pickerContainer, { flex: 1 }]}> 
            <TextInput
              value={startTime}
              onChangeText={(text) => {
                // Allow only digits and colon, format to HH:MM
                const sanitized = text.replace(/[^0-9:]/g, '');
                // Auto-insert colon if typing digits
                const digits = sanitized.replace(/:/g, '');
                let hh = digits.slice(0, 2);
                let mm = digits.slice(2, 4);
                let formatted = hh;
                if (mm.length > 0) formatted += ':' + mm;
                setStartTime(formatted);
              }}
              keyboardType="number-pad"
              placeholder="เปิด (HH:MM)"
              style={{ height: 50, paddingHorizontal: 12 }}
              maxLength={5}
            />
          </View>
          <View style={[styles.pickerContainer, { flex: 1 }]}> 
            <TextInput
              value={endTime}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9:]/g, '');
                const digits = sanitized.replace(/:/g, '');
                let hh = digits.slice(0, 2);
                let mm = digits.slice(2, 4);
                let formatted = hh;
                if (mm.length > 0) formatted += ':' + mm;
                setEndTime(formatted);
              }}
              keyboardType="number-pad"
              placeholder="ปิด (HH:MM)"
              style={{ height: 50, paddingHorizontal: 12 }}
              maxLength={5}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</Text>
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
              รอบต่อชั่วโมง: {roundsPerHour}{'\n'}
              เวลาเปิด: {startTime || '-'}{'\n'}
              เวลาปิด: {endTime || '-'}
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
