import React, { ReactNode } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = React.useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const api = (await import('../api/client')).default;
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    try {
      const api = (await import('../api/client')).default;
      const response = await api.post('/auth/register', {
        email,
        name,
        password,
        confirmPassword,
      });
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
