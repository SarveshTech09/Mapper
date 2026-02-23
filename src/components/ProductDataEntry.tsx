import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';

interface ProductRow {
  id: string;
  isNew: boolean;
  product_name: string;
  brand_name: string;
  generic_name: string;
  category: string;
  sub_category: string;
  dosage_form: string;
  strength: string;
  base_pack_size: string;
  hsn_code: string;
  gst_percentage: number;
  schedule_type: string;
  prescription_required: boolean;
  storage_condition: string;
  manufacturer: string;
  barcode: string;
  has_variants: boolean;
  variant_type: string;
  status: string;
  availableSubCategories?: { value: string; label: string }[];
}

export default function ProductDataEntry() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [businessId, setBusinessId] = useState<number | null>(null);

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const [subCategories, setSubCategories] = useState<
    { value: string; label: string }[]
  >([]);

  // State to track selected category for each row
  const [selectedCategories, setSelectedCategories] = useState<{[key: string]: string}>({});

  /* ================= LOAD INITIAL DATA ================= */
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // 1️⃣ Get business ID
        const meRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const meData = await meRes.json();
        const id = meData.business_id;
        const subCategoryId = meData.sub_category_id || null;
        setBusinessId(id);

        // 2️⃣ Get Categories for dropdown and initial display
        const categoryRes = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/getCategory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              business_id: id,
              sub_category_id: subCategoryId,
            }),
          },
        );

        const categoryData = await categoryRes.json();
        const categoryArray = categoryData.data ?? [];

        // Set categories for dropdown
        setCategories(
          categoryArray.map((item: any) => ({
            value: item.category_type,
            label: item.category_type,
          })),
        );

        // Initialize with one empty row
        setRows([{ 
          id: `initial-${Date.now()}`, 
          isNew: true, 
          product_name: '', 
          brand_name: '', 
          generic_name: '', 
          category: '', 
          sub_category: '', 
          dosage_form: '', 
          strength: '', 
          base_pack_size: '', 
          hsn_code: '', 
          gst_percentage: 12, 
          schedule_type: '', 
          prescription_required: false, 
          storage_condition: '', 
          manufacturer: '', 
          barcode: '', 
          has_variants: false, 
          variant_type: '', 
          status: 'active',
          availableSubCategories: [],
        }]);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /* ================= LOAD SUB CATEGORIES WHEN CATEGORY CHANGES ================= */
  useEffect(() => {
    const fetchSubCategories = async (rowId: string, selectedCategory: string) => {
      if (!selectedCategory || !businessId) {
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/optical/getCategory/${businessId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              category_type: selectedCategory,
            }),
          },
        );

        const result = await res.json();
        const subArray = result.data ?? result ?? [];

        // Format subcategories
        const formattedSubCategories = subArray.map((item: any) => ({
          value: item.product_category,
          label: item.product_category,
        }));

        // Update the specific row with available subcategories
        setRows(prev => 
          prev.map(row => 
            row.id === rowId ? { ...row, availableSubCategories: formattedSubCategories } : row
          )
        );
      } catch (err) {
        console.error(`Error fetching subcategories for row ${rowId}:`, err);
      }
    };

    // Process each selected category
    Object.entries(selectedCategories).forEach(([rowId, category]) => {
      fetchSubCategories(rowId, category);
    });
  }, [selectedCategories, businessId]);

  const addNewRow = () => {
    const newRow: ProductRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      product_name: '',
      brand_name: '',
      generic_name: '',
      category: '',
      sub_category: '',
      dosage_form: '',
      strength: '',
      base_pack_size: '',
      hsn_code: '',
      gst_percentage: 12,
      schedule_type: '',
      prescription_required: false,
      storage_condition: '',
      manufacturer: '',
      barcode: '',
      has_variants: false,
      variant_type: '',
      status: 'active',
      availableSubCategories: [],
    };
    setRows([newRow, ...rows]);
  };

  const updateRow = (id: string, field: keyof ProductRow, value: any) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));

    // Update selected category when category changes
    if (field === 'category') {
      setSelectedCategories(prev => ({
        ...prev,
        [id]: value
      }));
      
      // Reset subcategory when category changes
      setRows(prev => 
        prev.map(r => 
          r.id === id ? { ...r, sub_category: '' } : r
        )
      );
    }
  };

  const saveRow = async (row: ProductRow) => {
    if (!row.product_name) {
      setError('Product Name is required');
      return;
    }

    setSaving(row.id);
    setError(null);

    try {
      // Simulate save operation (removed Supabase calls)
      if (row.isNew) {
        // Add new row to state
        const newRows = rows.map(r => 
          r.id === row.id ? { ...row, isNew: false } : r
        );
        setRows(newRows);
        setSuccess('Product added successfully');
      } else {
        // Update existing row
        const newRows = rows.map(r => 
          r.id === row.id ? { ...row } : r
        );
        setRows(newRows);
        setSuccess('Product updated successfully');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (row: ProductRow) => {
    if (row.isNew) {
      setRows(rows.filter(r => r.id !== row.id));
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      // Simulate delete operation (removed Supabase calls)
      setRows(rows.filter(r => r.id !== row.id));
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const cancelNewRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show all rows since filters have been removed
  const filteredRows = rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Master Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage products directly in the grid</p>
        </div>
        <button
          onClick={addNewRow}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>


      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Product Name *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Brand Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Generic Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Sub Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Dosage Form
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Strength
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Pack Size
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                HSN Code
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">
                GST %
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Schedule
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Storage
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Manufacturer
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Barcode
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">
                Rx Req
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium">No products found</div>
                    <p className="text-sm">Click "Add New Product" to start adding products</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className={`${row.isNew ? 'bg-blue-50' : row.status === 'inactive' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.product_name}
                      onChange={(e) => updateRow(row.id, 'product_name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product Name"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.brand_name}
                      onChange={(e) => updateRow(row.id, 'brand_name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.generic_name}
                      onChange={(e) => updateRow(row.id, 'generic_name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Generic"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.category}
                        onChange={(e) => {
                          updateRow(row.id, 'category', e.target.value);
                        }}
                        list={`category-list-${row.id}`}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Select or type category..."
                      />
                      <datalist id={`category-list-${row.id}`}>
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value} label={cat.label} />
                        ))}
                      </datalist>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.sub_category}
                        onChange={(e) => updateRow(row.id, 'sub_category', e.target.value)}
                        list={`subcategory-list-${row.id}`}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Select or type sub-category..."
                        disabled={!row.category}
                      />
                      <datalist id={`subcategory-list-${row.id}`}>
                        {(row.availableSubCategories || []).map(sub => (
                          <option key={sub.value} value={sub.value} label={sub.label} />
                        ))}
                      </datalist>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.dosage_form}
                      onChange={(e) => updateRow(row.id, 'dosage_form', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Form"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.strength}
                      onChange={(e) => updateRow(row.id, 'strength', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Strength"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.base_pack_size}
                      onChange={(e) => updateRow(row.id, 'base_pack_size', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pack Size"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.hsn_code}
                      onChange={(e) => updateRow(row.id, 'hsn_code', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.gst_percentage}
                      onChange={(e) => updateRow(row.id, 'gst_percentage', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.schedule_type}
                      onChange={(e) => updateRow(row.id, 'schedule_type', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Schedule"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.storage_condition}
                      onChange={(e) => updateRow(row.id, 'storage_condition', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Storage"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.manufacturer}
                      onChange={(e) => updateRow(row.id, 'manufacturer', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Manufacturer"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.barcode}
                      onChange={(e) => updateRow(row.id, 'barcode', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Barcode"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.prescription_required}
                      onChange={(e) => updateRow(row.id, 'prescription_required', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      {row.isNew ? (
                        <button
                          onClick={() => cancelNewRow(row.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteRow(row)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
        <div>
          Showing: <span className="font-medium text-gray-900">{filteredRows.length}</span> products
        </div>
        <div className="text-xs text-gray-500">
          * Required fields | Click Save icon to save each row
        </div>
      </div>
    </div>
  );
}