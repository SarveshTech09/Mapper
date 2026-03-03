import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import useAddVariants from '../hooks/useAddVariants';
import useSubmitVariant from '../hooks/useSubmitVariant';
import useBulkSubmit from '../hooks/useBulkSubmit';
import { dummyData } from './data';
import { accountdetails } from '../hooks/use_dynamci';
import FieldRenderer from './InventoryComponents/FieldRenderer';
import { generateDynamicHeaders } from './InventoryComponents/HeaderGenerator';
import '../styles/gradients.css';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface VariantData {
  product_name: string;
  uom: string;
  value: string;
  mrp: string;
  sell_price: string;
  available_quantity: string;
  product_id: string | number;
  [key: string]: string | number;
}

interface Product {
  id: number;
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
  [key: string]: string | number | boolean | undefined | BatchRow[];
}

export default function InventoryDataEntry() {

  const [dynamicFields, setDynamicFields] = useState<FieldType[]>([]);
  const [formLoading, setFormLoading] = useState(true);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
  
  const { loading: submitLoading, error: submitError } = useSubmitVariant();
  const { submitBulkData, submitSingleData, loading: bulkLoading, error: bulkError } = useBulkSubmit();

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await accountdetails('product_variants_ayurvedic');
        if (response.success && response.fields) {
          setDynamicFields(response.fields);
        } else {
          console.error('Failed to fetch form configuration:', response);
          setDynamicFields(dummyData);
        }
      } catch (error) {
        console.error('Error fetching form configuration:', error);
        setDynamicFields(dummyData);
      } finally {
        setFormLoading(false);
      }
    };
    
    fetchFormConfig();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const currentFields = dynamicFields.length > 0 ? dynamicFields : dummyData;
  const [saving, setSaving] = useState<string | null>(null);
  
  const saveRow = async (row: BatchRow, isChild: boolean = false, parentId?: string, skipReload: boolean = false) => {
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

    const selectedProduct = products.find(p => p.id.toString() === productInfo.product_id);
    if (!selectedProduct) {
      setError('Selected product not found. Please reselect the product.');
      return false;
    }

    if (!productInfo.product_name) {
      setError('Product name is missing. Please reselect the product.');
      return false;
    }

    if (!productInfo.product_id) {
      setError('Product ID is required');
      return false;
    }

    setSaving(row.id);
    setError(null);

    try {
      const payload: any = {
        product_name: productInfo.variant_name || productInfo.product_name,
        uom: productInfo.uom || 'Piece',
        value: productInfo.value || '1',
        mrp: productInfo.price?.toString() || '0',
        sell_price: productInfo.offer?.toString() || productInfo.price?.toString() || '0',
        available_quantity: productInfo.quantity?.toString() || '0',
        product_id: productInfo.product_id
      };

      currentFields.forEach(field => {
        if (field.name in productInfo && !['product_name', 'product_brand', 'uom', 'value', 'mrp', 'sell_price', 'available_quantity', 'product_id', 'variant_name', 'price', 'offer', 'quantity'].includes(field.name)) {
          payload[field.name] = productInfo[field.name as keyof BatchRow] as string;
        }
      });
      
      console.log('Submitting variant:', payload);
      
      const result = await submitSingleData(payload);
      
      if (result) {
        if (!skipReload) {
          setSuccess('Variant added successfully');
          await loadData();
        }
        return true;
      } else {
        setError('Failed to submit variant');
        return false;
      }
    } catch (err) {
      console.error('Error saving row:', err);
      setError(err instanceof Error ? err.message : 'Failed to save variant');
      return false;
    } finally {
      setSaving(null);
    }
  };

  const [brands, setBrands] = useState<string[]>([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      };
      
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

  const loadProductsForBrand = async (brandName: string) => {
    try {
      const brandProducts = await fetchProductsByBrand(brandName);
      
      if (productsByBrandError) {
        setError(productsByBrandError);
        return [];
      }
      
      const transformedProducts: Product[] = brandProducts.map((product: any) => ({
        id: product.id,
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
    
    currentFields.forEach(field => {
      if (!(field.name in newRow) && field.name !== 'brand' && field.name !== 'title') {
        newRow[field.name] = '';
      }
    });
    
    setRows([newRow, ...rows]);
  };

  // Use keyboard shortcuts hook after addNewRow is defined
  useKeyboardShortcuts({
    onAddNewRow: addNewRow
  });

  const addVariantToProduct = (parentId: string) => {
    const parentRow = rows.find(r => r.id === parentId);
    const newVariant: BatchRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      isChild: true,
      parentId: parentId,
      product_id: parentRow ? parentRow.product_id : '',
      product_name: parentRow ? parentRow.product_name : '',
      product_brand: parentRow ? parentRow.product_brand : '',
      product_has_variants: parentRow ? parentRow.product_has_variants : false,
      product_variant_type: parentRow ? parentRow.product_variant_type : '',
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

  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };

        if (field === 'product_brand') {
          updated.product_id = '';
          updated.product_name = '';
          
          if (value) {
            loadProductsForBrand(value).then(brandProducts => {
              setProducts(prevProducts => {
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
            
            if (updated.__children && updated.__children.length > 0) {
              updated.__children = updated.__children.map(child => ({
                ...child,
                product_id: updated.product_id,
                product_name: updated.product_name,
                product_brand: updated.product_brand,
                product_has_variants: updated.product_has_variants,
                product_variant_type: updated.product_variant_type
              }));
            }
          }
        }

        return updated;
      }
      
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

  const deleteRow = async (row: BatchRow) => {
    if (row.isNew) {
      setRows(rows.filter(r => r.id !== row.id));
      return;
    }
    if (!confirm('Are you sure you want to delete this row?')) {
      return;
    }

    try {
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
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const submitAllRows = async () => {
    setError(null);
    setSuccess(null);
    setBulkOperationActive(true);
    
    try {
      const productGroups: Record<string, BatchRow[]> = {};
      
      const allValidRows: BatchRow[] = [];
      
      rows.forEach(row => {
        if (row.product_id) {
          allValidRows.push(row);
          if (row.__children && row.__children.length > 0) {
            row.__children.forEach(child => {
              if (child.product_id) {
                allValidRows.push(child);
              }
            });
          }
        }
      });
      
      if (allValidRows.length === 0) {
        setError('No valid inventory entries to submit');
        setBulkOperationActive(false);
        return;
      }
      
      allValidRows.forEach(row => {
        const productId = row.product_id.toString();
        if (!productGroups[productId]) {
          productGroups[productId] = [];
        }
        productGroups[productId].push(row);
      });
      
      const productsPayload = Object.values(productGroups).map(group => {
        const firstRow = group[0];
        const product = products.find(p => p.id.toString() === firstRow.product_id.toString());
        
        const variants = group.map(row => {
          const variantData: VariantData = {
            product_name: row.variant_name || row.product_name,
            uom: row.uom || 'Piece',
            value: row.value || '1',
            mrp: row.price?.toString() || '0',
            sell_price: row.offer?.toString() || row.price?.toString() || '0',
            available_quantity: row.quantity?.toString() || '0',
            product_id: row.product_id,
          };
          
          currentFields.forEach(field => {
            if (field.name in row && 
                !['product_name', 'product_brand', 'uom', 'value', 'mrp', 'sell_price', 'available_quantity', 'product_id', 'variant_name', 'price', 'offer', 'quantity', 'brand', 'title', 'category', 'gst_percentage'].includes(field.name)) {
              variantData[field.name] = row[field.name as keyof BatchRow] as string;
            }
          });
          
          return variantData;
        });
        
        const productData: any = {
          title: product?.product_name || firstRow.product_name,
          brand: firstRow.product_brand,
          category: '',
          gst_percentage: 0,
          has_variants: variants.length > 1 ? 1 : 0,
          variants: variants
        };
        
        currentFields.forEach(field => {
          if (field.name in firstRow) {
            const value = firstRow[field.name as keyof BatchRow];
            if (field.name === 'category') {
              productData.category = value as string;
            } else if (field.name === 'gst_percentage') {
              const gstValue = value as string;
              productData.gst_percentage = gstValue ? parseFloat(gstValue.replace('%', '')) : 0;
            } else if (!['product_name', 'product_brand', 'uom', 'value', 'mrp', 'sell_price', 'available_quantity', 'product_id', 'variant_name', 'price', 'offer', 'quantity', 'title', 'brand'].includes(field.name)) {
              productData[field.name] = value;
            }
          }
        });
        
        return productData;
      });
      
      const payload = {
        products: productsPayload
      };
      
      console.log('Submitting bulk data:', JSON.stringify(payload, null, 2));
      
      const result = await submitBulkData(payload);
      
      if (result) {
        setSuccess(`${allValidRows.length} item${allValidRows.length !== 1 ? 's' : ''} submitted successfully`);
        await loadData();
      } else {
        setError(bulkError || 'Failed to submit bulk data');
      }
      
    } catch (err) {
      console.error('Error in bulk submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit bulk data');
    } finally {
      setBulkOperationActive(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
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
          <button
            onClick={submitAllRows}
            disabled={bulkOperationActive || bulkLoading || rows.length === 0}
            className="gradient-btn flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {bulkLoading ? 'Submitting...' : 'Submit All'}
          </button>
        </div>
      </div>

      {(error || submitError || bulkError) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || submitError || bulkError}</span>
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
                            value: product.id.toString(),
                            label: product.product_name
                          }))}
                        placeholder="Search product..."
                        className="text-sm"
                        menuPortalTarget={document.body}
                        styles={{
                          control: (provided: any) => ({
                            ...provided,
                            minWidth: 200,
                            minHeight: 36,
                          }),
                          menuPortal: (provided: any) => ({
                            ...provided,
                            zIndex: 9999,
                          }),
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
                  {(() => {
                    const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
                    return dynamicFieldsFiltered.map((field) => (
                      <td key={field.name} className="px-3 py-2">
                        <FieldRenderer 
                          field={field} 
                          row={row} 
                          updateRow={updateRow}
                          brandsLoading={brandsLoading}
                          setSuccess={setSuccess}
                        />
                      </td>
                    ));
                  })()}
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={async () => await saveRow(row, false)}
                        disabled={saving === row.id || submitLoading}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
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
                ...(row.__children || []).map((child) => (
                  <tr key={child.id} className="bg-green-50 hover:bg-green-100 transition-colors border-l-4 border-green-400">
                    <td className="px-3 py-2 text-sm text-gray-600 font-medium italic bg-green-50" colSpan={2}>
                      Child Variant
                    </td>
                    {(() => {
                      const dynamicFieldsFiltered = currentFields.filter(field => field.name !== 'brand' && field.name !== 'title');
                      return dynamicFieldsFiltered.map((field) => (
                        <td key={field.name} className="px-3 py-2">
                          <FieldRenderer 
                            field={field} 
                            row={child} 
                            updateRow={updateRow}
                            brandsLoading={brandsLoading}
                            setSuccess={setSuccess}
                          />
                        </td>
                      ));
                    })()}
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
        <div className="text-xs text-gray-500">
          * Required fields
        </div>
      </div>
    </div>
  );
}