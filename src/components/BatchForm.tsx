import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { AlertCircle, Check, Search } from 'lucide-react';

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
    try {
      const { data, error } = await supabase
        .from('product_master')
        .select('*')
        .eq('status', 'active')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
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

      const { error: insertError } = await supabase
        .from('batch_master')
        .insert([{
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
        }]);

      if (insertError) throw insertError;

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
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>Batch added successfully!</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search product by name, brand, or generic name"
              required
            />
          </div>

          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">{product.product_name}</div>
                  {(product.brand_name || product.generic_name) && (
                    <div className="text-sm text-gray-500">
                      {product.brand_name} {product.brand_name && product.generic_name && '•'} {product.generic_name}
                    </div>
                  )}
                  {product.strength && (
                    <div className="text-xs text-gray-400 mt-1">Strength: {product.strength}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {formData.product_id && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900">Selected: {formData.product_name}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="batch_number"
            value={formData.batch_number}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter batch number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="initial_quantity"
            value={formData.initial_quantity}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturing Date
          </label>
          <input
            type="date"
            name="manufacturing_date"
            value={formData.manufacturing_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Rate
          </label>
          <input
            type="number"
            name="purchase_rate"
            value={formData.purchase_rate}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MRP
          </label>
          <input
            type="number"
            name="mrp"
            value={formData.mrp}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST %
          </label>
          <select
            name="gst_percentage"
            value={formData.gst_percentage}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse Location
          </label>
          <input
            type="text"
            name="warehouse_location"
            value={formData.warehouse_location}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Rack A, Shelf 3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier Name
          </label>
          <input
            type="text"
            name="supplier_name"
            value={formData.supplier_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Invoice No
          </label>
          <input
            type="text"
            name="purchase_invoice_no"
            value={formData.purchase_invoice_no}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter invoice number"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="cold_storage"
            checked={formData.cold_storage}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">
            Cold Storage Required
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding Batch...' : 'Add Batch/Stock'}
        </button>
      </div>
    </form>
  );
}
