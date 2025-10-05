// services/otpService.ts
const BASE_URL = "http://140.245.21.202:8080/api/v1";

export const sendOtp = async (phone: string) => {
  try {
    const response = await fetch(`${BASE_URL}/Otp/Request`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ส่ง OTP ไม่สำเร็จ: ${errText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const verifyPhone = async (phone: string, otp: string) => {
  try {
    const response = await fetch(`${BASE_URL}/Auth/Seller/Verify`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ยืนยัน OTP ไม่สำเร็จ: ${errText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
