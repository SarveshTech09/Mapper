import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useUserData } from '../hooks/useUserData';
import { useCategories } from '../hooks/useCategories';
import { useSubCategories } from '../hooks/useSubCategories';
import useBrands from '../hooks/useBrands';
import useProductsByBrand from '../hooks/useProductsByBrand';

// Define the Option type for react-select
interface OptionType {
  value: string;
  label: string;
}

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
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data using custom hook
  const { userData, loading: userLoading, error: userError } = useUserData();
  const businessId = userData?.business_id || null;
  const subCategoryId = userData?.sub_category_id || null;

  // Fetch categories using custom hook
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories(businessId, subCategoryId);

  // Fetch subcategories using custom hook
  const { fetchSubCategories, error: subCategoriesError } = useSubCategories();

  // Fetch brands using custom hook
  const { brands, brandsLoading, brandsError, fetchBrands } = useBrands();

  // Fetch products by brand using custom hook
  const { productsError, fetchProducts } = useProductsByBrand();

  // State to store products for each row by brand
  const [rowProductsMap, setRowProductsMap] = useState<Record<string, string[]>>({});
  // State to track loading status per row
  const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>({});



  // Fetch brands when component mounts and when user data becomes available
  useEffect(() => {
    // Only fetch brands when user data is available and not already loaded
    if (userData && !brandsLoading && brands.length === 0) {
      fetchBrands();
    }
  }, [userData, brandsLoading, brands, fetchBrands]);

  // Initialize with one empty row when all required data is loaded
  useEffect(() => {
    // Initialize with one empty row when user data and categories are loaded
    if (!userLoading && !categoriesLoading && !brandsLoading && rows.length === 0) {
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
    }
  }, [userLoading, categoriesLoading, brandsLoading, rows.length]);



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

  const updateRow = async (id: string, field: keyof ProductRow, value: any) => {
    if (field === 'category' && businessId) {
      // Update the category first
      setRows(prev => 
        prev.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
      
      // Fetch and update subcategories for this specific row
      if (value) {  // Only fetch if category is not empty
        const subCategories = await fetchSubCategories(businessId, value);
        
        setRows(prev => 
          prev.map(row => {
            if (row.id === id) {
              // Reset sub_category if it doesn't exist in the new list
              const shouldResetSubCategory = row.sub_category && !subCategories.some(sc => sc.value === row.sub_category);
              const newSubCategory = shouldResetSubCategory ? '' : row.sub_category;
              
              return { ...row, availableSubCategories: subCategories, sub_category: newSubCategory };
            }
            return row;
          })
        );
      } else {
        // Clear subcategories if category is cleared
        setRows(prev => 
          prev.map(row =>
            row.id === id ? { ...row, availableSubCategories: [], sub_category: '' } : row
          )
        );
      }
    } else if (field === 'brand_name') {
      // Update the brand name first
      setRows(prev => 
        prev.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
      
      // Fetch and update products for this specific row if brand is selected
      if (value) {  // Only fetch if brand is not empty
        try {
          const brandName = value;
          const rowBrandKey = `${id}-${brandName}`;
          
          // Set loading state for this specific row
          setRowLoadingMap(prev => ({ ...prev, [id]: true }));
          
          // Fetch products and get the result directly
          const productsData = await fetchProducts({ brand_name: brandName });
          
          // Update the row products map with the fetched products
          setRowProductsMap(prev => ({
            ...prev,
            [rowBrandKey]: [...productsData]
          }));
          
          // Clear loading state for this row
          setRowLoadingMap(prev => ({ ...prev, [id]: false }));
        } catch (error) {
          // Error handling done via setError state
          setRowLoadingMap(prev => ({ ...prev, [id]: false }));
        }
      } else {
        // Clear products and loading state when brand is cleared
        setRowProductsMap(prev => {
          const newMap = { ...prev };
          // Remove all entries for this row
          Object.keys(newMap).forEach(key => {
            if (key.startsWith(`${id}-`)) {
              delete newMap[key];
            }
          });
          return newMap;
        });
        // Clear loading state for this row
        setRowLoadingMap(prev => ({ ...prev, [id]: false }));
      }
    } else {
      // For other fields, just update normally
      setRows(rows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      ));
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

  if (userLoading || categoriesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Combine errors from all hooks
  if (userError || categoriesError || subCategoriesError || brandsError || productsError) {
    setError(userError || categoriesError || subCategoriesError || brandsError || productsError || "Failed to load data");
  }

  // Convert brands array to options format for react-select
  const brandOptions = brands.map(brand => ({
    value: brand,
    label: brand
  }));

  // Function to get product options for a specific row
  const getProductOptions = (row: ProductRow) => {
    const rowBrandKey = `${row.id}-${row.brand_name}`;
    const productsForRow = rowProductsMap[rowBrandKey] || [];
    return productsForRow.map(product => ({
      value: product,
      label: product
    }));
  };

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
              {[
                { key: 'brand_name', label: 'Brand Name', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' },
                { key: 'product_name', label: 'Product Name *', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]' },
                { key: 'generic_name', label: 'Generic Name', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' },
                { key: 'category', label: 'Category', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'sub_category', label: 'Sub Category', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'dosage_form', label: 'Dosage Form', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]' },
                { key: 'strength', label: 'Strength', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]' },
                { key: 'base_pack_size', label: 'Pack Size', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'hsn_code', label: 'HSN Code', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]' },
                { key: 'gst_percentage', label: 'GST %', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]' },
                { key: 'schedule_type', label: 'Schedule', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]' },
                { key: 'storage_condition', label: 'Storage', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' },
                { key: 'manufacturer', label: 'Manufacturer', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' },
                { key: 'barcode', label: 'Barcode', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'prescription_required', label: 'Rx Req', className: 'px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]' },
                { key: 'actions', label: 'Actions', className: 'px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]' },
              ].map((header) => (
                <th 
                  key={header.key}
                  className={header.className}
                >
                  {header.label}
                </th>
              ))}
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
                    <CreatableSelect
                      value={row.brand_name ? { value: row.brand_name, label: row.brand_name } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'brand_name', selectedOption?.value || '');
                      }}
                      options={brandOptions}
                      placeholder={brandsLoading ? "Loading brands..." : "Brand"}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isLoading={brandsLoading}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <CreatableSelect
                      value={row.product_name ? { value: row.product_name, label: row.product_name } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'product_name', selectedOption?.value || '');
                      }}
                      options={getProductOptions(row)}
                      placeholder={row.brand_name ? (rowLoadingMap[row.id] ? "Loading products..." : "Product Name") : "Select brand first"}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isLoading={rowLoadingMap[row.id] && !!row.brand_name}
                      isDisabled={!row.brand_name}
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
                    <ReactSelect
                      value={{ value: row.category, label: row.category }}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'category', selectedOption?.value || '');
                      }}
                      options={categories}
                      placeholder="Select category..."
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ReactSelect
                      value={{ value: row.sub_category, label: row.sub_category }}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'sub_category', selectedOption?.value || '');
                      }}
                      options={row.availableSubCategories || []}
                      placeholder="Select sub-category..."
                      className="text-sm"
                      menuPortalTarget={document.body}   // ✅ ADD THIS
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isDisabled={!row.category}
                      closeMenuOnSelect={true}
                      blurInputOnSelect={true}
                    />
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