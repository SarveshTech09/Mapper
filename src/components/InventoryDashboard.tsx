import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Calendar, MapPin, Thermometer } from 'lucide-react';

// Define types locally since we removed Supabase dependency
interface Product {
  id: string;
  product_name: string;
  brand_name: string | null;
  generic_name: string | null;
  category: string | null;
  sub_category: string | null;
  dosage_form: string | null;
  strength: string | null;
  base_pack_size: string | null;
  hsn_code: string | null;
  gst_percentage: number;
  schedule_type: string | null;
  prescription_required: boolean;
  storage_condition: string | null;
  has_variants: boolean;
  variant_type: string | null;
  manufacturer: string | null;
  drug_license_no: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Batch {
  id: string;
  product_id: string;
  variant_value: string | null;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  purchase_rate: number;
  mrp: number;
  gst_percentage: number;
  initial_quantity: number;
  current_stock_qty: number;
  warehouse_location: string | null;
  cold_storage: boolean;
  supplier_name: string | null;
  purchase_invoice_no: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductWithBatches extends Product {
  batches: Batch[];
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      // Load from localStorage since we removed Supabase dependency
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const storedBatches = JSON.parse(localStorage.getItem('batches') || '[]');

      const productsWithBatches = storedProducts.map((product: any) => ({
        ...product,
        batches: storedBatches.filter((batch: any) => batch.product_id === product.id)
      }));

      setProducts(productsWithBatches);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.brand_name && product.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.generic_name && product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTotalStock = (batches: Batch[]) => {
    return batches.reduce((sum, batch) => sum + batch.current_stock_qty, 0);
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= new Date();
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .gradient-badge {
          background: linear-gradient(135deg, #DD6B20 0%, #E53E3E 50%, #6B46C1 100%);
          background-size: 200% 200%;
          animation: gradientMove 3s ease infinite;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">
            Inventory Overview
          </h2>
          <p className="text-gray-600 mt-1">{products.length} products in inventory</p>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-3 pl-10 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
        />
        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 gradient-card rounded-2xl border-2 border-dashed border-orange-200/50 shadow-lg">
          <Package className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Start by adding products to your inventory'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const totalStock = getTotalStock(product.batches);
            const hasLowStock = totalStock < 10;

            return (
              <div
                key={product.id}
                className="gradient-card border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{product.product_name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.brand_name && (
                          <span className="text-sm text-gray-600">Brand: {product.brand_name}</span>
                        )}
                        {product.generic_name && (
                          <span className="text-sm text-gray-600">• Generic: {product.generic_name}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {product.strength && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.strength}
                          </span>
                        )}
                        {product.dosage_form && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.dosage_form}
                          </span>
                        )}
                        {product.prescription_required && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rx Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold ${hasLowStock ? 'text-red-600' : 'gradient-badge text-white px-3 py-1 rounded-lg'}`}>
                        {totalStock}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Total Stock</div>
                      {hasLowStock && (
                        <div className="flex items-center gap-1 text-red-600 text-xs mt-2 bg-red-50 px-2 py-1 rounded-lg inline-flex">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </div>
                      )}
                    </div>
                  </div>

                  {product.batches.length > 0 ? (
                    <div className="space-y-3 pt-4 border-t border-gray-100/50">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Batch Details</h4>
                      <div className="grid gap-3">
                        {product.batches.map((batch) => {
                          const expiringSoon = isExpiringSoon(batch.expiry_date);
                          const expired = isExpired(batch.expiry_date);

                          return (
                            <div
                              key={batch.id}
                              className={`p-4 rounded-xl border transition-all duration-300 ${
                                expired
                                  ? 'bg-red-50/50 border-red-200/50 shadow-sm'
                                  : expiringSoon
                                  ? 'bg-yellow-50/50 border-yellow-200/50 shadow-sm'
                                  : 'bg-white/50 border-gray-200/50 shadow-sm'
                              }`}
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Batch Number</div>
                                  <div className="font-medium text-gray-900">{batch.batch_number}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Current Stock</div>
                                  <div className="font-medium text-gray-900">{batch.current_stock_qty} units</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">MRP</div>
                                  <div className="font-medium text-gray-900">₹{batch.mrp.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Expiry Date
                                  </div>
                                  <div className={`font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                                    {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                    {expired && <span className="text-xs ml-1">(Expired)</span>}
                                    {expiringSoon && !expired && <span className="text-xs ml-1">(Expiring Soon)</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-100/50">
                                {batch.warehouse_location && (
                                  <div className="flex items-start gap-2 bg-white/30 p-2 rounded-lg">
                                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                                    <div>
                                      <div className="text-xs text-gray-600">Location</div>
                                      <div className="text-sm text-gray-900 font-medium">{batch.warehouse_location}</div>
                                    </div>
                                  </div>
                                )}
                                {batch.cold_storage && (
                                  <div className="flex items-start gap-2 bg-blue-50/30 p-2 rounded-lg">
                                    <Thermometer className="w-4 h-4 text-blue-500 mt-0.5" />
                                    <div>
                                      <div className="text-xs text-gray-600">Storage</div>
                                      <div className="text-sm text-blue-600 font-medium">Cold Storage</div>
                                    </div>
                                  </div>
                                )}
                                {batch.supplier_name && (
                                  <div className="bg-white/30 p-2 rounded-lg">
                                    <div className="text-xs text-gray-600">Supplier</div>
                                    <div className="text-sm text-gray-900 font-medium">{batch.supplier_name}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/30 rounded-xl border border-dashed border-gray-200/50">
                      <p className="text-sm text-gray-600">No batches added yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
