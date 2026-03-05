import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import { useUserData } from '../hooks/useUserData';
import { useCategories } from '../hooks/useCategories';
import { useSubCategories } from '../hooks/useSubCategories';
import useBrands from '../hooks/useBrands';
import useProductsByBrand from '../hooks/useProductsByBrand';
import useAddProducts from '../hooks/useAddProducts';
import { dummyData } from './data';
import { accountdetails } from '../hooks/use_dynamci';
import '../styles/gradients.css';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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

interface HeaderConfig {
  key: string;
  label: string;
  className: string;
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

const renderField = (field: FieldType, row: ProductRow, updateRow: (id: string, field: keyof ProductRow, value: string | number | boolean | File) => Promise<void>, rowIndex: number, rowProductsMap: Record<string, any[]>, rowLoadingMap: Record<string, boolean>, brandsLoading: boolean, brands: string[], setSuccess: (msg: string | null) => void) => {
  const fieldMapping: Record<string, keyof ProductRow> = {
    'brand': 'brand_name',
    'title': 'product_name',
    'hsn_no': 'hsn_code',
    'description': 'generic_name',
    'gst_percentage': 'gst_percentage'
  };

  const fieldName = (fieldMapping[field.name] || field.name) as keyof ProductRow;
  const value = row[fieldName];

  switch (field.type) {
    case 'text':
    case 'textarea':
      if (field.name === 'title' && row.brand_name) {
        const rowBrandKey = `${row.id}-${row.brand_name}`;
        const relatedProducts = rowProductsMap[rowBrandKey] || [];
        const isLoading = rowLoadingMap[row.id] || false;
        const selectedProduct = relatedProducts.find((product: string) => product === String(value)) || null;

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
          value={typeof value === 'string' ? value : ''}
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
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => updateRow(row.id, fieldName, parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
          placeholder={field.label}
        />
      );

    case 'select':
      { 
        // Special handling for sub_category field to use dynamic options
        let options;
        if (field.name === 'sub_category' && row.availableSubCategories && row.availableSubCategories.length > 0) {
          options = row.availableSubCategories;
        } else {
          options = field.values?.map((opt) => {
            // Handle both structures: { value, label } and { value }
            if ('label' in opt) {
              return { value: opt.value, label: opt.label };
            } else {
              return { value: opt.value, label: opt.value };
            }
          }) || [];
        }

        return (
          <ReactSelect
            value={value ? { value: String(value), label: String(value) } : null}
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
            isDisabled={field.name === 'sub_category' && (!row.availableSubCategories || row.availableSubCategories.length === 0)}
          />
        );
      }

    case 'autocomplete':
      // Special handling for brand field
      if (field.name === 'brand') {
        // Use brands fetched from the API instead of field configuration
        const brandOptions = brands.map(brand => ({
          value: brand,
          label: brand
        }));
        
        return (
          <ReactSelect
            value={value ? { value: String(value), label: String(value) } : null}
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
            isLoading={brandsLoading}
          />
        );
      }

      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
          placeholder={field.label}
        />
      );

    case 'radio-group':
      return (
        <div className="flex gap-4">
          {field.values?.map((option, idx: number) => {
            // Handle both structures: { value, label } and { value }
            const optionLabel = 'label' in option ? option.label : option.value;
            const optionValue = option.value;
            
            return (
              <label key={idx} className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name={`${field.name}-${rowIndex}`}
                  value={optionValue}
                  checked={String(value) === String(optionValue)}
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
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updateRow(row.id, fieldName, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[36px] placeholder-nowrap"
          placeholder={field.label}
        />
      );
  }
};

const generateDynamicHeaders = (fields: FieldType[]): HeaderConfig[] => {
  const headers: HeaderConfig[] = [];

  // Reorder fields to prioritize 'brand' field first
  const reorderedFields = [...fields];
  
  // Find the brand field index
  const brandFieldIndex = reorderedFields.findIndex(field => field.name === 'brand');
  
  // If brand field exists, move it to the beginning
  if (brandFieldIndex !== -1) {
    const brandField = reorderedFields.splice(brandFieldIndex, 1)[0];
    reorderedFields.unshift(brandField);
  }

  // Process reordered fields
  reorderedFields.forEach((field) => {
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

  const [dynamicFields, setDynamicFields] = useState<FieldType[]>([]);
  const [formLoading, setFormLoading] = useState(true);
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
  
  // Use add products hook for API submission
  const { addProducts, loading: addProductsLoading, error: addProductsError } = useAddProducts();
  
  // Fetch dynamic form configuration
  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await accountdetails('product_catalogs');
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





  // Fetch brands when component mounts and when user data becomes available
  useEffect(() => {
    // Only fetch brands when user data is available and not already loaded
    if (userData && !brandsLoading && brands.length === 0) {
      fetchBrands();
    }
  }, [userData, brandsLoading, brands, fetchBrands]);

  // Initialize with one empty row when all required data is loaded
  useEffect(() => {
    // Initialize with one empty row when user data, categories, brands, and form config are loaded
    if (!userLoading && !categoriesLoading && !brandsLoading && !formLoading && rows.length === 0) {
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
  }, [userLoading, categoriesLoading, brandsLoading, formLoading, rows.length]);



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

  // Use keyboard shortcuts hook after addNewRow is defined
  useKeyboardShortcuts({
    onAddNewRow: addNewRow
  });

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
        // Find the label corresponding to the selected value
        const categoryField = dynamicFields.length > 0 ? dynamicFields : dummyData;
        const fieldData = categoryField.find(f => f.name === 'category');
        const selectedOption = fieldData?.values?.find(opt => {
          if ('label' in opt) {
            return opt.value === String(value);
          } else {
            return opt.value === String(value);
          }
        });
        
        // Extract label depending on the structure
        let categoryLabel = value as string;
        if (selectedOption && 'label' in selectedOption) {
          categoryLabel = selectedOption.label;
        } else if (selectedOption) {
          categoryLabel = selectedOption.value;
        }
        
        const subCategories = await fetchSubCategories(businessId, categoryLabel);

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
    } else if (field === 'gst_percentage') {
      // Special handling for gst_percentage to convert string to number
      const numericValue = typeof value === 'string' ? 
        parseFloat(value.replace('%', '')) || 0 : 
        typeof value === 'number' ? value : 0;
      
      setRows(rows.map(row =>
        row.id === id ? { ...row, [field]: numericValue } : row
      ));
    } else {
      // For other fields, just update normally
      setRows(rows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      ));
    }
  };

  const saveRow = async (row: ProductRow) => {
    // Validate required fields
    if (!row.product_name?.trim()) {
      setError('Product Name is required');
      return;
    }
    if (!row.brand_name?.trim()) {
      setError('Brand is required');
      return;
    }
    if (!row.category?.trim()) {
      setError('Category is required');
      return;
    }
    if (!row.sub_category?.trim()) {
      setError('Sub-category is required');
      return;
    }

    setSaving(row.id);
    setError(null);
    setSuccess(null);

    try {
      // Transform row data to match API requirements
      // Handle image conversion - if it's a string (base64), convert to File
      let imageFile: File | null = null;
      if (row.image instanceof File) {
        imageFile = row.image;
      } else if (typeof row.image === 'string' && row.image.startsWith('data:')) {
        // Convert base64 string to File
        const base64String = row.image;
        const byteString = atob(base64String.split(',')[1]);
        const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        imageFile = new File([ab], 'product-image.jpg', { type: mimeString });
      }

      const productData: Parameters<typeof addProducts>[0][0] = {
        title: row.product_name,
        brand: row.brand_name,
        category: row.category,
        description: row.generic_name || '',
        gst_percentage: String(row.gst_percentage || 0),
        has_variants: row.has_variants ? 1 : 0,
        hsn_no: row.hsn_code || '',
        image: imageFile,
        is_inventory: 1, // Default to inventory selling enabled
        prescription_required: row.prescription_required ? 1 : 0,
        sub_category: row.sub_category,
      };

      // Submit to API
      const success = await addProducts([productData]);
      
      if (success) {
        // Update local state to mark as saved
        if (row.isNew) {
          const newRows = rows.map(r => 
            r.id === row.id ? { ...row, isNew: false } : r
          );
          setRows(newRows);
        }
        setSuccess('Product saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(addProductsError || 'Failed to save product');
      }
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

  const saveAllRows = async () => {
    setError(null);
    setSuccess(null);

    const rowsToSave = rows.filter((row) => row.product_name?.trim() !== '');
    if (rowsToSave.length === 0) {
      setError('No valid products to save');
      return;
    }

    // Validate required fields for all rows
    const validationErrors = rowsToSave
      .map(row => {
        const errors = [];
        if (!row.product_name?.trim()) errors.push('Product Name');
        if (!row.brand_name?.trim()) errors.push('Brand');
        if (!row.category?.trim()) errors.push('Category');
        if (!row.sub_category?.trim()) errors.push('Sub-category');
        return errors.length > 0 ? `Row ${row.id}: Missing ${errors.join(', ')}` : null;
      })
      .filter(Boolean);

    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }

    // Transform rows to API format
    const productsData = rowsToSave.map((row) => {
      // Handle image conversion - if it's a string (base64), convert to File
      let imageFile: File | null = null;
      if (row.image instanceof File) {
        imageFile = row.image;
      } else if (typeof row.image === 'string' && row.image.startsWith('data:')) {
        // Convert base64 string to File
        const base64String = row.image;
        const byteString = atob(base64String.split(',')[1]);
        const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        imageFile = new File([ab], 'product-image.jpg', { type: mimeString });
      }

      return {
        title: row.product_name,
        brand: row.brand_name,
        category: row.category,
        description: row.generic_name || '',
        gst_percentage: String(row.gst_percentage || 0),
        has_variants: row.has_variants ? 1 : 0,
        hsn_no: row.hsn_code || '',
        image: imageFile,
        is_inventory: 1, // Default to inventory selling enabled
        prescription_required: row.prescription_required ? 1 : 0,
        sub_category: row.sub_category,
      };
    });

    try {
      const success = await addProducts(productsData);
      if (success) {
        setSuccess('All products submitted successfully');
        // Clear the form after successful submission
        setRows([]);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(addProductsError || 'Failed to submit products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit products');
    }
  };

  if (userLoading || categoriesLoading || brandsLoading || formLoading) {
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



  // Use dynamic fields fetched from API, fallback to dummy data if none loaded yet
  const currentFields = dynamicFields.length > 0 ? dynamicFields : dummyData;
  
  // Show all rows since filters have been removed
  const filteredRows = rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Master Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage products directly in the grid</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </button>
          <button
            onClick={saveAllRows}
            disabled={rows.some((row) => saving === row.id) || addProductsLoading}
            className="gradient-btn flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
        </div>
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
              {generateDynamicHeaders(currentFields).map((header) => (
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
                  {(() => {
                    // Reorder fields to prioritize 'brand' field first
                    const reorderedFields = [...currentFields];
                    
                    // Find the brand field index
                    const brandFieldIndex = reorderedFields.findIndex(field => field.name === 'brand');
                    
                    // If brand field exists, move it to the beginning
                    if (brandFieldIndex !== -1) {
                      const brandField = reorderedFields.splice(brandFieldIndex, 1)[0];
                      reorderedFields.unshift(brandField);
                    }
                    
                    return reorderedFields.map((field) => (
                      <td key={field.name} className="px-3 py-2">
                        {renderField(field, row, updateRow, rowIndex, rowProductsMap, rowLoadingMap, brandsLoading, brands, setSuccess)}
                      </td>
                    ));
                  })()}
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id || addProductsLoading}
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