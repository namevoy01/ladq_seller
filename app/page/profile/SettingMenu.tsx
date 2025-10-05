import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface MenuOption {
    name: string;
    price: number;
}

interface MenuItem {
    id: string;
    name: string;
    price: number;
    image: string;
    options?: MenuOption[];
}

export default function SettingMenu() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([
        {
            id: '1',
            name: 'ไข่ดาว',
            price: 15,
            image: 'https://www.w3schools.com/w3images/avatar2.png',
            options: [
                { name: 'เพิ่มชีส', price: 10 },
                { name: 'เพิ่มเบคอน', price: 15 },
            ],
        },
        {
            id: '2',
            name: 'ข้าวผัด',
            price: 50,
            image: 'https://www.w3schools.com/w3images/avatar2.png',
            options: [{ name: 'เพิ่มไข่', price: 10 }],
        },
    ]);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [menuName, setMenuName] = useState('');
    const [menuPrice, setMenuPrice] = useState('');
    const [menuImage, setMenuImage] = useState('');
    const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);

    // ---- เพิ่มเมนู ----
    const handleAddMenu = () => {
        setMenuName('');
        setMenuPrice('');
        setMenuImage('');
        setMenuOptions([]);
        setAddModalVisible(true);
    };

    const saveNewMenu = () => {
        const newItem: MenuItem = {
            id: Date.now().toString(),
            name: menuName || 'เมนูใหม่',
            price: Number(menuPrice) || 0,
            image: menuImage || 'https://www.w3schools.com/w3images/avatar2.png',
            options: menuOptions,
        };
        setMenuItems([newItem, ...menuItems]);
        setAddModalVisible(false);
    };

    // ---- แก้ไขเมนู ----
    const handleEditItem = (item: MenuItem) => {
        setEditingItem(item);
        setMenuName(item.name);
        setMenuPrice(item.price.toString());
        setMenuImage(item.image);
        setMenuOptions(item.options ? [...item.options] : []);
        setEditModalVisible(true);
    };

    const saveEdit = () => {
        if (!editingItem) return;
        const updatedItems = menuItems.map((item) =>
            item.id === editingItem.id
                ? { ...item, name: menuName, price: Number(menuPrice), image: menuImage, options: menuOptions }
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

    const addOption = () => setMenuOptions([...menuOptions, { name: '', price: 0 }]);

    const updateOption = (index: number, key: keyof MenuOption, value: string) => {
        const newOptions = [...menuOptions];

        if (key === "price") {
            newOptions[index].price = Number(value);
        } else {
            newOptions[index].name = value;
        }

        setMenuOptions(newOptions);
    };

    const removeOption = (index: number) => {
        const newOptions = [...menuOptions];
        newOptions.splice(index, 1);
        setMenuOptions(newOptions);
    };

    const renderMenuItem = ({ item }: { item: MenuItem }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemTop}>
                <Image source={{ uri: item.image }} style={styles.menuImage} />
                <View style={styles.itemInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuPrice}>{item.price} บาท</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditItem(item)}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            {item.options && item.options.length > 0 && (
                <View style={styles.optionContainer}>
                    {item.options.map((opt, index) => (
                        <Text key={index} style={styles.optionText}>
                            + {opt.name} {opt.price} บาท
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );

    // --- ฟอร์มที่ใช้ทั้งเพิ่มและแก้ไข ---
    const renderMenuForm = (onSave: () => void, onClose: () => void, title: string, showDelete?: boolean) => (
        <ScrollView style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TextInput
                style={styles.input}
                placeholder="ชื่อเมนู"
                value={menuName}
                onChangeText={setMenuName}
            />
            <TextInput
                style={styles.input}
                placeholder="ราคา"
                value={menuPrice}
                keyboardType="numeric"
                onChangeText={setMenuPrice}
            />
            <TextInput
                style={styles.input}
                placeholder="URL รูปภาพ"
                value={menuImage}
                onChangeText={setMenuImage}
            />

            <Text style={styles.sectionTitle}>ตัวเลือกเพิ่มเติม</Text>
            {menuOptions.map((opt, index) => (
                <View key={index} style={styles.optionRow}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="ชื่อ"
                        value={opt.name}
                        onChangeText={(text) => updateOption(index, 'name', text)}
                    />
                    <TextInput
                        style={[styles.input, { width: 80 }]}
                        placeholder="ราคา"
                        keyboardType="numeric"
                        value={opt.price.toString()}
                        onChangeText={(text) => updateOption(index, 'price', text)}
                    />
                    <TouchableOpacity onPress={() => removeOption(index)}>
                        <Text style={styles.removeOption}>ลบ</Text>
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
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
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.mainCard}>
                <Text style={styles.title}>เมนูทั้งหมด</Text>

                <TouchableOpacity style={styles.addButton} onPress={handleAddMenu}>
                    <Text style={styles.addButtonText}>+ เพิ่มเมนู</Text>
                </TouchableOpacity>

                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMenuItem}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />

                {/* Modal เพิ่มเมนู */}
                <Modal visible={addModalVisible} animationType="slide">
                    {renderMenuForm(saveNewMenu, () => setAddModalVisible(false), 'เพิ่มเมนู')}
                </Modal>

                {/* Modal แก้ไขเมนู */}
                <Modal visible={editModalVisible} animationType="slide">
                    {renderMenuForm(saveEdit, () => setEditModalVisible(false), 'แก้ไขเมนู', true)}
                </Modal>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    addButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    itemContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    itemTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
    itemInfo: { flex: 1 },
    menuName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    menuPrice: { fontSize: 14, color: '#555', marginTop: 4 },
    editButton: { backgroundColor: '#2196f3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    editText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    optionContainer: { marginTop: 10, paddingLeft: 82 },
    optionText: { fontSize: 13, color: '#888', marginTop: 2 },
    modalContainer: { flex: 1, padding: 20, backgroundColor: '#fff' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    removeOption: { color: 'red', marginLeft: 8 },
    addOptionButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    addOptionText: { color: '#fff', fontWeight: 'bold' },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#4caf50',
    },
    cancelButton: {
        backgroundColor: '#888',
    },
    deleteButton: {
        backgroundColor: '#f44336',
        marginTop: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
