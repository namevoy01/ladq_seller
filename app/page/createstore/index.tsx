import { useAuth } from '@/contexts/AuthContext';
import { PostCreateMerchant, PostCreateMerchantPayload } from '@/service/store';
import { useRouter } from 'expo-router';
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

export default function CreateStore() {
  const { width } = Dimensions.get('window');
  const [activeTab, setActiveTab] = useState('create');
  const { logout } = useAuth();
  const router = useRouter();
  
  const getMarginHorizontal = () => {
    return width < 400 ? 5 : 8;
  };
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeType: '',
    storeAddress: '',
    storePhone: '',
    storeFormat: 'Mobile', // Mobile or Fixed
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed ownerInfo state

  const handleStoreInfoChange = (field: string, value: string) => {
    setStoreInfo(prev => ({ ...prev, [field]: value }));
  };

  // Removed handleOwnerInfoChange function

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!storeInfo.storeName.trim()) {
        throw new Error('กรุณากรอกชื่อร้านค้า');
      }
      if (!storeInfo.storeType.trim()) {
        throw new Error('กรุณากรอกประเภทร้านค้า');
      }
      if (!storeInfo.storePhone.trim()) {
        throw new Error('กรุณากรอกเบอร์โทรติดต่อ');
      }

      // Prepare payload
      const payload: PostCreateMerchantPayload = {
        branch_type: storeInfo.storeFormat.toLowerCase(), // Mobile -> mobile, Fixed -> fixed
        merchant_type: [1], // Default to [1], can be modified based on storeType
        name: storeInfo.storeName.trim(),
        phone: storeInfo.storePhone.trim(),
      };

      // Call API
      const result = await PostCreateMerchant(payload);
      console.log('Create merchant result:', result);
      
      // Success - redirect to profile or refresh
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการสร้างร้านค้า');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Store Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลร้านค้า</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>รูปแบบร้านค้า :</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  storeInfo.storeFormat === 'Mobile' && styles.selectOptionActive
                ]}
                onPress={() => handleStoreInfoChange('storeFormat', 'Mobile')}
              >
                <Text style={[
                  styles.selectOptionText,
                  storeInfo.storeFormat === 'Mobile' && styles.selectOptionTextActive
                ]}>
                  ร้านเคลื่อนที่
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  storeInfo.storeFormat === 'Fixed' && styles.selectOptionActive
                ]}
                onPress={() => handleStoreInfoChange('storeFormat', 'Fixed')}
              >
                <Text style={[
                  styles.selectOptionText,
                  storeInfo.storeFormat === 'Fixed' && styles.selectOptionTextActive
                ]}>
                  ร้านคงที่
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
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
            <Text style={styles.label}>ประเภทร้านค้า :</Text>
            <TextInput
              style={styles.input}
              value={storeInfo.storeType}
              onChangeText={(value) => handleStoreInfoChange('storeType', value)}
              placeholder="กรอกประเภทร้านค้า"
            />
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

        {/* Owner Information Section removed */}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'กำลังสร้างร้านค้า...' : (activeTab === 'create' ? 'สร้างร้านค้า' : 'เคลมร้านค้า')}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
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
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  selectOptionActive: {
    backgroundColor: '#e74c3c',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectOptionTextActive: {
    color: 'white',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});

