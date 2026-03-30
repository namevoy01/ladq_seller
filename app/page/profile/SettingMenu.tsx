import { useAuth } from "@/contexts/AuthContext";
import {
    CreateMenu,
    MenuAll,
    MenuCategories,
    MenuCategory,
    resolveMenuImageUrl,
    UpdateMenu,
    UpdateMenuPayload,
} from "@/service/store";
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
  ID: string;
  Name: string;
  Type: string;
  IsRequired: boolean;
  Min: number;
  Max: number;
  Display: number;
  IsActive: boolean;
  Price: number;
  SubOption?: SubOption[];
}

interface SubOption {
  ID: string;
  Name: string;
  Price: number;
  IsDefault: boolean;
  Display: number;
  IsActive: boolean;
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
  const { getMerchantId } = useAuth();
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
  const isBlank = (text: string | null | undefined) =>
    !text || text.trim().length === 0;

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
          MenuAll(merchantId).catch(() => []),
          MenuCategories().catch(() => [] as MenuCategory[]),
        ]);

        // Build id -> name map
        const map: Record<number, string> = {};
        if (categories && Array.isArray(categories)) {
          categories.forEach((c) => {
            if (c && typeof c.id === "number" && typeof c.name === "string") {
              map[c.id] = c.name;
            }
          });
        }
        setCategoryMap(map);
        setCategories(categories);

        const formatted = (data && Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.ID,
          name: item.Name,
          price: item.Price,
          image: (() => {
            const resolved = resolveMenuImageUrl(item.Image);
            return resolved && resolved.length > 0 ? resolved : DEFAULT_IMAGE_URL;
          })(),
          detail: item.Detail,
          category_id: item.Category,
          options: item.Option || [],
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
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      if (
        isBlank(menuName) ||
        isBlank(menuCategoryId) ||
        isBlank(menuPrice) ||
        isBlank(menuDetail)
      ) {
        alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      // แปลง options จาก UI -> payload ของ Create Menu
      const apiOptions = (menuOptions || []).map((opt) => ({
        display: typeof opt.Display === "number" ? opt.Display : 0,
        is_active: !!opt.IsActive,
        is_required: !!opt.IsRequired,
        max: Number.isFinite(opt.Max) ? opt.Max : 0,
        min: Number.isFinite(opt.Min) ? opt.Min : 0,
        name: opt.Name || "",
        type: opt.Type || "single",
        subs: (opt.SubOption || []).map((sub) => ({
          display: typeof sub.Display === "number" ? sub.Display : 0,
          is_active: !!sub.IsActive,
          is_default: !!sub.IsDefault,
          name: sub.Name || "",
          price: Number.isFinite(sub.Price) ? sub.Price : 0,
        })),
      }));

      // API contract (multipart): { data: [ { ...menu fields..., options } ], image: <file> }
      const payload = {
        data: [
          {
            category_id: Number(menuCategoryId) || 1,
            detail: menuDetail,
            name: menuName,
            options: apiOptions,
            price: Number(menuPrice),
          },
        ],
        imageUri: menuImage || null,
      };

      const created = await CreateMenu(payload);
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: menuName,
        price: Number(menuPrice),
        image: (() => {
          const fromCreate = resolveMenuImageUrl(created?.URI || "");
          const fromLocal = payload.imageUri || "";
          const resolved = fromCreate || resolveMenuImageUrl(fromLocal);
          return resolved && resolved.length > 0 ? resolved : DEFAULT_IMAGE_URL;
        })(),
        detail: menuDetail,
        category_id: Number(menuCategoryId) || 1,
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

  const saveEdit = async () => {
    if (!editingItem) return;
    try {
      if (
        isBlank(menuName) ||
        isBlank(menuCategoryId) ||
        isBlank(menuPrice) ||
        isBlank(menuDetail)
      ) {
        alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      // ✅ แปลง menuOptions เป็นโครงสร้างของ UpdateMenuPayload
      const apiOptions = menuOptions.map((opt) => ({
        id: opt.ID || "",
        name: opt.Name,
        type: opt.Type,
        is_required: opt.IsRequired,
        min: opt.Min,
        max: opt.Max,
        display: true,
        is_active: opt.IsActive,
        sub_options: (opt.SubOption || []).map((sub) => ({
          id: sub.ID || "",
          name: sub.Name,
          price: sub.Price,
          is_default: sub.IsDefault,
          display: true,
          is_active: sub.IsActive,
        })),
      }));

      const updatePayload: UpdateMenuPayload = {
        id: editingItem.id,
        category_id: Number(menuCategoryId) || 1,
        name: menuName,
        detail: menuDetail,
        image: menuImage || DEFAULT_IMAGE_URL,
        price: Number(menuPrice),
        options: apiOptions,
      };

      console.log("📤 ส่งข้อมูลแก้ไขเมนู:", JSON.stringify(updatePayload, null, 2));

      await UpdateMenu(updatePayload);

      // ✅ รีโหลดเมนูหลังอัปเดตสำเร็จ
      try {
        const merchantId = getMerchantId();
        if (merchantId) {
          const [data, categories] = await Promise.all([
            MenuAll(merchantId).catch(() => []),
            MenuCategories().catch(() => [] as MenuCategory[]),
          ]);

          const map: Record<number, string> = {};
          if (categories && Array.isArray(categories)) {
            categories.forEach((c) => {
              if (c && typeof c.id === "number" && typeof c.name === "string") {
                map[c.id] = c.name;
              }
            });
          }

          setCategoryMap(map);
          setCategories(categories);

          const formatted = (data && Array.isArray(data) ? data : []).map((item: any) => ({
            id: item.ID,
            name: item.Name,
            price: item.Price,
            image: (() => {
              const resolved = resolveMenuImageUrl(item.Image);
              return resolved && resolved.length > 0 ? resolved : DEFAULT_IMAGE_URL;
            })(),
            detail: item.Detail,
            category_id: item.Category,
            options: item.Option || [],
          }));

          setMenuItems(formatted);
        }
      } catch (refreshError) {
        console.error("ไม่สามารถโหลดข้อมูลเมนูใหม่:", refreshError);
      }

      setEditModalVisible(false);
      alert("✅ แก้ไขเมนูสำเร็จ");
    } catch (error) {
      console.error("❌ แก้ไขเมนูไม่สำเร็จ:", error);
      alert("แก้ไขเมนูไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  const deleteMenu = () => {
    if (!editingItem) return;
    const updatedItems = menuItems.filter((item) => item.id !== editingItem.id);
    setMenuItems(updatedItems);
    setEditModalVisible(false);
  };

  // ---- Option/SubOption actions ----
  const addOption = () =>
    setMenuOptions([
      ...menuOptions,
      {
        ID: "",
        Name: "",
        Type: "single",
        IsRequired: false,
        Min: 0,
        Max: 1,
        Display: 0,
        IsActive: true,
        Price: 0,
        SubOption: [],
      },
    ]);

  const updateOption = (
    index: number,
    key: keyof MenuOption,
    value: string
  ) => {
    const newOptions = [...menuOptions];
    if (key === "Price") newOptions[index].Price = Number(value);
    else if (key === "Name") newOptions[index].Name = value;
    else if (key === "Type") {
      newOptions[index].Type = value;
      // ถ้าเป็น 1 ตัวเลือก ให้ fix ค่าทันทีตาม requirement
      if (value === "single") {
        newOptions[index].Min = 0;
        newOptions[index].Max = 1;
      }
    }
    else if (key === "Min") newOptions[index].Min = Number(value);
    else if (key === "Max") newOptions[index].Max = Number(value);
    setMenuOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = [...menuOptions];
    newOptions.splice(index, 1);
    setMenuOptions(newOptions);
  };

  const addSubOption = (optionIndex: number) => {
    const newOptions = [...menuOptions];
    if (!newOptions[optionIndex].SubOption) {
      newOptions[optionIndex].SubOption = [];
    }
    newOptions[optionIndex].SubOption.push({
      ID: "",
      Name: "",
      Price: 0,
      IsDefault: false,
      Display: 0,
      IsActive: true,
    });
    setMenuOptions(newOptions);
  };

  const updateSubOption = (
    optionIndex: number,
    subIndex: number,
    key: keyof SubOption,
    value: string
  ) => {
    const newOptions = [...menuOptions];
    if (newOptions[optionIndex].SubOption) {
      if (key === "Price") {
        newOptions[optionIndex].SubOption![subIndex].Price = Number(value);
      } else if (key === "Name") {
        newOptions[optionIndex].SubOption![subIndex].Name = value;
      }
    }
    setMenuOptions(newOptions);
  };

  const removeSubOption = (optionIndex: number, subIndex: number) => {
    const newOptions = [...menuOptions];
    if (newOptions[optionIndex].SubOption) {
      newOptions[optionIndex].SubOption!.splice(subIndex, 1);
    }
    setMenuOptions(newOptions);
  };

  // ✅ UI render
  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.image && item.image.length > 0 ? item.image : DEFAULT_IMAGE_URL,
        }}
        style={styles.menuImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuPrice}>{item.price} บาท</Text>
        {item.detail ? <Text style={styles.menuDetail}>{item.detail}</Text> : null}
        <Text style={styles.menuCategory}>
          หมวดหมู่: {item.category_id || "-"}
        </Text>

        {item.options && Array.isArray(item.options) && item.options.length > 0 && (
          <View style={styles.optionList}>
            {item.options.map((opt, idx) => (
              <View key={`${item.id}-option-${idx}-${opt.Name}`}>
                <Text style={styles.optionItem}>• {opt.Name} ({opt.Type})</Text>
                {opt.SubOption && Array.isArray(opt.SubOption) && opt.SubOption.length > 0 && (
                  <View style={{ marginLeft: 10 }}>
                    {opt.SubOption.map((subOpt, subIdx) => (
                      <Text
                        key={`${item.id}-suboption-${idx}-${subIdx}-${subOpt.Name}`}
                        style={[
                          styles.optionItem,
                          { fontSize: 12, color: "#6b7280" },
                        ]}
                      >
                        - {subOpt.Name} +{subOpt.Price}฿
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditItem(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.editText}>แก้ไข</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuForm = (
    onSave: () => void,
    onClose: () => void,
    title: string,
    showDelete?: boolean
  ) => (
    <View style={styles.modalOuter}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <Text style={styles.modalTitle}>{title}</Text>
        <TextInput
          style={styles.input}
          placeholder="ชื่อเมนู"
          value={menuName}
          onChangeText={setMenuName}
        />
        <TouchableOpacity
          style={[styles.categorySelect]}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text>
            {categoryMap[Number(menuCategoryId)] ||
              `เลือกหมวดหมู่ (ID: ${menuCategoryId || "-"})`}
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
        {!showDelete && (
          <>
            {menuImage ? (
              <Image source={{ uri: menuImage }} style={styles.previewImage} />
            ) : (
              <Image source={{ uri: DEFAULT_IMAGE_URL }} style={styles.previewImage} />
            )}
            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={pickImageFromDevice}
              activeOpacity={0.8}
            >
              <Text style={styles.pickImageButtonText}>
                {menuImage ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพจากเครื่อง"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>ตัวเลือกเพิ่มเติม</Text>
        {menuOptions && Array.isArray(menuOptions) && menuOptions.map((opt, index) => (
          <View key={`menu-option-${index}-${opt.Name}`} style={styles.optionGroup}>
            <View style={styles.optionRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="ชื่อตัวเลือก (เช่น ขนาด, เพิ่มเติม)"
                value={opt.Name}
                onChangeText={(text) => updateOption(index, "Name", text)}
              />
              <TouchableOpacity onPress={() => removeOption(index)}>
                <Text style={styles.removeOption}>ลบ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionTypeWrap}>
              <Text style={styles.optionTypeLabel}>รูปแบบการเลือก</Text>
              <View style={styles.optionTypeRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.optionTypeButton,
                    opt.Type === "single" && styles.optionTypeButtonActive,
                  ]}
                  onPress={() => updateOption(index, "Type", "single")}
                >
                  <Text
                    style={[
                      styles.optionTypeButtonText,
                      opt.Type === "single" && styles.optionTypeButtonTextActive,
                    ]}
                  >
                    1 ตัวเลือก
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.optionTypeButton,
                    opt.Type === "multiple" && styles.optionTypeButtonActive,
                  ]}
                  onPress={() => updateOption(index, "Type", "multiple")}
                >
                  <Text
                    style={[
                      styles.optionTypeButtonText,
                      opt.Type === "multiple" && styles.optionTypeButtonTextActive,
                    ]}
                  >
                    หลายตัวเลือก
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionTypeRow}>
              <View style={styles.minMaxField}>
                <Text style={styles.minMaxLabel}>ขั้นต่ำ</Text>
                <TextInput
                  style={[styles.input, { width: 90, marginBottom: 0 }]}
                  placeholder="เช่น 0"
                  keyboardType="number-pad"
                  editable={opt.Type !== "single"}
                  value={opt.Min.toString()}
                  onChangeText={(text) =>
                    updateOption(index, "Min", onlyDigits(text))
                  }
                />
              </View>
              <View style={styles.minMaxField}>
                <Text style={styles.minMaxLabel}>สูงสุด</Text>
                <TextInput
                  style={[styles.input, { width: 90, marginBottom: 0 }]}
                  placeholder="เช่น 1"
                  keyboardType="number-pad"
                  editable={opt.Type !== "single"}
                  value={opt.Max.toString()}
                  onChangeText={(text) =>
                    updateOption(index, "Max", onlyDigits(text))
                  }
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                const updated = [...menuOptions];
                updated[index].IsActive = !updated[index].IsActive;
                setMenuOptions(updated);
              }}
              style={[
                styles.toggleButton,
                { backgroundColor: opt.IsActive ? "#22c55e" : "#9ca3af" },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {opt.IsActive ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
              </Text>
            </TouchableOpacity>

            <Text
              style={[styles.sectionTitle, { fontSize: 14, marginTop: 10 }]}
            >
              ตัวเลือกรายย่อย:
            </Text>
            {opt.SubOption && Array.isArray(opt.SubOption) && opt.SubOption.map((subOpt, subIndex) => (
              <View
                key={`sub-option-${index}-${subIndex}-${subOpt.Name}`}
                style={styles.subOptionRow}
              >
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="ชื่อตัวเลือกรายย่อย"
                  value={subOpt.Name}
                  onChangeText={(text) =>
                    updateSubOption(index, subIndex, "Name", text)
                  }
                />
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  placeholder="ราคา"
                  keyboardType="number-pad"
                  value={subOpt.Price.toString()}
                  onChangeText={(text) =>
                    updateSubOption(index, subIndex, "Price", onlyDigits(text))
                  }
                />
                <TouchableOpacity
                  onPress={() => {
                    const newOptions = [...menuOptions];
                    newOptions[index].SubOption![subIndex].IsActive =
                      !newOptions[index].SubOption![subIndex].IsActive;
                    setMenuOptions(newOptions);
                  }}
                  style={[
                    styles.toggleSubButton,
                    {
                      backgroundColor: subOpt.IsActive
                        ? "#22c55e"
                        : "#9ca3af",
                    },
                  ]}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>
                    {subOpt.IsActive ? "เปิด" : "ปิด"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => removeSubOption(index, subIndex)}>
                  <Text style={styles.removeOption}>ลบ</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSubOptionButton}
              onPress={() => addSubOption(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.addSubOptionText}>+ เพิ่มตัวเลือกรายย่อย</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addOptionButton}
          onPress={addOption}
          activeOpacity={0.8}
        >
          <Text style={styles.addOptionText}>+ เพิ่มตัวเลือก</Text>
        </TouchableOpacity>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.modalButtonText}>บันทึก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>

        {showDelete && (
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={deleteMenu}
          >
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

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMenu}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ เพิ่มเมนู</Text>
        </TouchableOpacity>

        <FlatList
          data={menuItems || []}
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
                {categories && Array.isArray(categories) && categories.map((cat) => (
                  <TouchableOpacity
                    key={`category-${cat.id}-${cat.name}`}
                    style={styles.categoryItem}
                    onPress={() => {
                      setMenuCategoryId(String(cat.id));
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryItemText}>
                      {cat.name} (ID: {cat.id})
                    </Text>
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

// ✅ styles
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

  // ✅ Modal
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
  optionGroup: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  optionTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  minMaxField: {
    flexDirection: "column",
  },
  minMaxLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "700",
  },
  optionTypeWrap: {
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
  },
  optionTypeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  optionTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  optionTypeButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  optionTypeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  optionTypeButtonTextActive: {
    color: "#1d4ed8",
  },
  subOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 10,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  removeOption: { color: "#ef4444", marginLeft: 8, fontWeight: "700" },
  addSubOptionButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
    marginLeft: 10,
  },
  addSubOptionText: { color: "#fff", fontWeight: "600", fontSize: 12 },
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
  toggleButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  toggleSubButton: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginHorizontal: 6,
    alignItems: "center",
  },
});
