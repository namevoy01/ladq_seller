// services/otpService.ts
const BASE_URL = "http://10.240.68.239:8080/api/v1";

export const sendOtp = async (phone: string) => {
  try {
    const response = await fetch(`${BASE_URL}/Otp/Request`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ส่ง OTP ไม่สำเร็จ: ${errText}`);
    }

    const result = await response.json();
    console.log("Send OTP Response:", result);
    return result;
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
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ยืนยัน OTP ไม่สำเร็จ: ${errText}`);
    }

    const result = await response.json();
    console.log("OTP Verify Response:", result);
    
    // Check if there are any cookies in the response headers
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log("Cookies received:", cookies);
      result.cookies = cookies;
      
      // Extract JWT token from cookies (try different cookie names)
      const cookiePatterns = [
        /jwt=([^;]+)/,
        /token=([^;]+)/,
        /auth=([^;]+)/,
        /session=([^;]+)/,
        /access_token=([^;]+)/
      ];
      
      for (const pattern of cookiePatterns) {
        const match = cookies.match(pattern);
        if (match) {
          const jwtToken = match[1];
          console.log("JWT Token extracted from cookie:", jwtToken);
          result.jwtToken = jwtToken;
          break;
        }
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
};
