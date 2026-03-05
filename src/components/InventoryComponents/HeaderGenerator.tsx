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

export const generateDynamicHeaders = (fields: FieldType[]): HeaderConfig[] => {
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