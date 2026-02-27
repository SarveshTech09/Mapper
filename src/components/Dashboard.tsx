import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Package, ClipboardList, Boxes, LogOut, TrendingUp, AlertTriangle, Calendar, BarChart3, Plus, ShoppingCart, Database, Archive, Info } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useEffect, useState } from 'react';
import useBrands from '../hooks/useBrands';
import useProductsByBrand from '../hooks/useProductsByBrand';

const NAV_TABS = [
  { path: '/',          label: 'Dashboard View',       icon: ClipboardList },
  { path: '/inventory', label: 'Batch Data Entry',     icon: Package       },
  { path: '/products',  label: 'Product Master Entry', icon: Boxes         },
];

interface Product {
  id: string;
  product_name: string;
  brand_name: string | null;
  category: string | null;
  sub_category: string | null;
  prescription_required: boolean;
  status: string;
  created_at: string;
}

interface Batch {
  id: string;
  product_id: string;
  batch_number: string;
  current_stock_qty: number;
  mrp: number;
  expiry_date: string | null;
  cold_storage: boolean;
  warehouse_location: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  
  const { brands, brandsLoading, brandsError, fetchBrands } = useBrands();
  const { productsError, fetchProducts } = useProductsByBrand();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (brands.length > 0 && !brandsLoaded) {
      loadAllProducts();
    }
  }, [brands, brandsLoaded]);

  // Retry loading brands when user data becomes available
  useEffect(() => {
    const retryBrands = async () => {
      if (!brandsLoaded && brands.length === 0 && !brandsError) {
        try {
          await fetchBrands();
          setBrandsLoaded(true);
        } catch (err) {
          console.warn('Retry brands failed:', err);
        }
      }
    };
    
    // Retry after a short delay
    const timer = setTimeout(retryBrands, 2000);
    return () => clearTimeout(timer);
  }, [brandsError, brandsLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load batches from localStorage first (existing functionality)
      const storedBatches = JSON.parse(localStorage.getItem('batches') || '[]');
      setBatches(storedBatches);
      
      // Try to fetch brands, but don't block if user data isn't ready
      try {
        await fetchBrands();
        setBrandsLoaded(true);
      } catch (err) {
        console.warn('Could not load brands yet:', err);
        // Continue without brands for now
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      const allProducts: Product[] = [];
      
      // Fetch products for each brand
      for (const brand of brands) {
        try {
          const productNames = await fetchProducts({ brand_name: brand });
          
          // Create product objects from names
          productNames.forEach((name, index) => {
            allProducts.push({
              id: `${brand}-${index}`,
              product_name: name,
              brand_name: brand,
              category: 'General', // Default category
              sub_category: 'Unknown',
              prescription_required: false,
              status: 'active',
              created_at: new Date().toISOString()
            });
          });
        } catch (err) {
          console.error(`Error fetching products for brand ${brand}:`, err);
        }
      }
      
      setProducts(allProducts);
    } catch (err) {
      console.error('Error loading all products:', err);
    }
  };

  // Calculate dashboard metrics
  const totalProducts = products.length;
  const totalBatches = batches.length;
  const totalStockValue = batches.reduce((sum, batch) => sum + (batch.current_stock_qty * batch.mrp), 0);
  
  // Low stock items (less than 10 units)
  const lowStockItems = batches.filter(batch => batch.current_stock_qty < 10).length;
  
  // Expiring soon (within 3 months)
  const expiringSoon = batches.filter(batch => {
    if (!batch.expiry_date) return false;
    const expiry = new Date(batch.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= new Date();
  }).length;
  
  // Expired items
  const expiredItems = batches.filter(batch => {
    if (!batch.expiry_date) return false;
    return new Date(batch.expiry_date) < new Date();
  }).length;
  
  // Categories breakdown
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];
  
  // Cold storage items
  const coldStorageItems = batches.filter(batch => batch.cold_storage).length;
  
  // Recently added (last 7 days)
  const recentProducts = products.filter(product => {
    const created = new Date(product.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;
  
  const recentBatches = batches.filter(batch => {
    const created = new Date(batch.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;
  
  // Loading state combining all data sources
  const isLoading = loading || brandsLoading;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ComponentType<{ className?: string }>; 
    color?: string; 
    trend?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
    };
    
    return (
      <div className="gradient-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    color = 'blue' 
  }: { 
    title: string; 
    description: string; 
    icon: React.ComponentType<{ className?: string }>; 
    onClick: () => void; 
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
    };
    
    return (
      <button
        onClick={onClick}
        className={`w-full gradient-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/30 text-left group`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            <div className="mt-3 text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
              Click to start →
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading dashboard data...</p>
        </div>
      );
    }
    
    // Show error only if it's a real error, not just waiting for data
    const showError = (brandsError && !brandsError.includes('Waiting for user data') && !brandsError.includes('User data not available')) || 
                     (productsError && !productsError.includes('Waiting for user data'));
    
    if (showError) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{brandsError || productsError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Summary Stats */}
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent mb-6">
            Dashboard Overview
          </h2>
          
          {/* Show info message when no data is available yet */}
          {(products.length === 0 && batches.length === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Getting Started</p>
                  <p className="text-blue-600 text-sm">Add products and batches to see dashboard metrics. The dashboard will populate automatically once you add inventory data.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Products" 
              value={totalProducts} 
              icon={Boxes} 
              color="blue" 
              trend="+12% from last month"
            />
            <StatCard 
              title="Total Batches" 
              value={totalBatches} 
              icon={Package} 
              color="green" 
              trend="+8% from last month"
            />
            <StatCard 
              title="Stock Value" 
              value={`₹${totalStockValue.toLocaleString()}`} 
              icon={ShoppingCart} 
              color="purple" 
              trend="↑ 15% increase"
            />
            <StatCard 
              title="Categories" 
              value={categories.length} 
              icon={Database} 
              color="orange" 
            />
          </div>
        </div>

        {/* Alerts Section */}
        {(lowStockItems > 0 || expiringSoon > 0 || expiredItems > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alerts & Warnings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lowStockItems > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Low Stock Items</p>
                      <p className="text-red-600 text-sm">{lowStockItems} items below 10 units</p>
                    </div>
                  </div>
                </div>
              )}
              
              {expiringSoon > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-800">Expiring Soon</p>
                      <p className="text-yellow-600 text-sm">{expiringSoon} items in 3 months</p>
                    </div>
                  </div>
                </div>
              )}
              
              {expiredItems > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Archive className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Expired Items</p>
                      <p className="text-red-600 text-sm">{expiredItems} items past expiry</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActionCard
              title="Add New Product"
              description="Create a new product master entry"
              icon={Plus}
              color="green"
              onClick={() => navigate('/products')}
            />
            <QuickActionCard
              title="Add Batch Inventory"
              description="Add new batch data for existing products"
              icon={Package}
              color="blue"
              onClick={() => navigate('/inventory')}
            />
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="gradient-card rounded-2xl p-6 shadow-lg border border-white/30">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Storage Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                <span className="text-gray-700">Cold Storage Items</span>
                <span className="font-semibold text-blue-600">{coldStorageItems}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                <span className="text-gray-700">Normal Storage Items</span>
                <span className="font-semibold text-green-600">{batches.length - coldStorageItems}</span>
              </div>
            </div>
          </div>

          <div className="gradient-card rounded-2xl p-6 shadow-lg border border-white/30">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                <span className="text-gray-700">New Products (7 days)</span>
                <span className="font-semibold text-purple-600">{recentProducts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                <span className="text-gray-700">New Batches (7 days)</span>
                <span className="font-semibold text-orange-600">{recentBatches}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        {categories.length > 0 && (
          <div className="gradient-card rounded-2xl p-6 shadow-lg border border-white/30">
            <h3 className="font-semibold text-gray-900 mb-4">Categories Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => {
                const categoryProducts = products.filter(p => p.category === category).length;
                const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-yellow-100', 'bg-pink-100'];
                const textColors = ['text-blue-800', 'text-green-800', 'text-purple-800', 'text-orange-800', 'text-yellow-800', 'text-pink-800'];
                
                return (
                  <div 
                    key={category} 
                    className={`p-4 rounded-xl ${colors[index % colors.length]} border border-white/50`}
                  >
                    <p className={`font-semibold ${textColors[index % textColors.length]} mb-1`}>{category}</p>
                    <p className="text-2xl font-bold text-gray-900">{categoryProducts}</p>
                    <p className="text-xs text-gray-600 mt-1">products</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-btn {
          background: linear-gradient(135deg, #DD6B20 0%, #E53E3E 50%, #6B46C1 100%);
          background-size: 200% 200%;
          animation: gradientMove 4s ease infinite;
        }
        .gradient-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(221, 107, 32, 0.3);
        }
        .card-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">
                  Inventory Management System
                </h1>
                <p className="text-gray-600 mt-1">Product stock &amp; inventory onboarding tool</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="gradient-btn flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="card-glass rounded-2xl shadow-xl border border-white/30 overflow-hidden backdrop-blur-sm">
          <div className="border-b border-gray-200/50 bg-white/50">
            <nav className="flex -mb-px">
              {NAV_TABS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                      isActive
                        ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                        : 'border-transparent text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6 md:p-8 bg-white/30">
            {location.pathname === '/' ? renderDashboardContent() : <Outlet />}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <p className="font-medium">Healthcare Inventory Management System</p>
          <p className="text-xs text-gray-500 mt-1">Powered by Waqin</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;