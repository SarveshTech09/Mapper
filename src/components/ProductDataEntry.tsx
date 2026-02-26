import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import { useUserData } from '../hooks/useUserData';
import { useCategories } from '../hooks/useCategories';
import { useSubCategories } from '../hooks/useSubCategories';
import useBrands from '../hooks/useBrands';
import useProductsByBrand from '../hooks/useProductsByBrand';
import { dummyData } from './data';

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
  image?: string | File;
  availableSubCategories?: { value: string; label: string }[];
}

// Helper function to generate dynamic headers from data.tsx
interface HeaderConfig {
  key: string;
  label: string;
  className: string;
}

// Define field type interface
interface FieldType {
  type: string;
  name: string;
  label: string;
  required?: boolean;
  values?: { value: string; label: string; selected?: boolean }[];
}

// Helper function to render field based on its type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderField = (field: FieldType, row: ProductRow, updateRow: (id: string, field: keyof ProductRow, value: string | number | boolean | File) => Promise<void>, rowIndex: number, rowProductsMap: Record<string, any[]>, rowLoadingMap: Record<string, boolean>, brands: string[], brandsLoading: boolean, setSuccess: (msg: string | null) => void) => {
  // Map field names from data.tsx to ProductRow interface
  const fieldMapping: Record<string, keyof ProductRow> = {
    'brand': 'brand_name',
    'title': 'product_name',
    'hsn_no': 'hsn_code',
    'description': 'generic_name'
  };

  const fieldName = (fieldMapping[field.name] || field.name) as keyof ProductRow;
  const value = row[fieldName];

  switch (field.type) {
    case 'text':
    case 'textarea':
      // Special handling for product_name field (title) to show related products
      if (field.name === 'title' && row.brand_name) {
        const rowBrandKey = `${row.id}-${row.brand_name}`;
        const relatedProducts = rowProductsMap[rowBrandKey] || [];
        const isLoading = rowLoadingMap[row.id] || false;

        // Find selected product for proper display
        const selectedProduct = relatedProducts.find((product: string) => product === value) || null;

        return (
          <ReactSelect
            value={selectedProduct ? { value: selectedProduct, label: selectedProduct } : null}
            onChange={(selectedOption: OptionType | null) => {
              updateRow(row.id, fieldName, selectedOption?.value || '');
            }}
            options={relatedProducts.map((product: string) => ({
              value: product,
              label: product
            }))}
            placeholder="Search product..."
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
              valueContainer: (provided) => ({
                ...provided,
                paddingLeft: 8,
                paddingRight: 8,
              }),
            }}
            isSearchable
            closeMenuOnSelect={true}
            blurInputOnSelect={true}
            isLoading={isLoading}
          />
        );
      }

      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={field.label}
          {...(field.type === 'textarea' && { as: 'textarea', rows: 3 })}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value as number || ''}
          onChange={(e) => updateRow(row.id, fieldName, parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={field.label}
        />
      );

    case 'select':
      { const options = field.values?.map((opt) => ({
        value: opt.value,
        label: opt.label
      })) || [];

      return (
        <ReactSelect
          value={value ? { value: value as string, label: value as string } : null}
          onChange={(selectedOption: OptionType | null) => {
            updateRow(row.id, fieldName, selectedOption?.value || '');
          }}
          options={options}
          placeholder={`Select ${field.label.toLowerCase()}...`}
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
      ); }

    case 'autocomplete':
      // Special handling for brand field
      if (field.name === 'brand') {
        return (
          <ReactSelect
            value={value ? { value: value as string, label: value as string } : null}
            onChange={(selectedOption: OptionType | null) => {
              updateRow(row.id, fieldName, selectedOption?.value || '');
            }}
            options={brands.map((brand: string) => ({
              value: brand,
              label: brand
            }))}
            placeholder="Search brand..."
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
              valueContainer: (provided) => ({
                ...provided,
                paddingLeft: 8,
                paddingRight: 8,
              }),
            }}
            isSearchable
            closeMenuOnSelect={true}
            blurInputOnSelect={true}
            isLoading={brandsLoading}
          />
        );
      }

      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={field.label}
        />
      );

    case 'radio-group':
      return (
        <div className="flex gap-4">
          {field.values?.map((option, idx: number) => (
            <label key={idx} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name={`${field.name}-${rowIndex}`}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      );

    case 'checkbox-group':
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => updateRow(row.id, fieldName, e.target.checked ? 1 : 0)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      );

    case 'file': {
      const hasImage = value && (typeof value === 'string' || (value instanceof File));
      return (
        <label
          className={`flex flex-row items-center justify-center w-full h-[36px] border-2 border-dashed rounded cursor-pointer transition-colors gap-1.5 px-2 ${hasImage ? "border-green-400 bg-green-50 hover:bg-green-100" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (!file) return;
            if (!["image/jpeg", "image/png"].includes(file.type)) {
              alert("Only JPG / PNG allowed");
              return;
            }
            if (file.size > 1 * 1024 * 1024) {
              alert("Max size is 1 MB");
              return;
            }
            updateRow(row.id, fieldName, file);
            setSuccess("Image uploaded successfully");
            setTimeout(() => setSuccess(null), 3000);
          }}
        >
          {hasImage ? (
            <>
              <svg
                className="w-4 h-4 text-green-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                className="w-4 h-4 text-green-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  strokeWidth={1.5}
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                  strokeWidth={1.5}
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 15l-5-5L5 21"
                />
              </svg>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4-4m0 0l4 4m-4-4v9M20 16l-4-4m0 0l-4 4m4-4V3"
                />
              </svg>
              <span className="text-[11px] text-gray-500">
                Click or drag image
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!["image/jpeg", "image/png"].includes(file.type)) {
                alert("Only JPG / PNG allowed");
                return;
              }
              if (file.size > 1 * 1024 * 1024) {
                alert("Max size is 1 MB");
                return;
              }
              updateRow(row.id, fieldName, file);
              setSuccess("Image uploaded successfully");
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        </label>
      );
    }

    default:
      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={field.label}
        />
      );
  }
};

const generateDynamicHeaders = (): HeaderConfig[] => {
  const headers: HeaderConfig[] = [];

  // First pass: Add all fields except file type
  dummyData.forEach((field) => {

    let label = field.label;
    const key = field.name;
    let className = 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider';

    // Add required indicator
    if (field.required) {
      label += ' *';
    }

    // Set specific widths based on field name
    const widthMap: Record<string, string> = {
      'title': 'min-w-[200px]',
      'category': 'min-w-[120px]',
      'sub_category': 'min-w-[120px]',
      'brand': 'min-w-[150px]',
      'hsn_no': 'min-w-[100px]',
      'gst_percentage': 'min-w-[80px]',
      'employee_percentage': 'min-w-[120px]',
      'prescription_required': 'min-w-[120px]',
      'is_inventory': 'min-w-[120px]',
      'description': 'min-w-[200px]'
    };

    const widthClass = widthMap[field.name] || 'min-w-[150px]';
    className += ` ${widthClass}`;

    // Special handling for certain fields
    if (field.name === 'is_inventory') {
      className = className.replace('text-left', 'text-center');
    }

    headers.push({
      key,
      label,
      className
    });
  });

  // Add actions column at the very end
  headers.push({
    key: 'actions',
    label: 'Actions',
    className: 'px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]'
  });

  return headers;
};

export default function ProductDataEntry() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rowProductsMap, setRowProductsMap] = useState<Record<string, any[]>>({});

  // Fetch user data using custom hook
  const { userData, loading: userLoading, error: userError } = useUserData();
  const businessId = userData?.business_id || null;
  const subCategoryId = userData?.sub_category_id || null;

  // Fetch categories using custom hook
  const { loading: categoriesLoading, error: categoriesError } = useCategories(businessId, subCategoryId);

  // Fetch subcategories using custom hook
  const { fetchSubCategories, error: subCategoriesError } = useSubCategories();

  // Fetch brands using custom hook
  const { brands, brandsLoading, brandsError, fetchBrands } = useBrands();

  // Fetch products by brand using custom hook
  const { productsError, fetchProducts } = useProductsByBrand();





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
        image: '',
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
      image: '',
      availableSubCategories: [],
    };
    setRows([newRow, ...rows]);
  };

  const updateRow = async (id: string, field: keyof ProductRow, value: string | number | boolean | File) => {
    if (field === 'category' && businessId) {
      // Update the category first
      setRows(prev => 
        prev.map(row =>
          row.id === id ? { ...row, [field]: value as string } : row
        )
      );

      // Fetch and update subcategories for this specific row
      if (value) {  // Only fetch if category is not empty
        const subCategories = await fetchSubCategories(businessId, value as string);

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
          row.id === id ? { ...row, [field]: value as string } : row
        )
      );

      // Fetch and update products for this specific row if brand is selected
      if (value) {  // Only fetch if brand is not empty
        const brandName = value as string;
          const rowBrandKey = `${id}-${brandName}`;

          // Set loading state for this specific row
          setRowLoadingMap(prev => ({ ...prev, [id]: true }));

          try {
          // Fetch products and get the result directly
          const productsData = await fetchProducts({ brand_name: brandName });

          // Update the row products map with the fetched products
          setRowProductsMap(prev => ({
            ...prev,
            [rowBrandKey]: [...productsData]
          }));
          } catch (error) {
            console.error('Error fetching products:', error);
          } finally {
            // Clear loading state for this row
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
              {generateDynamicHeaders().map((header) => (
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
              filteredRows.map((row, rowIndex) => (
                <tr key={row.id} className={`${row.isNew ? 'bg-blue-50' : row.status === 'inactive' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition-colors`}>
                  {dummyData
                    .map((field) => (
                      <td key={field.name} className="px-3 py-2">
                        {renderField(field, row, updateRow, rowIndex, rowProductsMap, rowLoadingMap, brands, brandsLoading, setSuccess)}
                      </td>
                    ))}
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