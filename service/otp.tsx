// services/otpService.ts
const BASE_URL = "http://36392702-688e-41b5-a3e0-c23bd85e0b29.cloud.ce.kmitl.ac.th/api/v1";

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
        if (!match) continue;

        const candidate = match[1];
        // Only accept real JWT: should have 3 segments separated by "."
        const isJWT = typeof candidate === "string" && candidate.split(".").length === 3;
        if (!isJWT) continue;

        console.log("JWT Token extracted from cookie:", candidate);
        result.jwtToken = candidate;
        break;
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
};
