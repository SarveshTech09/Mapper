import React from 'react';
import { BrandSelect, ProductSelect, UOMSelect, TextInput } from './FormInputs';
import { SaveButton, CancelButton, DeleteButton, AddButton } from './Buttons';

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
}

interface ParentRowProps {
  row: BatchRow;
  brands: string[];
  brandsLoading: boolean;
  products: any[];
  productsByBrandLoading: boolean;
  updateRow: (id: string, field: keyof BatchRow, value: any) => void;
  saveRow: (row: BatchRow, isChild: boolean, parentId?: string) => void;
  deleteRow: (row: BatchRow, isChild: boolean, parentId?: string) => void;
  addVariantToProduct: (parentId: string) => void;
  cancelNewRow: (id: string, isChild: boolean, parentId?: string) => void;
  saving: string | null;
  submitLoading: boolean;
}

export const ParentRow: React.FC<ParentRowProps> = ({
  row,
  brands,
  brandsLoading,
  products,
  productsByBrandLoading,
  updateRow,
  saveRow,
  deleteRow,
  addVariantToProduct,
  cancelNewRow,
  saving,
  submitLoading
}) => {
  const brandOptions = brands.map(brand => ({ value: brand, label: brand }));
  const productOptions = products
    .filter(p => p.brand_name === row.product_brand)
    .map(product => ({
      value: product.id.toString(),
      label: product.product_name
    }));

  return (
    <tr key={row.id} className={`${row.isNew ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-white/50'} transition-all duration-200`}>
      <td className="px-3 py-2">
        {row.isNew ? (
          <BrandSelect
            value={row.product_brand}
            onChange={(value) => updateRow(row.id, 'product_brand', value)}
            options={brandOptions}
            isLoading={brandsLoading}
          />
        ) : (
          <select
            value={row.product_brand}
            onChange={(e) => updateRow(row.id, 'product_brand', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
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
          <ProductSelect
            value={row.product_id}
            onChange={(value) => updateRow(row.id, 'product_id', value)}
            options={productOptions}
            isLoading={productsByBrandLoading && !!row.product_brand}
            brandName={row.product_brand}
          />
        ) : (
          <select
            value={row.product_id}
            onChange={(e) => updateRow(row.id, 'product_id', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
            disabled={!row.isNew}
          >
            <option value="">Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.product_name} {product.brand_name ? `(${product.brand_name})` : ''}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={row.variant_name}
          onChange={(value) => updateRow(row.id, 'variant_name', value)}
          placeholder="Product Name"
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2">
        <UOMSelect
          value={row.uom}
          onChange={(value) => updateRow(row.id, 'uom', value)}
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={row.value}
          onChange={(value) => updateRow(row.id, 'value', value)}
          placeholder="Value"
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={row.price}
          onChange={(value) => updateRow(row.id, 'price', value)}
          placeholder="0"
          type="number"
          step="1"
          min="0"
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={row.offer}
          onChange={(value) => updateRow(row.id, 'offer', value)}
          placeholder="0"
          type="number"
          step="1"
          min="0"
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={row.quantity}
          onChange={(value) => updateRow(row.id, 'quantity', value)}
          placeholder="0"
          type="number"
          min="0"
          disabled={!row.isNew}
        />
      </td>
      <td className="px-3 py-2 text-center sticky right-0 bg-white border-l border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <SaveButton
            onClick={() => saveRow(row, false)}
            disabled={false}
            isSaving={submitLoading}
            itemId={row.id}
            savingId={saving}
          />
          <AddButton
            onClick={() => addVariantToProduct(row.id)}
            title="Add Variant"
          />
          {row.isNew ? (
            <CancelButton
              onClick={() => cancelNewRow(row.id, false)}
              title="Cancel"
            />
          ) : (
            <DeleteButton
              onClick={() => deleteRow(row, false)}
              title="Delete"
            />
          )}
        </div>
      </td>
    </tr>
  );
};

interface ChildRowProps {
  child: BatchRow;
  parentRowId: string;
  updateRow: (id: string, field: keyof BatchRow, value: any) => void;
  saveRow: (row: BatchRow, isChild: boolean, parentId?: string) => void;
  deleteRow: (row: BatchRow, isChild: boolean, parentId?: string) => void;
  cancelNewRow: (id: string, isChild: boolean, parentId?: string) => void;
  saving: string | null;
  submitLoading: boolean;
}

export const ChildRow: React.FC<ChildRowProps> = ({
  child,
  parentRowId,
  updateRow,
  saveRow,
  deleteRow,
  cancelNewRow,
  saving,
  submitLoading
}) => {
  return (
    <tr key={child.id} className="bg-green-50/30 hover:bg-green-100/50 transition-all duration-200 border-l-4 border-green-400/50">
      <td className="px-3 py-2 text-sm text-gray-600 font-medium italic bg-green-50/20" colSpan={2}>
        Child Variant
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={child.variant_name}
          onChange={(value) => updateRow(child.id, 'variant_name', value)}
          placeholder="Variant Details"
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2">
        <UOMSelect
          value={child.uom}
          onChange={(value) => updateRow(child.id, 'uom', value)}
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={child.value}
          onChange={(value) => updateRow(child.id, 'value', value)}
          placeholder="Value"
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={child.price}
          onChange={(value) => updateRow(child.id, 'price', value)}
          placeholder="0"
          type="number"
          step="1"
          min="0"
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={child.offer}
          onChange={(value) => updateRow(child.id, 'offer', value)}
          placeholder="0"
          type="number"
          step="1"
          min="0"
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2">
        <TextInput
          value={child.quantity}
          onChange={(value) => updateRow(child.id, 'quantity', value)}
          placeholder="0"
          type="number"
          min="0"
          disabled={!child.isNew}
          className="!bg-green-50"
        />
      </td>
      <td className="px-3 py-2 text-center sticky right-0 bg-green-50 border-l border-green-200">
        <div className="flex items-center justify-center gap-2">
          <SaveButton
            onClick={() => saveRow(child, true, parentRowId)}
            disabled={false}
            isSaving={submitLoading}
            itemId={child.id}
            savingId={saving}
            title="Save Variant"
          />
          {child.isNew ? (
            <CancelButton
              onClick={() => cancelNewRow(child.id, true, parentRowId)}
              title="Cancel"
            />
          ) : (
            <DeleteButton
              onClick={() => deleteRow(child, true, parentRowId)}
              title="Delete"
            />
          )}
        </div>
      </td>
    </tr>
  );
};