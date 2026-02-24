import { useState, useEffect } from 'react';
import { Package, ClipboardList, Boxes, LogOut } from 'lucide-react';
import InventoryDashboard from './components/InventoryDashboard';
import ProductDataEntry from './components/ProductDataEntry';
import InventoryDataEntry from './components/InventoryDataEntry';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthProvider';

type Tab = 'dashboard' | 'product-entry' | 'inventory-entry';

function App() {
  const { token, logout, loading, initialized } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('inventory-entry');

  // Fetch user profile on token change
  useEffect(() => {
    console.log('App: Token changed to:', token);
    if (token) {
      const fetchUserProfile = async () => {
        try {
          console.log('App: Fetching user profile with token:', token.substring(0, 20) + '...');
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('User profile fetched:', data);
          } else {
            console.error('Failed to fetch user profile:', response.status);
            // If token is invalid, logout the user
            if (response.status === 401) {
              console.log('Token is invalid, logging out');
              logout();
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [token, logout]);

  const handleLogout = () => {
    logout();
  };

  const handleLoginSuccess = () => {
    // Login handled by AuthProvider context
  };

  // Show loading state while checking auth
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div key={`${!!token}-${initialized}`} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management System</h1>
                <p className="text-gray-600">Product stock & inventory onboarding tool</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('inventory-entry')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'inventory-entry'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5" />
                Batch Data Entry
              </button>
              <button
                onClick={() => setActiveTab('product-entry')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'product-entry'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Boxes className="w-5 h-5" />
                Product Master Entry
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                Dashboard View
              </button>
            </nav>
          </div>

          <div className="p-6 md:p-8 relative" style={{ minHeight: '500px' }}>
            <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-200 ${activeTab === 'dashboard' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <InventoryDashboard />
            </div>
            <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-200 ${activeTab === 'product-entry' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <ProductDataEntry />
            </div>
            <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-200 ${activeTab === 'inventory-entry' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <InventoryDataEntry />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Healthcare Inventory Management System</p>
        </div>
      </div>
    </div>
  );
}

export default App;
