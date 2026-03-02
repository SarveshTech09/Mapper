import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import useAddVariants from '../hooks/useAddVariants';
import useSubmitVariant from '../hooks/useSubmitVariant';
import { dummyData } from './data';
import { accountdetails } from '../hooks/use_dynamci';


interface VariantData {
  product_name: string;
  uom: string;
  value: string;
  mrp: string;
  sell_price: string;
  available_quantity: string;
  product_id: string | number;
}

interface Product {
  id: number; // Original numeric ID from API
  product_name: string;
  brand_name?: string;
  has_variants: boolean;
  variant_type?: string;
}

interface FieldType {
  type: string;
  name: string;
  label: string;
  required?: boolean;
  values?: ({ value: string; label: string; selected?: boolean } | { value: string })[];
  className?: string;
  access?: boolean;
  subtype?: string;
  multiple?: boolean;
  requireValidOption?: boolean;
  QueryRule?: string;
  inline?: boolean;
  other?: boolean;
  toggle?: boolean;
  DataType?: string;
}

interface BatchRow {
  id: string;
  isNew: boolean;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_has_variants: boolean;
  product_variant_type: string;
  variant_name: string;
  uom: string;
  value: string;
  price: number;
  offer: number;
  quantity: number;
  // Index signature to allow dynamic fields
  [key: string]: string | number | boolean | undefined;
}

