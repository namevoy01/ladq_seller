import { useAuth } from "@/contexts/AuthContext";
import { CreateMenu, MenuAll, MenuCategories, MenuCategory } from "@/service/store";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULT_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/1/15/No_image_available_600_x_450.svg.png";

interface MenuOption {
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  detail?: string;
  category_id?: number;
  options?: MenuOption[];
}

export default function SettingMenu() {
  const { getMerchantId, getUserId, getBranchId, getRole, getUserInfo } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuImage, setMenuImage] = useState("");
  const [menuDetail, setMenuDetail] = useState("");
  const [menuCategoryId, setMenuCategoryId] = useState("1");
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const onlyDigits = (text: string) => text.replace(/[^0-9]/g, "");
  const isBlank = (text: string | null | undefined) => !text || text.trim().length === 0;

  // ---- โหลดเมนูจาก API ----
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const merchantId = getMerchantId();
        if (!merchantId) {
          setLoading(false);
          return;
        }
        const [data, categories] = await Promise.all([
          MenuAll(merchantId),
          MenuCategories().catch(() => [] as MenuCategory[]),
        ]);

        // Build id -> name map
        const map: Record<number, string> = {};
        categories.forEach((c) => {
          if (c && typeof c.id === 'number' && typeof c.name === 'string') {
            map[c.id] = c.name;
          }
        });
        setCategoryMap(map);
        setCategories(categories);
        const formatted = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image:
            item.image && item.image.startsWith("http")
              ? item.image
              : DEFAULT_IMAGE_URL,
          detail: item.detail,
          category_id: item.category_id,
          options: item.options || [],
        }));
        setMenuItems(formatted);
      } catch (error) {
        console.error("โหลดเมนูไม่สำเร็จ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // ---- Image Picker ----
  const pickImageFromDevice = async () => {
    try {
      if (Platform.OS === "ios") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("กรุณาอนุญาตการเข้าถึงรูปภาพเพื่อเลือกไฟล์จากเครื่อง");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMenuImage(result.assets[0].uri);
      }
    } catch {
      alert("ไม่สามารถเปิดตัวเลือกภาพได้ กรุณาลองอีกครั้ง");
    }
  };

  // ---- เพิ่มเมนู ----
  const handleAddMenu = () => {
    setMenuName("");
    setMenuPrice("");
    setMenuImage("");
    setMenuDetail("");
    setMenuCategoryId("1");
    setMenuOptions([]);
    setAddModalVisible(true);
  };

  const saveNewMenu = async () => {
    try {
      if (isBlank(menuName) || isBlank(menuCategoryId) || isBlank(menuPrice) || isBlank(menuDetail)) {
        alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      const payload = {
        category_id: Number(menuCategoryId) || 1,
        detail: menuDetail,
        image: menuImage || DEFAULT_IMAGE_URL,
        name: menuName,
        price: Number(menuPrice),
        options: menuOptions.length
          ? [
              {
                display: 0,
                is_active: true,
                is_required: false,
                max: 1,
                min: 0,
                name: "ตัวเลือก",
                type: "single",
                subs: menuOptions.map((opt, idx) => ({
                  display: idx,
                  is_active: true,
                  is_default: false,
                  name: opt.name,
                  price: Number(opt.price) || 0,
                })),
              },
            ]
          : [],
      };

      const created = await CreateMenu(payload);
      const newItem: MenuItem = {
        id: (created?.id ?? Date.now()).toString(),
        name: created?.name ?? payload.name,
        price: created?.price ?? payload.price,
        image: created?.image || payload.image,
        detail: created?.detail ?? payload.detail,
        category_id: created?.category_id ?? payload.category_id,
        options: menuOptions,
      };

      setMenuItems([newItem, ...menuItems]);
      setAddModalVisible(false);
    } catch (error) {
      console.error("สร้างเมนูไม่สำเร็จ:", error);
      alert("สร้างเมนูไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  // ---- แก้ไขเมนู ----
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setMenuName(item.name);
    setMenuPrice(item.price.toString());
    setMenuImage(item.image);
    setMenuCategoryId(String(item.category_id ?? "1"));
    setMenuDetail(item.detail || "");
    setMenuOptions(item.options ? [...item.options] : []);
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const updatedItems = menuItems.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            name: menuName,
            price: Number(menuPrice),
            image: menuImage,
            detail: menuDetail,
            category_id: Number(menuCategoryId),
            options: menuOptions,
          }
        : item
    );
    setMenuItems(updatedItems);
    setEditModalVisible(false);
  };

  const deleteMenu = () => {
    if (!editingItem) return;
    const updatedItems = menuItems.filter((item) => item.id !== editingItem.id);
    setMenuItems(updatedItems);
    setEditModalVisible(false);
  };

  const addOption = () => setMenuOptions([...menuOptions, { name: "", price: 0 }]);

  const updateOption = (index: number, key: keyof MenuOption, value: string) => {
    const newOptions = [...menuOptions];
    if (key === "price") newOptions[index].price = Number(value);
    else newOptions[index].name = value;
    setMenuOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = [...menuOptions];
    newOptions.splice(index, 1);
    setMenuOptions(newOptions);
  };

  // ✅ แสดงเมนูและ options
  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image && item.image.startsWith("http") ? item.image : DEFAULT_IMAGE_URL }}
        style={styles.menuImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuPrice}>{item.price} บาท</Text>
        {item.detail ? <Text style={styles.menuDetail}>{item.detail}</Text> : null}
        <Text style={styles.menuCategory}>
          หมวดหมู่: {typeof item.category_id === "number" ? (categoryMap[item.category_id] || item.category_id) : "-"}
        </Text>

        {item.options && item.options.length > 0 && (
          <View style={styles.optionList}>
            {item.options.map((opt, idx) => (
              <Text key={idx} style={styles.optionItem}>
                • {opt.name} +{opt.price}฿
              </Text>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => handleEditItem(item)} activeOpacity={0.8}>
        <Text style={styles.editText}>แก้ไข</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuForm = (onSave: () => void, onClose: () => void, title: string, showDelete?: boolean) => (
    <View style={styles.modalOuter}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <Text style={styles.modalTitle}>{title}</Text>

        <TextInput style={styles.input} placeholder="ชื่อเมนู" value={menuName} onChangeText={setMenuName} />
        <TouchableOpacity
          style={[styles.categorySelect]}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text>
            {categoryMap[Number(menuCategoryId)] || `เลือกหมวดหมู่ (ID: ${menuCategoryId || '-'})`}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="ราคา"
          keyboardType="number-pad"
          value={menuPrice}
          onChangeText={(t) => setMenuPrice(onlyDigits(t))}
        />
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="รายละเอียดเมนู"
          multiline
          value={menuDetail}
          onChangeText={setMenuDetail}
        />

        {menuImage ? (
          <Image source={{ uri: menuImage }} style={styles.previewImage} />
        ) : (
          <Image source={{ uri: DEFAULT_IMAGE_URL }} style={styles.previewImage} />
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImageFromDevice} activeOpacity={0.8}>
          <Text style={styles.pickImageButtonText}>
            {menuImage ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพจากเครื่อง"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>ตัวเลือกเพิ่มเติม</Text>
        {menuOptions.map((opt, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="ชื่อ"
              value={opt.name}
              onChangeText={(text) => updateOption(index, "name", text)}
            />
            <TextInput
              style={[styles.input, { width: 100 }]}
              placeholder="ราคา"
              keyboardType="number-pad"
              value={opt.price.toString()}
              onChangeText={(text) => updateOption(index, "price", onlyDigits(text))}
            />
            <TouchableOpacity onPress={() => removeOption(index)}>
              <Text style={styles.removeOption}>ลบ</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addOptionButton} onPress={addOption} activeOpacity={0.8}>
          <Text style={styles.addOptionText}>+ เพิ่มตัวเลือก</Text>
        </TouchableOpacity>

        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={onSave}>
            <Text style={styles.modalButtonText}>บันทึก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.modalButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>

        {showDelete && (
          <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={deleteMenu}>
            <Text style={styles.modalButtonText}>ลบเมนู</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>กำลังโหลดเมนู...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainCard}>
        <Text style={styles.title}>📋 เมนูทั้งหมด</Text>

        <TouchableOpacity style={styles.addButton} onPress={handleAddMenu} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ เพิ่มเมนู</Text>
        </TouchableOpacity>

        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        />

        {/* ✅ Modal เพิ่มเมนู */}
        <Modal visible={addModalVisible} animationType="slide">
          {renderMenuForm(saveNewMenu, () => setAddModalVisible(false), "เพิ่มเมนู")}
        </Modal>

        {/* ✅ Modal แก้ไขเมนู */}
        <Modal visible={editModalVisible} animationType="slide">
          {renderMenuForm(saveEdit, () => setEditModalVisible(false), "แก้ไขเมนู", true)}
        </Modal>

        {/* Category picker */}
        <Modal visible={categoryModalVisible} animationType="fade" transparent>
          <View style={styles.categoryModalBackdrop}>
            <View style={styles.categoryModalCard}>
              <Text style={styles.categoryModalTitle}>เลือกหมวดหมู่</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryItem}
                    onPress={() => {
                      setMenuCategoryId(String(cat.id));
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryItemText}>{cat.name} (ID: {cat.id})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  mainCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuImage: { width: 70, height: 70, borderRadius: 12, marginRight: 14 },
  itemInfo: { flex: 1 },
  menuName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  menuPrice: { fontSize: 14, color: "#059669", marginTop: 2 },
  menuDetail: { fontSize: 13, color: "#4b5563", marginTop: 4 },
  menuCategory: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  optionList: { marginTop: 6 },
  optionItem: { fontSize: 13, color: "#374151", marginLeft: 8 },
  editButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "center",
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // ✅ Modal styles
  modalOuter: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingBottom: 20,
  },
  modalContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    color: "#111827",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
    fontSize: 15,
  },
  categorySelect: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
  },
  pickImageButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  pickImageButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1f2937",
  },
  optionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  removeOption: { color: "#ef4444", marginLeft: 8, fontWeight: "700" },
  addOptionButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  addOptionText: { color: "#fff", fontWeight: "700", fontSize: 15 },
   modalButtons: {
     flexDirection: "row",
     justifyContent: "space-between",
     marginTop: 20,
   },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: { backgroundColor: "#22c55e" },
  cancelButton: { backgroundColor: "#9ca3af" },
  deleteButton: {
    backgroundColor: "#ef4444",
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  categoryModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  categoryModalCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 16,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
    textAlign: "center",
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryItemText: {
    fontSize: 15,
    color: "#111827",
  },
});
