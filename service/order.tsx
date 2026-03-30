const BASE_URL = "http://36392702-688e-41b5-a3e0-c23bd85e0b29.cloud.ce.kmitl.ac.th/api/v1";

export const NewOrder = async (phone: string) => {
 
};

export const getNewOrdersPagination = async (offset: number = 0, limit: number = 10) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/All/New/Pagination?offset=${offset}&limit=${limit}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching new orders:', error);
    throw error;
  }
};

// ออเดอร์ทั้งหมดในคิว (Queue)
export const getAllQueueOrdersPagination = async (offset: number = 0, limit: number = 10) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/All/Queue/Pagination?offset=${offset}&limit=${limit}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all queue orders:', error);
    throw error;
  }
};

export const getCompleteOrdersPagination = async (offset: number = 0, limit: number = 10) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/All/Complete/Pagination?offset=${offset}&limit=${limit}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching complete orders:', error);
    throw error;
  }
};

export const getCookOrders = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Cook`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // ถ้าเป็น error 500 หรือไม่มีข้อมูล ให้ return empty array
    if (response.status === 500 || response.status === 404) {
      console.warn('No cook orders available or server error:', response.status);
      return [];
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // ถ้า error เกี่ยวกับ network หรือ server ให้ return empty array แทน
    console.error('Error fetching cook orders:', error);
    
    // ตรวจสอบว่า error message มี "500" หรือไม่
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('500') || errorMessage.includes('network')) {
      return [];
    }
    
    throw error;
  }
};

export const completeOrder = async (orderId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Complete`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // ตรวจสอบ response text ก่อน parse JSON
    const responseText = await response.text();
    
    // ถ้า response body ว่างเปล่า return success
    if (!responseText || responseText.trim() === '') {
      return { success: true };
    }

    // พยายาม parse JSON ถ้ามีเนื้อหา
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      // ถ้า parse ไม่ได้ แต่ status ok ก็ return success
      console.warn('Response is not JSON, but status is OK:', responseText);
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
};

export const closeOrder = async (orderId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Close`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // ตรวจสอบ response text ก่อน parse JSON
    const responseText = await response.text();
    
    // ถ้า response body ว่างเปล่า return success
    if (!responseText || responseText.trim() === '') {
      return { success: true };
    }

    // พยายาม parse JSON ถ้ามีเนื้อหา
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      // ถ้า parse ไม่ได้ แต่ status ok ก็ return success
      console.warn('Response is not JSON, but status is OK:', responseText);
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('Error closing order:', error);
    throw error;
  }
};

export const cancelOrder = async (orderId: string, branchId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Cancel`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          branch_id: branchId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return { success: true };
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.warn('Cancel response is not JSON, but status is OK:', responseText);
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
};

// รับออเดอร์ใหม่
export const acceptOrder = async (id: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Accept`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, message: text };
    }
  } catch (error) {
    console.error('Error accepting order:', error);
    throw error;
  }
};

// อนุมัติ/แก้ไขออเดอร์ใหม่ (Approve)
export interface ApproveOrderPayload {
  id: string; // order_id
  menus: Array<{ id: string; isAvailable: boolean }>;
}

export const approveOrder = async (payload: ApproveOrderPayload) => {
  try {
    const response = await fetch(
      `${BASE_URL}/Order/Pos/Approve`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }
    const resText = await response.text();
    if (!resText || resText.trim() === '') return { success: true };
    try {
      return JSON.parse(resText);
    } catch {
      return { success: true, message: resText };
    }
  } catch (error) {
    console.error('Error approving order:', error);
    throw error;
  }
};