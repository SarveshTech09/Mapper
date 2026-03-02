import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2, Keyboard } from 'lucide-react';
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
import { dummyData } from './data';
import { accountdetails } from '../hooks/use_dynamci';


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
  isChild: boolean;
  parentId?: string;
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
  __children?: BatchRow[];
  // Index signature to allow dynamic fields
  [key: string]: string | number | boolean | undefined | BatchRow[];
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

interface HeaderConfig {
  key: string;
  label: string;
  className: string;
}

export default function InventoryDataEntry() {
  // Add gradient button styles
  const gradientStyles = `
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
  `;

  const [dynamicFields, setDynamicFields] = useState<FieldType[]>([]);
  const [, setFormLoading] = useState(true);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [bulkOperationActive, setBulkOperationActive] = useState(false);
  
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
  
  const { submitVariant, loading: submitLoading, error: submitError } = useSubmitVariant();
  
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

  // Use dynamic fields fetched from API, fallback to dummy data if none loaded yet
  const currentFields = dynamicFields.length > 0 ? dynamicFields : dummyData;

  useEffect(() => {
    loadData();
  }, []);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      addNewRow();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const firstNewRow = rows.find(r => r.isNew);
      if (firstNewRow) {
        saveRow(firstNewRow);
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submitAllRows();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
    }
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const firstInput = document.querySelector('input, select') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.select();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showShortcuts) {
        setShowShortcuts(false);
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [rows, showShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  const [brands, setBrands] = useState<string[]>([]);
  
  // Helper function to render field based on its type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (field: FieldType, row: BatchRow, updateRow: (id: string, field: keyof BatchRow, value: string | number | boolean | File) => void, _rowIndex?: number, _rowProductsMap?: Record<string, any[]>, _rowLoadingMap?: Record<string, boolean>, brandsLoading?: boolean, setSuccess?: (msg: string | null) => void) => {
    const actualBrandsLoading = brandsLoading ?? false;
    const actualSetSuccess = setSuccess ?? (() => {});

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
          let options: { value: string; label: string }[] = [];
          if (field.name === 'sub_category' && row.availableSubCategories && Array.isArray(row.availableSubCategories) && row.availableSubCategories.length > 0) {
            // Handle the type conversion properly
            options = (row.availableSubCategories as Array<{ value: string; label: string }>).map(item => ({
              value: item.value,
              label: item.label
            }));
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
              onChange={(selectedOption: { value: string; label: string } | null) => {
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
              onChange={(selectedOption: { value: string; label: string } | null) => {
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
  
  // Helper function to generate dynamic headers
  const generateDynamicHeaders = (fields: FieldType[]): HeaderConfig[] => {
    const headers: HeaderConfig[] = [];
    
    // Add static headers for brand and product first
    headers.push({ 
      key: 'brand', 
      label: 'Brand', 
      className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' 
    });
    headers.push({ 
      key: 'product', 
      label: 'Product *', 
      className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]' 
    });
    
    // Process remaining dynamic fields
    fields.forEach((field) => {
      // Skip brand and title fields since they're handled separately
      if (field.name === 'brand' || field.name === 'title') {
        return;
      }
      
      let label = field.label;
      const key = field.name;
      let className = 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider';

      // Add required indicator
      if (field.required) {
        label += ' *';
      }

      // Set specific widths based on field name
      const widthMap: Record<string, string> = {
        'category': 'min-w-[120px]',
        'sub_category': 'min-w-[120px]',
        'hsn_no': 'min-w-[100px]',
        'gst_percentage': 'min-w-[80px]',
        'employee_percentage': 'min-w-[120px]',
        'prescription_required': 'min-w-[120px]',
        'is_inventory': 'min-w-[120px]',
        'description': 'min-w-[200px]'
      };

      const widthClass = widthMap[field.name] || 'min-w-[150px]';
      className += ` ${widthClass}`;

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
        isChild: false,
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
        __children: []
      }]);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setBrands([]);
      const errorRow: BatchRow = {
        id: `temp-${Date.now()}`,
        isNew: true,
        isChild: false,
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
        __children: []
      }]);
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
      isChild: false,
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
      __children: []
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

  const addVariantToProduct = (parentId: string) => {
    const newVariant: BatchRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      isChild: true,
      parentId: parentId,
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
      __children: []
    };

    setRows(prevRows => {
      return prevRows.map(row => {
        if (row.id === parentId) {
          return {
            ...row,
            __children: [...(row.__children || []), newVariant]
          };
        }
        return row;
      });
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(rows.map(row => {
      // Handle parent row updates
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

        if (field === 'quantity' && row.isNew) {
          updated.quantity = value;
        }

        return updated;
      }
      
      // Handle child row updates
      if (row.__children) {
        const updatedChildren = row.__children.map(child => {
          if (child.id === id) {
            return { ...child, [field]: value };
          }
          return child;
        });
        
        return { ...row, __children: updatedChildren };
      }
      
      return row;
    }));
  };

  const saveRow = async (row: BatchRow) => {
    // For child rows, we need to get the parent product info
    let productInfo = row;
    
    if (row.isChild && row.parentId) {
      // Find the parent to get product information
      const parentRow = rows.find(r => r.id === row.parentId);
      if (parentRow) {
        productInfo = {
          ...row,
          product_id: parentRow.product_id,
          product_name: parentRow.product_name,
          product_brand: parentRow.product_brand
        };
      }
    }
    
    // Check if the selected product actually exists in our products array
    const selectedProduct = products.find(p => p.id.toString() === productInfo.product_id);
    if (!selectedProduct) {
      setError('Selected product not found. Please reselect the product.');
      return;
    }

    // Ensure we have a product name
    if (!productInfo.product_name) {
      setError('Product name is missing. Please reselect the product.');
      return;
    }

    // Validate that we have a product_id
    if (!productInfo.product_id) {
      setError('Product ID is required');
      return;
    }

    // Validate required fields for variant submission
    if (!productInfo.uom) {
      setError('Unit of measure is required');
      return;
    }
    if (!productInfo.value) {
      setError('Value is required');
      return;
    }
    if (!productInfo.price || productInfo.price <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!productInfo.quantity || productInfo.quantity <= 0) {
      setError('Valid quantity is required');
      return;
    }

    setSaving(row.id);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the payload for useSubmitVariant
      const variantData = {
        product_name: productInfo.variant_name || productInfo.product_name,
        uom: productInfo.uom,
        value: productInfo.value,
        mrp: productInfo.price.toString(),
        sell_price: productInfo.offer && productInfo.offer > 0 ? productInfo.offer.toString() : productInfo.price.toString(),
        available_quantity: productInfo.quantity.toString(),
        product_id: productInfo.product_id
      };

      console.log('Submitting variant:', variantData);
      
      const success = await submitVariant(variantData);
      
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
      // If it's a child row, remove from parent's children array
      if (row.isChild && row.parentId) {
        setRows(prevRows => {
          return prevRows.map(parentRow => {
            if (parentRow.id === row.parentId && parentRow.__children) {
              return {
                ...parentRow,
                __children: parentRow.__children.filter(child => child.id !== row.id)
              };
            }
            return parentRow;
          });
        });
      } else {
        // Remove parent row
        setRows(rows.filter(r => r.id !== row.id));
      }
      return;
    }
    
    if (!confirm('Are you sure you want to delete this batch?')) {
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
  
  const cancelNewRow = (id: string, isChild: boolean = false, parentId?: string) => {
    if (isChild && parentId) {
      // Remove child from parent's children array
      setRows(prevRows => {
        return prevRows.map(parentRow => {
          if (parentRow.id === parentId && parentRow.__children) {
            return {
              ...parentRow,
              __children: parentRow.__children.filter(child => child.id !== id)
            };
          }
          return parentRow;
        });
      });
    } else {
      // Remove parent row
      setRows(rows.filter(row => row.id !== id));
    }
  };

  if (loading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Function to submit all rows with data
  const submitAllRows = async () => {
    setError(null);
    setSuccess(null);
    setBulkOperationActive(true);
    
    // Collect all rows including children
    const allRows: {row: BatchRow, isChild: boolean, parentId?: string}[] = [];
    
    rows.forEach(row => {
      // Add parent row if it has required data
      if (row.product_name && row.product_name.trim() !== '' &&
          row.uom && row.value && 
          row.price && row.price > 0 &&
          row.quantity && row.quantity > 0) {
        allRows.push({row, isChild: false});
      }
      
      // Add child rows if they exist
      if (row.__children && row.__children.length > 0) {
        row.__children.forEach(child => {
          if (child.variant_name && child.variant_name.trim() !== '' &&
              child.uom && child.value && 
              child.price && child.price > 0 &&
              child.quantity && child.quantity > 0) {
            allRows.push({row: child, isChild: true, parentId: row.id});
          }
        });
      }
    });
    
    if (allRows.length === 0) {
      setError('No valid inventory entries to submit');
      setBulkOperationActive(false);
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const {row, isChild, parentId} of allRows) {
      setSaving(row.id); // Show saving indicator for the current row
      
      try {
        // For child rows, we need to get parent product info
        let productInfo = row;
        
        if (isChild && parentId) {
          const parentRow = rows.find(r => r.id === parentId);
          if (parentRow) {
            productInfo = {
              ...row,
              product_id: parentRow.product_id,
              product_name: parentRow.product_name,
              product_brand: parentRow.product_brand
            };
          }
        }
        
        // Prepare the payload for useSubmitVariant
        const variantData = {
          product_name: productInfo.variant_name || productInfo.product_name,
          uom: productInfo.uom,
          value: productInfo.value,
          mrp: productInfo.price.toString(),
          sell_price: productInfo.offer && productInfo.offer > 0 ? productInfo.offer.toString() : productInfo.price.toString(),
          available_quantity: productInfo.quantity.toString(),
          product_id: productInfo.product_id
        };
        
        console.log(`Submitting variant for row ${row.id}:`, variantData);
        
        const success = await submitVariant(variantData);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`Error submitting row ${row.id}:`, err);
        errorCount++;
      } finally {
        setSaving(null); // Clear the saving indicator
      }
    }
    
    setBulkOperationActive(false);
    
    if (errorCount === 0) {
      setSuccess(`${successCount} variant${successCount !== 1 ? 's' : ''} submitted successfully`);
      // Reload data to clear the form
      await loadData();
    } else if (successCount === 0) {
      setError(`Failed to submit all ${allRows.length} variant${allRows.length !== 1 ? 's' : ''}`);
    } else {
      setSuccess(`${successCount} of ${allRows.length} variant${allRows.length !== 1 ? 's' : ''} submitted successfully`);
      setError(`${errorCount} variant${errorCount !== 1 ? 's' : ''} failed to submit`);
    }
    
    // Clear success/error after 5 seconds
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };
  
  return (
    <div className="space-y-4">
      <style>{gradientStyles}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage inventory directly in the grid</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Row
          </button>
          <button
            onClick={submitAllRows}
            disabled={bulkOperationActive || rows.length === 0}
            className="gradient-btn flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Keyboard Shortcuts</h3>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="text-blue-600 hover:text-blue-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + N</kbd>
              <span className="text-blue-800">Add new row</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + S</kbd>
              <span className="text-blue-800">Save first unsaved row</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + Enter</kbd>
              <span className="text-blue-800">Submit all rows</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + K</kbd>
              <span className="text-blue-800">Toggle shortcuts</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">?</kbd>
              <span className="text-blue-800">Toggle shortcuts</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + D</kbd>
              <span className="text-blue-800">Focus first input</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Ctrl/Cmd + A</kbd>
              <span className="text-blue-800">Select all text</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Escape</kbd>
              <span className="text-blue-800">Blur input/focus</span>
            </div>
          </div>
        </div>
      )}

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
              rows.flatMap((row) => [
                // Parent row
                <tr key={row.id} className={`${row.isNew ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                  {/* Static Brand column */}
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
                  
                  {/* Static Product column */}
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
                        {renderField(field, row, updateRow, undefined, undefined, undefined, brandsLoading, setSuccess)}
                      </td>
                    ));
                  })()}
                  
                  {/* Actions column */}
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id || submitLoading}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save (Ctrl/Cmd + S)"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addVariantToProduct(row.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Add Variant"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {row.isNew ? (
                        <button
                          onClick={() => cancelNewRow(row.id, false)}
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
                </tr>,
                
                // Child rows
                ...(row.__children || []).map((child) => (
                  <tr key={child.id} className="bg-green-50 hover:bg-green-100 transition-colors border-l-4 border-green-400">
                    <td className="px-3 py-2 text-sm text-gray-600 font-medium italic bg-green-50" colSpan={2}>
                      Child Variant
                    </td>
                    
                    {/* Dynamic columns for child */}
                    {(() => {
                      // Filter out 'brand' and 'title'/'product' from dynamic fields since they're handled separately
                      const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
                      
                      return dynamicFieldsFiltered.map((field) => (
                        <td key={field.name} className="px-3 py-2">
                          {renderField(field, child, updateRow, undefined, undefined, undefined, brandsLoading, setSuccess)}
                        </td>
                      ));
                    })()}
                    
                    {/* Actions column for child */}
                    <td className="px-3 py-2 text-center sticky right-0 bg-green-50">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => saveRow(child)}
                          disabled={saving === child.id || submitLoading}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                          title="Save Variant"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        {child.isNew ? (
                          <button
                            onClick={() => cancelNewRow(child.id, true, child.parentId)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteRow(child)}
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
              ])
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
        <div>
          Total Batches: <span className="font-medium text-gray-900">{rows.length}</span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs">* Required fields</span>
          <span>Ctrl/Cmd + N to add row | Ctrl/Cmd + S to save | Ctrl/Cmd + Enter to submit all | ? for shortcuts</span>
        </div>
      </div>
    </div>
  );
}
