import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Boxes, LogOut } from 'lucide-react';
import InventoryDashboard from './InventoryDashboard';
import ProductDataEntry from './ProductDataEntry';
import InventoryDataEntry from './InventoryDataEntry';
import { useAuth } from '../context/AuthProvider';

type Tab = 'dashboard' | 'product-entry' | 'inventory-entry';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('inventory-entry');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
                onClick={() => {
                  setActiveTab('inventory-entry');
                  navigate('/inventory');
                }}
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
                onClick={() => {
                  setActiveTab('product-entry');
                  navigate('/products');
                }}
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
                onClick={() => {
                  setActiveTab('dashboard');
                  navigate('/');
                }}
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
};

export default Dashboard;