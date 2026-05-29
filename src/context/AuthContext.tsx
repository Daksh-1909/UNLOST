import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUser({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          is_admin: data.user.is_admin,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to verify session authentication status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed. Please check credentials.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server is currently unreachable.' };
    }
  };

  const registerUser = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Server is currently unreachable.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
