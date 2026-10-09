import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  role?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (token: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'unlost_user';

const getInitialCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.id || parsed._id) && parsed.email) {
        return {
          id: parsed.id || parsed._id,
          username: parsed.username || parsed.email.split('@')[0],
          email: parsed.email,
          is_admin: Boolean(parsed.is_admin || parsed.role === 'admin'),
          role: parsed.role || (parsed.is_admin ? 'admin' : 'user'),
          profilePicture: parsed.profilePicture
        };
      }
    }
  } catch (_) {}
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cachedUser = getInitialCachedUser();
  const [user, setUser] = useState<User | null>(cachedUser);
  // If we already have a cached user, we don't need to block UI with a full-screen loader
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data.authenticated && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id,
          username: data.user.username,
          email: data.user.email,
          is_admin: Boolean(data.user.is_admin || data.user.role === 'admin'),
          role: data.user.role,
          profilePicture: data.user.profilePicture,
        };
        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch (_) {}
      } else {
        setUser(null);
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch (_) {}
      }
    } catch (error) {
      console.error('Failed to verify session authentication status:', error);
      // Don't wipe cached user immediately on temporary network failure if offline
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
      if (response.ok && data.success && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id,
          username: data.user.username,
          email: data.user.email,
          is_admin: Boolean(data.user.is_admin || data.user.role === 'admin'),
          role: data.user.role,
          profilePicture: data.user.profilePicture,
        };
        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch (_) {}
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed. Please check credentials.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server is currently unreachable.' };
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id,
          username: data.user.username,
          email: data.user.email,
          is_admin: Boolean(data.user.is_admin || data.user.role === 'admin'),
          role: data.user.role,
          profilePicture: data.user.profilePicture,
        };
        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch (_) {}
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Google Login failed.' };
      }
    } catch (error) {
      console.error('Google Login error:', error);
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
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, registerUser, logout, checkAuth }}>
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
