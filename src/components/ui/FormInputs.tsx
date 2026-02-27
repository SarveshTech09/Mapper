import React from 'react';
import ReactSelect from 'react-select';

interface BrandSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BrandSelect: React.FC<BrandSelectProps> = ({ 
  value, 
  onChange, 
  options,
  isLoading = false,
  disabled = false,
  placeholder = "Search brand...",
  className = "text-sm"
}) => {
  const handleChange = (selectedOption: { value: string; label: string } | null) => {
    if (selectedOption) {
      onChange(selectedOption.value);
    } else {
      onChange('');
    }
  };

  return (
    <ReactSelect
      value={value ? { value, label: value } : null}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      className={className}
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
      isLoading={isLoading}
      isDisabled={disabled}
    />
  );
};

interface ProductSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  brandName?: string;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({ 
  value, 
  onChange, 
  options,
  isLoading = false,
  disabled = false,
  placeholder = "Search product...",
  className = "text-sm",
  brandName
}) => {
  const handleChange = (selectedOption: { value: string; label: string } | null) => {
    if (selectedOption) {
      onChange(selectedOption.value);
    } else {
      onChange('');
    }
  };

  return (
    <ReactSelect
      value={value ? { value, label: options.find(opt => opt.value === value)?.label || '' } : null}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      className={className}
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
      isLoading={isLoading}
      isDisabled={disabled}
    />
  );
};

interface UOMSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const UOMSelect: React.FC<UOMSelectProps> = ({ value, onChange, disabled, className }) => {
  const uomOptions = [
    { value: "", label: "Select UOM" },
    { value: "GM", label: "GM" },
    { value: "Pack", label: "Pack" },
    { value: "kg", label: "kg" },
    { value: "Piece", label: "Piece" },
    { value: "Box", label: "Box" },
    { value: "Bag", label: "Bag" },
    { value: "Dozen", label: "Dozen" }
  ];

  const baseClassName = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseClassName} ${className || ''}`}
      disabled={disabled}
    >
      {uomOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface TextInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  step?: string | number;
  min?: string | number;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  type = "text",
  step,
  min,
  className
}) => {
  const baseClassName = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(type === 'number' ? (e.target.value ? parseInt(e.target.value) || 0 : 0) : e.target.value)}
      className={`${baseClassName} ${className || ''}`}
      placeholder={placeholder}
      step={step}
      min={min}
      disabled={disabled}
    />
  );
};