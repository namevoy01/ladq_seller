import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://10.240.68.239:8080/api/v1";

const getAuthHeaders = async () => {
    try {
        const token = await AsyncStorage.getItem('auth_token');
        const cookies = await AsyncStorage.getItem('auth_cookies');
        
        const headers: Record<string, string> = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };
        
        // Add token if available
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        // Add cookies if available
        if (cookies) {
            headers.Cookie = cookies;
        }
        
        return headers;
    } catch (error) {
        console.error('Error getting auth headers:', error);
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
        };
    }
};

export const Merchant = async (storeData: {
    branch_type: string;
    merchant_type: string;
    name: string;
    phone: string;
}) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Store/Create`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(storeData),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`สร้างร้านค้าไม่สำเร็จ: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};


export const MenuAll = async (merchantId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/Menu/All/${merchantId}`, {
        method: "GET",
        headers,
        credentials: "include",
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ไม่สามารถดึงเมนูได้: ${errText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะดึงเมนู:", error);
      throw error;
    }
  };
  
// Fetch all menu categories
export interface MenuCategory {
    id: number;
    name: string;
    sub_id: number;
    is_active: boolean;
}

export const MenuCategories = async (): Promise<MenuCategory[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/Menu/Category`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ไม่สามารถดึงหมวดหมู่ได้: ${errText}`);
      }

      const data = await response.json();
      return data as MenuCategory[];
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะดึงหมวดหมู่:", error);
      throw error;
    }
};
  
// Types for creating menu
export interface CreateMenuOptionSub {
    display: number;
    is_active: boolean;
    is_default: boolean;
    name: string;
    price: number;
}

export interface CreateMenuOption {
    display: number;
    is_active: boolean;
    is_required: boolean;
    max: number;
    min: number;
    name: string;
    subs: CreateMenuOptionSub[];
    type: string;
}

export interface CreateMenuPayload {
    category_id: number;
    detail: string;
    image: string;
    name: string;
    options?: CreateMenuOption[]; // optional; default to [] when sending
    price: number;
}

// Create a new menu
export const CreateMenu = async (payload: CreateMenuPayload) => {
    try {
        const headers = await getAuthHeaders();
        const bodyToSend = {
            ...payload,
            options: payload.options ?? [],
        };

        const response = await fetch(`${BASE_URL}/Menu`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(bodyToSend),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`สร้างเมนูไม่สำเร็จ: ${errText}`);
        }

        // Safely handle empty or non-JSON responses
        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) {
            return null as any;
        }
        if (contentType.includes("application/json")) {
            try {
                return await response.json();
            } catch {
                return null as any;
            }
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะสร้างเมนู:", error);
        throw error;
    }
};

// Types for updating menu
export interface UpdateMenuOptionSub {
    id?: string; // empty string for new sub options
    name: string;
    price: number;
    is_default: boolean;
    display: boolean; // เปลี่ยนกลับเป็น boolean
    is_active: boolean;
}

export interface UpdateMenuOption {
    id?: string; // empty string for new option groups
    name: string;
    type: string;
    is_required: boolean;
    min: number;
    max: number;
    display: boolean; // เปลี่ยนกลับเป็น boolean
    is_active: boolean;
    sub_options: UpdateMenuOptionSub[];
}

export interface UpdateMenuPayload {
    id: string;
    category_id: number;
    name: string;
    detail: string;
    image: string;
    price: number;
    options: UpdateMenuOption[];
}

// Update an existing menu
export const UpdateMenu = async (payload: UpdateMenuPayload) => {
    try {
        const headers = await getAuthHeaders();
        // Convert boolean display flags to numeric (int32) expected by backend
        const bodyToSend = {
            ...payload,
            options: (payload.options || []).map((group) => ({
                ...group,
                display: group.display ? 1 : 0,
                sub_options: (group.sub_options || []).map((sub) => ({
                    ...sub,
                    display: sub.display ? 1 : 0,
                })),
            })),
        };

        const response = await fetch(`${BASE_URL}/Menu`, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(bodyToSend),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`แก้ไขเมนูไม่สำเร็จ: ${errText}`);
        }

        // Safely handle empty or non-JSON responses
        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) {
            return null as any;
        }
        if (contentType.includes("application/json")) {
            try {
                return await response.json();
            } catch {
                return null as any;
            }
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะแก้ไขเมนู:", error);
        throw error;
    }
};
  
export const GetTimeSlot = async (branchId: string) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Branch/Config/TimeSlot/All/${branchId}`, {
            method: "GET",
            headers,
            credentials: "include",
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ไม่สามารถดึง TimeSlot ได้: ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดขณะดึง TimeSlot:', error);
        throw error;
    }
  };

export interface PostTimeSlotPayload {
    interval_minutes: number;
    capacity: number;
    start_at: string; // HH:mm:ss
    end_at: string;   // HH:mm:ss
}

export const PostTimeSlot = async (payload: PostTimeSlotPayload) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Branch/Config/TimeSlot`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`บันทึก TimeSlot ไม่สำเร็จ: ${errText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) return null as any;
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดขณะบันทึก TimeSlot:', error);
        throw error;
    }
};

export interface PostCreateMerchantPayload {
    branch_type: string;
    merchant_type: number[];
    name: string;
    phone: string;
}

export const PostCreateMerchant = async (payload: PostCreateMerchantPayload) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Merchant`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`สร้างร้านค้าไม่สำเร็จ: ${errText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) return null as any;
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดขณะสร้างร้านค้า:', error);
        throw error;
    }
};