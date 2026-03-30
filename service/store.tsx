import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://36392702-688e-41b5-a3e0-c23bd85e0b29.cloud.ce.kmitl.ac.th/api/v1";

// Postman working endpoint for menu create:
// POST /api/v1/menu
const MENU_CREATE_ENDPOINT = `${BASE_URL}/menu`;

// Backend may return URI with "localhost:9000/..." and we must replace it
// with this public base.
const MENU_URI_BASE = "http://36392702-688e-41b5-a3e0-c23bd85e0b29.cloud.ce.kmitl.ac.th/minio/ladqueue";

// Jenkins-like CSRF protection: "No valid crumb was included in the request"
// Response from /crumbIssuer/api/json looks like: { "crumb": "...." }
const CSRF_CRUMB_ISSUER_URL = (() => {
  // BASE_URL = ".../api/v1" -> base host = "..."
  const base = BASE_URL.split("/api/v1")[0];
  return `${base}/crumbIssuer/api/json`;
})();

const buildCookieHeaderFromSetCookie = (setCookieHeader: string): string => {
  // `set-cookie` header may include attributes; Cookie header expects `name=value; name2=value2`.
  // We take only `name=value` pairs (ignores attributes like Path/HttpOnly/Expires).
  const parts = setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/g) // split by comma that looks like "a=b, c=d"
    .map((p) => p.trim())
    .filter(Boolean);

  const kvPairs: string[] = [];
  for (const part of parts) {
    const match = part.match(/^([^=;]+)=([^;]+)/);
    if (match) kvPairs.push(`${match[1]}=${match[2]}`);
  }
  return kvPairs.join("; ");
};

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

