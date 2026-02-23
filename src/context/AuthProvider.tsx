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
  loading: boolean;
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
  const [loading, setLoading] = useState<boolean>(true);

  // Load from localStorage on first render
  useEffect(() => {
    console.log('AuthProvider: Loading auth state from localStorage');
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    console.log('AuthProvider: Found stored token:', !!storedToken);
    console.log('AuthProvider: Token length:', storedToken?.length);
    console.log('AuthProvider: Found stored user:', !!storedUser);
    console.log('AuthProvider: User data:', storedUser);

    if (storedToken) {
      // Check if token is expired (if it's a JWT)
      try {
        const tokenParts = storedToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          console.log('AuthProvider: Token payload:', payload);
          console.log('AuthProvider: Token expires at:', payload.exp);
          console.log('AuthProvider: Current time:', now);
          
          if (payload.exp && payload.exp < now) {
            console.log('AuthProvider: Token expired, clearing auth');
          } else {
            setToken(storedToken);
            console.log('AuthProvider: Token set from localStorage');
          }
        } else {
          // Not a JWT, just set the token
          setToken(storedToken);
          console.log('AuthProvider: Token set from localStorage (not JWT)');
        }
      } catch (e) {
        console.error('AuthProvider: Error parsing token:', e);
      }
    }

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('AuthProvider: User set from localStorage:', userData);
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);      
      }
    }
    
    // Set loading to false after checking localStorage
    console.log('AuthProvider: Setting loading to false');
    setLoading(false);
  }, []);

  const login = (accessToken: string, userData: User) => {
    console.log('AuthProvider: Logging in user:', userData);
    setToken(accessToken);
    setUser(userData);
    setLoading(false);

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log('AuthProvider: Auth data saved to localStorage');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setLoading(false);

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
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