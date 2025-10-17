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
  
  