import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (userData: SignupData) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  university?: string;
  major?: string;
  year?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have an active session with the server
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include cookies in request
        });

        if (response.ok) {
          const result = await response.json();
          setUser(result.user);
        } else {
          // No valid session, clear any stale localStorage data
          localStorage.removeItem("quill_user");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("quill_user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in request
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const result = await response.json();
      const userData = result.user;
      
      setUser(userData);
      // Keep localStorage as backup for UI consistency
      localStorage.setItem("quill_user", JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData: SignupData): Promise<User> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in request
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      const result = await response.json();
      const newUser = result.user;
      
      setUser(newUser);
      // Keep localStorage as backup for UI consistency
      localStorage.setItem("quill_user", JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies in request
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("quill_user");
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