export default function InventoryDataEntry() {
  const [dynamicFields, setDynamicFields] = useState<FieldType[]>([]);
  const [formLoading, setFormLoading] = useState(true);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    fetchBrands,
    brandsLoading,
    brandsError,
  } = useAddVariants();
  
  const {
    fetchProductsByBrand,
    productsByBrandLoading,
    productsByBrandError,
  } = useAddVariants();
  
  const { loading: submitLoading, error: submitError } = useSubmitVariant();
  

  // Fetch dynamic form configuration
  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await accountdetails('product_description_ayurvedic');
        if (response.success && response.fields) {
          setDynamicFields(response.fields);
        } else {
          console.error('Failed to fetch form configuration:', response);
          setDynamicFields(dummyData); // Fallback to hardcoded data
        }
      } catch (error) {
        console.error('Error fetching form configuration:', error);
        setDynamicFields(dummyData); // Fallback to hardcoded data
      } finally {
        setFormLoading(false);
      }
    };
    
    fetchFormConfig();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Use dynamic fields fetched from API, fallback to dummy data if none loaded yet
  const currentFields = dynamicFields.length > 0 ? dynamicFields : dummyData;

  const [brands, setBrands] = useState<string[]>([]);
  
  const loadData = async () => {
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch brands from API
      const brandsData = await fetchBrands();
      
      if (brandsError) {
        setError(brandsError);
        setBrands([]);
        return;
      }
      
      setBrands(brandsData);
      
      const initialRow: BatchRow = {
        id: `temp-${Date.now()}`,
        isNew: true,
        product_id: '',
        product_name: '',
        product_brand: '',
        product_has_variants: false,
        product_variant_type: '',
        variant_name: '',
        uom: '',
        value: '',
        price: 0,
        offer: 0,
        quantity: 0,
      };
      
      // Add dynamic fields to initial row (excluding brand and title)
      currentFields.forEach(field => {
        if (!(field.name in initialRow) && field.name !== 'brand' && field.name !== 'title') {
          initialRow[field.name] = '';
        }
      });
      
      setRows([initialRow]);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setBrands([]);
      const errorRow: BatchRow = {
        id: `temp-${Date.now()}`,
        isNew: true,
        product_id: '',
        product_name: '',
        product_brand: '',
        product_has_variants: false,
        product_variant_type: '',
        variant_name: '',
        uom: '',
        value: '',
        price: 0,
        offer: 0,
        quantity: 0,
      };
      
      // Add dynamic fields to error row (excluding brand and title)
      currentFields.forEach(field => {
        if (!(field.name in errorRow) && field.name !== 'brand' && field.name !== 'title') {
          errorRow[field.name] = '';
        }
      });
      
      setRows([errorRow]);
    } finally {
      setLoading(false);
    }
  };

  interface OptionType {
    value: string;
    label: string;
  }

  // Helper function to render field based on its type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (field: FieldType, row: BatchRow, updateRow: (id: string, field: keyof BatchRow, value: string | number | boolean | File) => void, rowIndex?: number, rowProductsMap?: Record<string, any[]>, rowLoadingMap?: Record<string, boolean>, brandsLoading?: boolean, setSuccess?: (msg: string | null) => void) => {
    const actualBrandsLoading = brandsLoading ?? false;
    const actualSetSuccess = setSuccess ?? (() => {});

    // Only use the variables if they're actually needed in the function

    // Map field names from data.tsx to BatchRow interface
    const fieldMapping: Record<string, keyof BatchRow> = {
      'brand': 'product_brand',
      'title': 'product_name',
      'hsn_no': 'product_brand', // Using product_brand as placeholder
      'description': 'product_name', // Using product_name as placeholder
      'gst_percentage': 'product_name' // Using product_name as placeholder
    };

    const fieldName = (fieldMapping[field.name] || field.name) as keyof BatchRow;
    const value = row[fieldName];

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
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
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
            placeholder={field.label}
          />
        );

      case 'select':
        { 
          // Special handling for sub_category field to use dynamic options
          let options;
          if (field.name === 'sub_category' && row.availableSubCategories && Array.isArray(row.availableSubCategories) && row.availableSubCategories.length > 0) {
            options = row.availableSubCategories;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options = field.values?.map((opt: any) => {
              // Handle both structures: { value, label } and { value }
              if (opt && typeof opt === 'object' && 'label' in opt) {
                return { value: opt.value, label: opt.label };
              } else {
                return { value: opt.value, label: opt.value };
              }
            }) || [];
          }

          return (
            <ReactSelect
              value={value ? { value: value as string, label: value as string } : null}
              onChange={(selectedOption: OptionType | null) => {
                // For gst_percentage, we need to pass the raw value (with %) to updateRow
                // which will then convert it to a number
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
              isDisabled={field.name === 'sub_category' && (!row.availableSubCategories || !Array.isArray(row.availableSubCategories) || row.availableSubCategories.length === 0)}
            />
          );
        }

      case 'autocomplete':
        // Special handling for brand field
        if (field.name === 'brand') {
          // Extract brand values from field configuration
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const brandOptions = field.values?.map((opt: any) => {
            if (opt && typeof opt === 'object' && 'label' in opt) {
              return { value: opt.value, label: opt.label };
            } else {
              return { value: opt.value, label: opt.value };
            }
          }) || [];
          
          return (
            <ReactSelect
              value={value ? { value: value as string, label: value as string } : null}
              onChange={(selectedOption: OptionType | null) => {
                updateRow(row.id, fieldName, selectedOption?.value || '');
              }}
              options={brandOptions}
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
              isLoading={actualBrandsLoading}
            />
          );
        }

        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
            placeholder={field.label}
          />
        );

      case 'radio-group':
        return (
          <div className="flex gap-4">
            {field.values?.map((option, idx: number) => {
              const optionLabel = 'label' in option ? option.label : option.value;
              const optionValue = option.value;
              
              return (
                <label key={idx} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name={`${field.name}-${row.id}`}
                    value={optionValue}
                    checked={value === optionValue}
                    onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  {optionLabel}
                </label>
              );
            })}
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
        const hasImage = value && (typeof value === 'string' || (value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value));
        return (
          <label
            className={`flex flex-row items-center justify-center w-full h-[36px] border-2 border-dashed rounded cursor-pointer transition-colors gap-1.5 px-2 ${hasImage ? "border-green-400 bg-green-50 hover:bg-green-100" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (!file) return;
              if (typeof file !== 'object' || !('type' in file) || !('size' in file)) return;
              if (!['image/jpeg', 'image/png'].includes(file.type as string)) {
                alert('Only JPG / PNG allowed');
                return;
              }
              if ((file.size as unknown as number) > 1 * 1024 * 1024) {
                alert('Max size is 1 MB');
                return;
              }
              updateRow(row.id, fieldName, file as File);
              actualSetSuccess("Image uploaded successfully");
              setTimeout(() => actualSetSuccess(null), 3000);
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
                if (typeof file !== 'object' || !('type' in file) || !('size' in file)) return;
                if (!['image/jpeg', 'image/png'].includes(file.type as string)) {
                  alert('Only JPG / PNG allowed');
                  return;
                }
                if ((file.size as unknown as number) > 1 * 1024 * 1024) {
                  alert('Max size is 1 MB');
                  return;
                }
                updateRow(row.id, fieldName, file as File);
                actualSetSuccess("Image uploaded successfully");
                setTimeout(() => actualSetSuccess(null), 3000);
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
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
            placeholder={field.label}
          />
        );
    }
  };
  
  const loadProductsForBrand = async (brandName: string) => {
    try {
      const brandProducts = await fetchProductsByBrand(brandName);
      
      if (productsByBrandError) {
        setError(productsByBrandError);
        return [];
      }
      
      // Transform to Product format - use original numeric ID directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedProducts: Product[] = brandProducts.map((product: any) => ({
        id: product.id, // Original numeric ID from API
        product_name: product.product_name || product.title || product.name || '',
        brand_name: brandName,
        has_variants: product.has_variants || false,
        variant_type: product.variant_type || undefined
      }));
      
      return transformedProducts;
    } catch (err) {
      console.error('Error loading products for brand:', err);
      setError(err instanceof Error ? err.message : `Failed to load products for ${brandName}`);
      return [];
    }
  };

  const addNewRow = () => {
    const newRow: BatchRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      product_id: '',
      product_name: '',
      product_brand: '',
      product_has_variants: false,
      product_variant_type: '',
      variant_name: '',
      uom: '',
      value: '',
      price: 0,
      offer: 0,
      quantity: 0,
    };
    
    // Initialize dynamic fields to empty strings
    
    // Add dynamic fields to new row (excluding brand and title)
    currentFields.forEach(field => {
      if (!(field.name in newRow) && field.name !== 'brand' && field.name !== 'title') {
        newRow[field.name] = '';
      }
    });
    
    setRows([newRow, ...rows]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };

        if (field === 'product_brand') {
          // When brand changes, clear product selection
          updated.product_id = '';
          updated.product_name = '';
          
          // Load products for selected brand
          if (value) {
            loadProductsForBrand(value).then(brandProducts => {
              setProducts(prevProducts => {
                // Remove old products for this brand and add new ones
                const filteredProducts = prevProducts.filter(p => p.brand_name !== value);
                const newProducts = [...filteredProducts, ...brandProducts];
                return newProducts;
              });
            });
          }
        }
        
        if (field === 'product_id') {
          const product = products.find(p => p.id.toString() === value);
          if (product) {
            updated.product_name = product.product_name;
            updated.product_brand = product.brand_name || '';
            updated.product_has_variants = product.has_variants;
            updated.product_variant_type = product.variant_type || '';
            if (!product.has_variants) {
              updated.variant_name = '';
            }
          }
        }

        return updated;
      }
      return row;
    }));
  };

  const saveRow = async (row: BatchRow) => {
    // Check if the selected product actually exists in our products array
    const selectedProduct = products.find(p => p.id.toString() === row.product_id);
    if (!selectedProduct) {
      setError('Selected product not found. Please reselect the product.');
      return;
    }

    // Ensure we have a product name
    if (!row.product_name) {
      setError('Product name is missing. Please reselect the product.');
      return;
    }

    // Validate that we have a product_id
    if (!row.product_id) {
      setError('Product ID is required');
      return;
    }

    setSaving(row.id);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the payload for useSubmitVariant
      const baseData: VariantData = {
        product_name: row.product_name,
        uom: 'Piece', // Default UOM
        value: '1', // Default value
        mrp: '0', // Default price
        sell_price: '0', // Default sell price
        available_quantity: '0', // Default quantity
        product_id: row.product_id
      };

      // Prepare the complete payload including dynamic fields
      const completePayload: { [key: string]: string | number } = { ...baseData };
      
      // Add dynamic fields to the variant data
      currentFields.forEach(field => {
        if (field.name in row && !['product_name', 'product_brand', 'uom', 'value', 'mrp', 'sell_price', 'available_quantity', 'product_id'].includes(field.name)) {
          completePayload[field.name] = row[field.name as keyof BatchRow] as string;
        }
      });
      
      console.log('Submitting variant with dynamic fields:', completePayload);
      
      // Create a custom API call to submit the complete payload
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/ayurvedic/add-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(completePayload),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to submit variant');
      }
      
      const result = await response.json();
      const success = result.success;
      
      if (success) {
        setSuccess('Variant added successfully');
        // Reset form by loading fresh data
        await loadData();
      } else {
        setError(submitError || 'Failed to submit variant');
      }
    } catch (err) {
      console.error('Error saving row:', err);
      setError(err instanceof Error ? err.message : 'Failed to save variant');
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (row: BatchRow) => {
    if (row.isNew) {
      setRows(rows.filter(r => r.id !== row.id));
      return;
    }
    if (!confirm('Are you sure you want to delete this row?')) {
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess('Row deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  };
  
  const cancelNewRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  if (loading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage inventory directly in the grid</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Row
          </button>
        </div>
      </div>



      {(error || submitError) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || submitError}</span>
          <button onClick={() => {
            setError(null);
            if (submitError) {
              // We need to access the hook's setError - but since it's internal,
              // we'll just clear our local error state
            }
          }} className="ml-auto">
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Brand
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Product *
              </th>
              {/* Dynamic columns */}
              {(() => {
                // Filter out 'brand' and 'title'/'product' from dynamic fields since they're handled separately
                const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
                
                return dynamicFieldsFiltered.map((field) => (
                  <th 
                    key={field.name}
                    className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${(field.name === 'category' ? 'min-w-[120px]' : field.name === 'sub_category' ? 'min-w-[120px]' : field.name === 'hsn_no' ? 'min-w-[100px]' : field.name === 'gst_percentage' ? 'min-w-[80px]' : field.name === 'description' ? 'min-w-[200px]' : 'min-w-[150px]')}`}
                  >
                    {field.label}{field.required ? ' *' : ''}
                  </th>
                ));
              })()}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium">No inventory data yet</div>
                    <p className="text-sm">Click "Add New Row" to start adding inventory</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className={`${row.isNew ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-3 py-2">
                    {row.isNew ? (
                      <ReactSelect
                        value={row.product_brand ? { value: row.product_brand, label: row.product_brand } : null}
                        onChange={(selectedOption: { value: string; label: string } | null) => {
                          if (selectedOption) {
                            updateRow(row.id, 'product_brand', selectedOption.value);
                          } else {
                            updateRow(row.id, 'product_brand', '');
                          }
                        }}
                        options={brands.map(brand => ({
                          value: brand, 
                          label: brand
                        }))}
                        placeholder="Search brand..."
                        className="text-sm"
                        menuPortalTarget={document.body}
                        styles={{
                          control: (provided) => ({
                            ...provided,
                            minWidth: 200,
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
                    ) : (
                      <select
                        value={row.product_brand}
                        onChange={(e) => updateRow(row.id, 'product_brand', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!row.isNew}
                      >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.isNew ? (
                      <ReactSelect
                        value={products.find(p => p.id.toString() === row.product_id) 
                          ? { value: row.product_id, label: products.find(p => p.id.toString() === row.product_id)?.product_name + (products.find(p => p.id.toString() === row.product_id)?.brand_name ? ' (' + products.find(p => p.id.toString() === row.product_id)?.brand_name + ')' : '') }
                          : null}
                        onChange={(selectedOption: { value: string; label: string } | null) => {
                          if (selectedOption) {
                            updateRow(row.id, 'product_id', selectedOption.value);
                          } else {
                            updateRow(row.id, 'product_id', '');
                          }
                        }}
                        options={products
                          .filter(p => p.brand_name === row.product_brand)
                          .map(product => ({
                            value: product.id.toString(), // Convert numeric ID to string
                            label: product.product_name
                          }))}
                        placeholder="Search product..."
                        className="text-sm"
                        menuPortalTarget={document.body}
                        styles={{
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          control: (provided: any) => ({
                            ...provided,
                            minWidth: 200,
                            minHeight: 36,
                          }),
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          menuPortal: (provided: any) => ({
                            ...provided,
                            zIndex: 9999,
                          }),
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          valueContainer: (provided: any) => ({
                            ...provided,
                            paddingLeft: 8,
                            paddingRight: 8,
                          }),
                        }}
                        isSearchable
                        closeMenuOnSelect={true}
                        blurInputOnSelect={true}
                        isLoading={productsByBrandLoading && !!row.product_brand}
                      />
                    ) : (
                      <select
                        value={row.product_id}
                        onChange={(e) => updateRow(row.id, 'product_id', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!row.isNew}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.product_name + (product.brand_name ? ' (' + product.brand_name + ')' : '')}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  {/* Dynamic columns */}
                  {(() => {
                    // Filter out 'brand' and 'title'/'product' from dynamic fields since they're handled separately
                    const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
                                      
                    return dynamicFieldsFiltered.map((field) => (
                      <td key={field.name} className="px-3 py-2">
                        {renderField(field, row, (id, field, value) => updateRow(id, field, value), undefined, undefined, undefined, brandsLoading, setSuccess)}
                      </td>
                    ));
                  })()}
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id || submitLoading}
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
                          title="Delete"
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
          Total Batches: <span className="font-medium text-gray-900">{rows.length}</span>
        </div>
        <div className="text-xs text-gray-500">
          * Required fields
        </div>
      </div>
    </div>
  );
}
