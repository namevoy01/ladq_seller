import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface JwtPayload {
  id?: string;
  role?: string;
  branch_id?: string;
  merchant_id?: string;  // ใช้ snake_case ตาม JWT
  iss?: string;
  exp?: number;
  merchantId?: string;   // รองรับ camelCase ด้วย
  userId?: string;
  phone?: string;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  getMerchantId: () => string | null;
  getUserInfo: () => JwtPayload | null;
  getUserId: () => string | null;
  getBranchId: () => string | null;
  getRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app start
    checkStoredToken();
  }, []);

  const checkStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      console.log('Stored token from AsyncStorage:', storedToken);
      if (storedToken) {
        setToken(storedToken);
        // ทดสอบ decode token ทันที
        const isJWT = storedToken.split('.').length === 3;
        console.log('Stored token is JWT format:', isJWT);
        if (isJWT) {
          try {
            const decoded = jwtDecode<JwtPayload>(storedToken);
            console.log('Stored token decoded payload:', decoded);
            console.log('Stored token merchant_id:', decoded.merchant_id);
          } catch (error) {
            console.error('Error decoding stored token:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string) => {
    try {
      console.log('Login: storing new token:', newToken);
      await AsyncStorage.setItem('auth_token', newToken);
      setToken(newToken);
      
      // ทดสอบ decode token ใหม่
      const isJWT = newToken.split('.').length === 3;
      console.log('Login: new token is JWT format:', isJWT);
      if (isJWT) {
        try {
          const decoded = jwtDecode<JwtPayload>(newToken);
          console.log('Login: new token decoded payload:', decoded);
          console.log('Login: new token merchant_id:', decoded.merchant_id);
        } catch (error) {
          console.error('Login: Error decoding new token:', error);
        }
      }
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  const getMerchantId = (): string | null => {
    if (!token) {
      console.log('No token available');
      return null;
    }
    
    console.log('Current token:', token);
    
    // Check if token is a JWT (has 3 parts separated by dots)
    const isJWT = token.split('.').length === 3;
    console.log('Is JWT format:', isJWT);
    
    if (!isJWT) {
      // Handle session token format: session_timestamp_phone
      if (token.startsWith('session_')) {
        console.log('Using session token, merchantId not available in session token');
        return null;
      }
      console.error('Invalid token format');
      return null;
    }
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Decoded JWT payload:', decoded);
      console.log('MerchantId from JWT (camelCase):', decoded.merchantId);
      console.log('Merchant_id from JWT (snake_case):', decoded.merchant_id);
      
      // ลองหา merchantId ทั้ง camelCase และ snake_case
      const merchantId = decoded.merchantId || decoded.merchant_id;
      console.log('Final merchantId:', merchantId);
      
      return merchantId || null;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  };

  const getUserInfo = (): JwtPayload | null => {
    if (!token) return null;
    
    // Check if token is a JWT (has 3 parts separated by dots)
    const isJWT = token.split('.').length === 3;
    
    if (!isJWT) {
      // Handle session token format: session_timestamp_phone
      if (token.startsWith('session_')) {
        const parts = token.split('_');
        if (parts.length >= 3) {
          return {
            phone: parts.slice(2).join('_'), // In case phone has underscores
            tokenType: 'session'
          };
        }
      }
      return null;
    }
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  };

  const getUserId = (): string | null => {
    if (!token) return null;
    
    const isJWT = token.split('.').length === 3;
    if (!isJWT) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('User ID from JWT:', decoded.id);
      return decoded.id || null;
    } catch (error) {
      console.error('Error decoding JWT token for user ID:', error);
      return null;
    }
  };

  const getBranchId = (): string | null => {
    if (!token) return null;
    
    const isJWT = token.split('.').length === 3;
    if (!isJWT) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Branch ID from JWT:', decoded.branch_id);
      return decoded.branch_id || null;
    } catch (error) {
      console.error('Error decoding JWT token for branch ID:', error);
      return null;
    }
  };

  const getRole = (): string | null => {
    if (!token) return null;
    
    const isJWT = token.split('.').length === 3;
    if (!isJWT) return null;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Role from JWT:', decoded.role);
      return decoded.role || null;
    } catch (error) {
      console.error('Error decoding JWT token for role:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
    getMerchantId,
    getUserInfo,
    getUserId,
    getBranchId,
    getRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
