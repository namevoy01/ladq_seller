import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ClaimStore() {
  const { width } = Dimensions.get('window');
  const [activeTab, setActiveTab] = useState('claim');
  
  const getMarginHorizontal = () => {
    return width < 400 ? 5 : 8;
  };
  
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeType: '',
    storeAddress: '',
    storePhone: '',
  });
  const [ownerInfo, setOwnerInfo] = useState({
    ownerName: '',
    ownerPhone: '',
    idCard: '',
    companyDoc: '',
  });

  const handleStoreInfoChange = (field: string, value: string) => {
    setStoreInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleOwnerInfoChange = (field: string, value: string) => {
    setOwnerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Store Info:', storeInfo);
    console.log('Owner Info:', ownerInfo);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
        {/* Segmented Control */}
        <View style={[styles.segmentedControl, { marginHorizontal: getMarginHorizontal(), marginTop: 20 }]}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'create' && styles.activeSegment]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.segmentText, activeTab === 'create' && styles.activeSegmentText]}>
              สร้างร้านค้า
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'claim' && styles.activeSegment]}
            onPress={() => setActiveTab('claim')}
          >
            <Text style={[styles.segmentText, activeTab === 'claim' && styles.activeSegmentText]}>
              เคลมร้านค้า
            </Text>
          </TouchableOpacity>
        </View>
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลร้านค้า</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ชื่อร้านค้า :</Text>
            <TextInput
              style={styles.input}
              value={storeInfo.storeName}
              onChangeText={(value) => handleStoreInfoChange('storeName', value)}
              placeholder="กรอกชื่อร้านค้า"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ประเภทร้าน :</Text>
            <TextInput
              style={styles.input}
              value={storeInfo.storeType}
              onChangeText={(value) => handleStoreInfoChange('storeType', value)}
              placeholder="กรอกประเภทร้าน"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ที่อยู่ร้าน :</Text>
            <View style={styles.mapInput}>
              <Text style={styles.mapText}>MAP</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>เบอร์โทรติดต่อร้าน :</Text>
            <TextInput
              style={styles.input}
              value={storeInfo.storePhone}
              onChangeText={(value) => handleStoreInfoChange('storePhone', value)}
              placeholder="กรอกเบอร์โทรติดต่อ"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Owner Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลเจ้าของร้าน</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ชื่อ-นามสกุลเจ้าของร้าน :</Text>
            <TextInput
              style={styles.input}
              value={ownerInfo.ownerName}
              onChangeText={(value) => handleOwnerInfoChange('ownerName', value)}
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>เบอร์โทรศัพท์ที่สามารถติดต่อได้ :</Text>
            <TextInput
              style={styles.input}
              value={ownerInfo.ownerPhone}
              onChangeText={(value) => handleOwnerInfoChange('ownerPhone', value)}
              placeholder="กรอกเบอร์โทรศัพท์"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>สำเนาบัตรประชาชน (กรณีบุคคลธรรมดา) :</Text>
            <TextInput
              style={styles.input}
              value={ownerInfo.idCard}
              onChangeText={(value) => handleOwnerInfoChange('idCard', value)}
              placeholder="อัปโหลดสำเนาบัตรประชาชน"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>สำเนาหนังสือรับรองบริษัท/ห้างหุ้นส่วน (กรณีนิติบุคคล) :</Text>
            <TextInput
              style={styles.input}
              value={ownerInfo.companyDoc}
              onChangeText={(value) => handleOwnerInfoChange('companyDoc', value)}
              placeholder="อัปโหลดสำเนาเอกสารบริษัท"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>เคลมร้านค้า</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: '#e74c3c',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeSegmentText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  mapText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
