import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          // If identity is an object, get username from it
          let username = 'User';
          if (typeof decoded.sub === 'object' && decoded.sub.username) {
            username = decoded.sub.username;
          } else if (decoded.username) {
            username = decoded.username;
          }
          setUser({ username });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { access_token, username: userUsername } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser({ username: userUsername });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Login failed' 
      };
    }
  };

  const register = async (username, password) => {
    try {
      await authAPI.register(username, password);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 