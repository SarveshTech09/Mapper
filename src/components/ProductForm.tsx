import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface ProductFormProps {
  onSuccess: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    product_name: '',
    brand_name: '',
    generic_name: '',
    category: '',
    sub_category: '',
    dosage_form: '',
    strength: '',
    base_pack_size: '',
    hsn_code: '',
    gst_percentage: '12',
    schedule_type: '',
    prescription_required: false,
    storage_condition: '',
    manufacturer: '',
    drug_license_no: '',
    barcode: '',
  });

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

    try {
      // Mock submission since we removed Supabase dependency
      // Save to localStorage in a real application
      const productData = {
        id: Math.random().toString(36).substring(7), // Generate mock ID
        ...formData,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      existingProducts.push(productData);
      localStorage.setItem('products', JSON.stringify(existingProducts));

      setSuccess(true);
      setFormData({
        product_name: '',
        brand_name: '',
        generic_name: '',
        category: '',
        sub_category: '',
        dosage_form: '',
        strength: '',
        base_pack_size: '',
        hsn_code: '',
        gst_percentage: '12',
        schedule_type: '',
        prescription_required: false,
        storage_condition: '',
        manufacturer: '',
        drug_license_no: '',
        barcode: '',
      });

      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <span className="font-medium">Product added successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter product name"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Brand Name
          </label>
          <input
            type="text"
            name="brand_name"
            value={formData.brand_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter brand name"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Generic Name
          </label>
          <input
            type="text"
            name="generic_name"
            value={formData.generic_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter generic name"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., Medicine, Supplement"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sub Category
          </label>
          <input
            type="text"
            name="sub_category"
            value={formData.sub_category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter sub category"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dosage Form
          </label>
          <input
            type="text"
            name="dosage_form"
            value={formData.dosage_form}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., Tablet, Syrup, Capsule"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Strength
          </label>
          <input
            type="text"
            name="strength"
            value={formData.strength}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., 500mg, 10ml"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Base Pack Size
          </label>
          <input
            type="text"
            name="base_pack_size"
            value={formData.base_pack_size}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., 10 tablets, 100ml"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            HSN Code
          </label>
          <input
            type="text"
            name="hsn_code"
            value={formData.hsn_code}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter HSN code"
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
            Schedule Type
          </label>
          <input
            type="text"
            name="schedule_type"
            value={formData.schedule_type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., H, H1, X"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Storage Condition
          </label>
          <input
            type="text"
            name="storage_condition"
            value={formData.storage_condition}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="e.g., Cool & Dry Place"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Manufacturer
          </label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter manufacturer name"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Drug License No
          </label>
          <input
            type="text"
            name="drug_license_no"
            value={formData.drug_license_no}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter drug license number"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Barcode
          </label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm"
            placeholder="Enter barcode"
          />
        </div>

        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/30 flex items-center">
          <input
            type="checkbox"
            name="prescription_required"
            checked={formData.prescription_required}
            onChange={handleChange}
            className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <label className="ml-3 text-sm font-medium text-gray-700">
            Prescription Required
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 gradient-btn py-3.5 px-6 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}
