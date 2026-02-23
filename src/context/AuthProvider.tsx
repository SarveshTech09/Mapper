import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  id: number;
  name: string;
  mobile: string;
  // Add more fields based on your API response
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load from localStorage on first render
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (accessToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};