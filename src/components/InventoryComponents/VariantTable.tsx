import { Save, X, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';

interface OptionType {
  value: string;
  label: string;
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

export interface BatchRow {
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

interface VariantTableProps {
  row: BatchRow;
  currentFields: FieldType[];
  brandsLoading: boolean;
  saving: string | null;
  submitLoading: boolean;
  updateRow: (id: string, field: keyof BatchRow, value: any) => void;
  saveRow: (row: BatchRow, isChild?: boolean, parentId?: string, skipReload?: boolean) => Promise<boolean>;
  cancelNewRow: (id: string, isChild?: boolean, parentId?: string) => void;
  deleteRow: (row: BatchRow) => Promise<void>;
  setSuccess: (msg: string | null) => void;
}

const VariantTable: React.FC<VariantTableProps> = ({
  row,
  currentFields,
  brandsLoading,
  saving,
  submitLoading,
  updateRow,
  saveRow,
  cancelNewRow,
  deleteRow,
  setSuccess
}) => {
  // Helper function to render field based on its type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (field: FieldType, row: BatchRow, updateRow: (id: string, field: keyof BatchRow, value: string | number | boolean | File) => void, _rowIndex?: number, _rowProductsMap?: Record<string, any[]>, _rowLoadingMap?: Record<string, boolean>, brandsLoading?: boolean, setSuccess?: (msg: string | null) => void) => {
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
          let options: OptionType[] = [];
          if (field.name === 'sub_category' && row.availableSubCategories && Array.isArray(row.availableSubCategories) && row.availableSubCategories.length > 0) {
            // Ensure availableSubCategories contains proper option objects
            const subCategoryOptions = row.availableSubCategories as unknown as OptionType[];
            options = subCategoryOptions.map((opt) => {
              if (opt && typeof opt === 'object' && 'label' in opt && 'value' in opt) {
                return { value: String(opt.value), label: String(opt.label) };
              } else {
                return { value: String(opt), label: String(opt) };
              }
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldValues = field.values as any[];
            options = (fieldValues || []).map((opt) => {
              // Handle both structures: { value, label } and { value }
              if (opt && typeof opt === 'object' && 'label' in opt) {
                return { value: String(opt.value), label: String(opt.label) };
              } else {
                return { value: String(opt?.value), label: String(opt?.value) };
              }
            });
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

  return (
    <>
      {(row.__children || []).map((child) => (
        <tr key={child.id} className="bg-green-50 hover:bg-green-100 transition-colors border-l-4 border-green-400">
          <td className="px-3 py-2 text-sm text-gray-600 font-medium italic bg-green-50" colSpan={2}>
            Child Variant
          </td>
          
          {/* Dynamic columns for child - make sure to pass the child row data correctly */}
          {(() => {
            // Filter out 'brand' and 'title'/'product' from dynamic fields since they're handled separately
            const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
            
            return dynamicFieldsFiltered.map((field) => (
              <td key={field.name} className="px-3 py-2">
                {renderField(field, child, (id, field, value) => updateRow(id, field, value), undefined, undefined, undefined, brandsLoading, setSuccess)}
              </td>
            ));
          })()}
          
          {/* Actions column for child */}
          <td className="px-3 py-2 text-center sticky right-0 bg-green-50">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={async () => await saveRow(child, true, row.id)}
                disabled={saving === child.id || submitLoading}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                title="Save Variant"
              >
                <Save className="w-4 h-4" />
              </button>
              {child.isNew ? (
                <button
                  onClick={() => cancelNewRow(child.id, true, row.id)}
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
      ))}
    </>
  );
};

export default VariantTable;