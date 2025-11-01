"use client";

import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/verify");
          setCurrentUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });

      const { token: newToken, user } = response.data;

      console.log("Token In fronendt : ", token);

      localStorage.setItem("token", newToken);

      document.cookie = `token=${newToken}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; secure; samesite=strict`;

      setToken(newToken);
      setCurrentUser(user);

      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