// Normalize/resolve image URL returned by backend to public MinIO base.
// - Accepts absolute URLs, localhost URLs, or relative paths like "menu/abc.jpg"
// - Ensures final URL looks like: `${MENU_URI_BASE}/menu/abc.jpg`
export const resolveMenuImageUrl = (image?: string | null): string => {
    try {
        if (!image || typeof image !== "string") return "";
        const base = MENU_URI_BASE.replace(/\/+$/, "");
        // If absolute URL:
        if (/^https?:\/\//i.test(image)) {
            // Replace localhost host (with or without /ladqueue) to public base
            return image
                .replace(/localhost:9000\/ladqueue/gi, base)
                .replace(/localhost:9000/gi, base);
        }
        // Relative path:
        // Trim leading slashes and any leading "ladqueue/" to avoid duplication
        let path = image.replace(/^\/+/, "");
        path = path.replace(/^ladqueue\//i, "");
        return `${base}/${path}`;
    } catch {
        return image || "";
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
  
// Types for creating menu (multipart): { data: [ {...} ], image: <file> }
export interface CreateMenuDataItem {
    category_id: number;
    detail: string;
    name: string;
    options: any[]; // keep flexible because option shape depends on backend contract
    price: number;
}

export interface CreateMenuRequestPayload {
    data: CreateMenuDataItem[];
    imageUri?: string | null;
}

export interface CreateMenuResponse {
  URI: string;
}

// Create a new menu
export const CreateMenu = async (payload: CreateMenuRequestPayload) => {
    try {
        // Send multipart exactly like Postman: only `data` and `image`.
        // For CSRF crumb, we need cookies/session, but we still avoid Authorization
        // to prevent "multiple authentication types" errors.
        const headers: Record<string, string> = {
            Accept: "application/json",
        };

        // CSRF protection (Jenkins-like): must send a valid "crumb".
        // crumb requires a session cookie, so we reuse stored auth_cookies.
        const rawCookies = await AsyncStorage.getItem("auth_cookies");
        const cookieHeader = rawCookies
          ? buildCookieHeaderFromSetCookie(rawCookies)
          : "";

        let crumb: string | null = null;
        if (cookieHeader) {
          try {
            const crumbRes = await fetch(CSRF_CRUMB_ISSUER_URL, {
              method: "GET",
              headers: {
                Accept: "application/json",
                Cookie: cookieHeader,
              },
              credentials: "omit",
            });

            if (crumbRes.ok) {
              const crumbJson: any = await crumbRes.json();
              if (typeof crumbJson?.crumb === "string") crumb = crumbJson.crumb;
            }
          } catch {
            // If crumb fetch fails, POST will return 403; we surface that below.
          }
        }

        const credentials: RequestCredentials = "omit";
        if (cookieHeader) headers.Cookie = cookieHeader;
        if (crumb) {
          // Common header name for Jenkins CSRF crumb
          headers["Jenkins-Crumb"] = crumb;
          // Some servers also accept alternatives
          headers["X-CSRF-Token"] = crumb;
        }

        const formData = new FormData();

        // Postman in many cases sends `data` as an object (not array) even though
        // the spec you provided earlier uses an array. To be tolerant:
        // - if only 1 item, send object
        // - otherwise, send array
        const dataValue =
            payload.data.length === 1 ? payload.data[0] : payload.data;
        formData.append("data", JSON.stringify(dataValue));

        if (payload.imageUri) {
            const uri = payload.imageUri;
            const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
            const type =
                ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
            const name = `menu.${ext}`;

            // RN's FormData typing differs across TS setups; cast to satisfy TS.
            formData.append("image", { uri, type, name } as any);
        }

        const response = await fetch(MENU_CREATE_ENDPOINT, {
            method: "POST",
            headers,
            credentials,
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`สร้างเมนูไม่สำเร็จ: ${errText}`);
        }

        if (response.status === 204) return null as any;

        // Backend example response: { "URI": "..." }
        try {
          const json = (await response.json()) as Partial<CreateMenuResponse>;
          if (typeof json.URI === "string") {
            // Replace only the host part from "localhost:9000" to the real public base.
            json.URI = json.URI.replace(
              "localhost:9000",
              MENU_URI_BASE.replace(/\/+$/, "")
            );
          }
          return json as CreateMenuResponse;
        } catch {
          // Fallback: some runtimes may return non-json body.
          const text = await response.text();
          return { URI: text } as any;
        }
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

export interface PutPosTimeSlotPayload {
    id: string;
    interval_minutes: number;
    capacity: number;
    start_at: string; // HH:mm:ss
    end_at: string;   // HH:mm:ss
    is_active: boolean;
}

// Update TimeSlot configuration for POS
export const PutPosTimeSlot = async (payload: PutPosTimeSlotPayload) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Pos/Config/TimeSlot`, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`อัปเดต TimeSlot ไม่สำเร็จ: ${errText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) return null as any;
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดขณะอัปเดต TimeSlot (PUT):', error);
        throw error;
    }
};

// -------- POS (store) info --------
export interface PosInfo {
    Name: string;
    BranchType: string;
    Categories: any; // backend may return null or array; keep flexible
    Phone: string;
}

export const GetPosInfo = async (): Promise<PosInfo> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Pos`, {
            method: "GET",
            headers,
            credentials: "include",
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ไม่สามารถดึงข้อมูลร้าน (POS) ได้: ${errText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดขณะดึงข้อมูล POS:', error);
        throw error;
    }
};

export interface PutPosPayload {
    name: string;
    phone: string;
    type: "mobile" | "fixed";
}

export const PutPosInfo = async (payload: PutPosPayload) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/Pos`, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`อัปเดตข้อมูลร้าน (POS) ไม่สำเร็จ: ${errText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (response.status === 204) return null as any;
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        const text = await response.text();
        return (text && text.length > 0 ? text : null) as any;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะอัปเดตข้อมูล POS:", error);
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
        const response = await fetch(`${BASE_URL}/Pos/Config/TimeSlot`, {
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

// -------- Location (POS) --------
export interface PostPosLocationPayload {
  lat: number;
  lng: number;
  province: number;
}

export const PostPosLocation = async (payload: PostPosLocationPayload) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/Location/Pos`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`บันทึกตำแหน่งร้านไม่สำเร็จ: ${errText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (response.status === 204) return null as any;
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return (text && text.length > 0 ? text : null) as any;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดขณะบันทึกตำแหน่งร้าน (POST /Location/Pos):', error);
    throw error;
  }
};

// GET Location (POS)
export interface GetPosLocationResponse {
  Lat: number;
  Lng: number;
}

export const GetPosLocation = async (branchId: string): Promise<GetPosLocationResponse | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/Location/Pos/${branchId}`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ดึงตำแหน่งร้านไม่สำเร็จ: ${errText}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดขณะดึงตำแหน่งร้าน (GET /Location/Pos/:id):', error);
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