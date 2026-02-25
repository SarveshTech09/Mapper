import { useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import InventoryDataEntry from './components/InventoryDataEntry';
import ProductDataEntry from './components/ProductDataEntry';
import InventoryDashboard from './components/InventoryDashboard';
import { useAuth } from './context/AuthProvider';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { token, logout, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          console.warn('App: token rejected by server — logging out');
          logout();
        }
      } catch (error) {
        console.error('App: error validating token:', error);
      }
    };

    validateToken();
  }, [token, logout]);

  if (loading || !initialized) return <LoadingScreen />;

  const handleLoginSuccess = () => navigate('/');

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<InventoryDashboard />} />
        <Route path="inventory" element={<InventoryDataEntry />} />
        <Route path="products" element={<ProductDataEntry />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
