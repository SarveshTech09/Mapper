import { useState, useEffect } from 'react';
import { AlertCircle, Check, Search } from 'lucide-react';

// Define Product type locally since we removed Supabase dependency
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

interface BatchFormProps {
  onSuccess: () => void;
}

export default function BatchForm({ onSuccess }: BatchFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    purchase_rate: '',
    mrp: '',
    gst_percentage: '12',
    initial_quantity: '',
    warehouse_location: '',
    cold_storage: false,
    supplier_name: '',
    purchase_invoice_no: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    // Mock data since we removed Supabase dependency
    try {
      // In a real application without backend, you might load from localStorage or props
      const mockProducts: Product[] = [
        {
          id: '1',
          product_name: 'Paracetamol 500mg',
          brand_name: 'Crocin',
          generic_name: 'Acetaminophen',
          category: 'Pain Relief',
          sub_category: 'Tablets',
          dosage_form: 'Tablet',
          strength: '500mg',
          base_pack_size: '10 tablets',
          hsn_code: '292429',
          gst_percentage: 12,
          schedule_type: 'OTC',
          prescription_required: false,
          storage_condition: 'Store below 30°C',
          has_variants: false,
          variant_type: null,
          manufacturer: 'GSK',
          drug_license_no: 'DL-123456',
          barcode: '1234567890123',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          product_name: 'Aspirin 75mg',
          brand_name: 'Ecosprin',
          generic_name: 'Acetylsalicylic Acid',
          category: 'Cardiovascular',
          sub_category: 'Tablets',
          dosage_form: 'Tablet',
          strength: '75mg',
          base_pack_size: '14 tablets',
          hsn_code: '292630',
          gst_percentage: 12,
          schedule_type: 'Schedule H',
          prescription_required: true,
          storage_condition: 'Store below 25°C',
          has_variants: false,
          variant_type: null,
          manufacturer: 'Sun Pharma',
          drug_license_no: 'DL-789012',
          barcode: '2345678901234',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      product_id: product.id,
      product_name: product.product_name,
      gst_percentage: product.gst_percentage.toString(),
    }));
    setSearchTerm(product.product_name);
    setShowDropdown(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.product_id) {
      setError('Please select a product');
      setLoading(false);
      return;
    }

    try {
      const initialQty = parseInt(formData.initial_quantity) || 0;

      // Mock submission since we removed Supabase dependency
      // In a real application without backend, you might save to localStorage
      console.log('Submitting batch data:', {
        product_id: formData.product_id,
        batch_number: formData.batch_number,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        purchase_rate: parseFloat(formData.purchase_rate) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        initial_quantity: initialQty,
        current_stock_qty: initialQty,
        warehouse_location: formData.warehouse_location || null,
        cold_storage: formData.cold_storage,
        supplier_name: formData.supplier_name || null,
        purchase_invoice_no: formData.purchase_invoice_no || null,
      });

      // Simulate a successful submission
      // In a real app, you might save to localStorage or another local store
      const batchData = {
        id: Math.random().toString(36).substring(7), // Generate mock ID
        product_id: formData.product_id,
        batch_number: formData.batch_number,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        purchase_rate: parseFloat(formData.purchase_rate) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        initial_quantity: initialQty,
        current_stock_qty: initialQty,
        warehouse_location: formData.warehouse_location || null,
        cold_storage: formData.cold_storage,
        supplier_name: formData.supplier_name || null,
        purchase_invoice_no: formData.purchase_invoice_no || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage if needed
      const existingBatches = JSON.parse(localStorage.getItem('batches') || '[]');
      existingBatches.push(batchData);
      localStorage.setItem('batches', JSON.stringify(existingBatches));

      setSuccess(true);
      setFormData({
        product_id: '',
        product_name: '',
        batch_number: '',
        manufacturing_date: '',
        expiry_date: '',
        purchase_rate: '',
        mrp: '',
        gst_percentage: '12',
        initial_quantity: '',
        warehouse_location: '',
        cold_storage: false,
        supplier_name: '',
        purchase_invoice_no: '',
      });
      setSearchTerm('');

      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <style>{`
        .card-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-200/50 rounded-xl text-red-700 shadow-sm backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-200/50 rounded-xl text-green-700 shadow-sm backdrop-blur-sm">
          <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="font-medium">Batch added successfully!</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative card-glass rounded-2xl p-6 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
              placeholder="Search product by name, brand, or generic name"
              required
            />
          </div>

          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-2 card-glass border border-white/30 rounded-2xl shadow-xl max-h-60 overflow-y-auto backdrop-blur-sm">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50/30 border-b border-gray-100/30 last:border-b-0 transition-all duration-200 rounded-xl hover:scale-[1.02] m-1"
                >
                  <div className="font-medium text-gray-900">{product.product_name}</div>
                  {(product.brand_name || product.generic_name) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {product.brand_name} {product.brand_name && product.generic_name && '•'} {product.generic_name}
                    </div>
                  )}
                  {product.strength && (
                    <div className="text-xs text-gray-500 mt-2 bg-white/30 px-2 py-1 rounded-lg inline-block">Strength: {product.strength}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {formData.product_id && (
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/30 border border-blue-200/50 rounded-2xl shadow-sm backdrop-blur-sm">
            <div className="text-sm font-medium text-blue-900 bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Selected: {formData.product_name}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Batch Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="batch_number"
            value={formData.batch_number}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter batch number"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Initial Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="initial_quantity"
            value={formData.initial_quantity}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter quantity"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Manufacturing Date
          </label>
          <input
            type="date"
            name="manufacturing_date"
            value={formData.manufacturing_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Purchase Rate
          </label>
          <input
            type="number"
            name="purchase_rate"
            value={formData.purchase_rate}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="0.00"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            MRP
          </label>
          <input
            type="number"
            name="mrp"
            value={formData.mrp}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="0.00"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            GST %
          </label>
          <select
            name="gst_percentage"
            value={formData.gst_percentage}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Warehouse Location
          </label>
          <input
            type="text"
            name="warehouse_location"
            value={formData.warehouse_location}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., Rack A, Shelf 3"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Supplier Name
          </label>
          <input
            type="text"
            name="supplier_name"
            value={formData.supplier_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter supplier name"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Purchase Invoice No
          </label>
          <input
            type="text"
            name="purchase_invoice_no"
            value={formData.purchase_invoice_no}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter invoice number"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30 flex items-center">
          <input
            type="checkbox"
            name="cold_storage"
            checked={formData.cold_storage}
            onChange={handleChange}
            className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <label className="ml-3 text-sm font-medium text-gray-700">
            Cold Storage Required
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 gradient-btn py-3.5 px-6 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Batch...' : 'Add Batch/Stock'}
        </button>
      </div>
    </form>
  );
}
