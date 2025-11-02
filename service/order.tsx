const BASE_URL = "http://10.240.68.239:8080/api/v1";

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