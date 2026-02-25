import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2, Keyboard } from 'lucide-react';
import ReactSelect from 'react-select';
import useAddVariants from '../hooks/useAddVariants';
import useSubmitVariant from '../hooks/useSubmitVariant';


interface Product {
  id: number; // Original numeric ID from API
  product_name: string;
  brand_name?: string;
  has_variants: boolean;
  variant_type?: string;
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
}

export default function InventoryDataEntry() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Track bulk operation state
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
  

  useEffect(() => {
    loadData();
  }, []);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
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
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    }
  }, [rows]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

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
      
      // Initialize with one empty row
      setRows([{
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
      }]);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setBrands([]);
      setRows([{
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
      }]);
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
      
      // Transform to Product format - use original numeric ID directly
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
    
    setRows([newRow, ...rows]);
  };

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

        if (field === 'quantity' && row.isNew) {
          updated.quantity = value;
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

    // Validate required fields for variant submission
    if (!row.uom) {
      setError('Unit of measure is required');
      return;
    }
    if (!row.value) {
      setError('Value is required');
      return;
    }
    if (!row.price || row.price <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!row.quantity || row.quantity <= 0) {
      setError('Valid quantity is required');
      return;
    }

    setSaving(row.id);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the payload for useSubmitVariant
      const variantData = {
        product_name: row.product_name,
        uom: row.uom,
        value: row.value,
        mrp: row.price.toString(),
        sell_price: row.offer && row.offer > 0 ? row.offer.toString() : row.price.toString(),
        available_quantity: row.quantity.toString(),
        product_id: row.product_id
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
      setRows(rows.filter(r => r.id !== row.id));
      return;
    }
    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess('Batch deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };
  
  const cancelNewRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  if (loading) {
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
    
    // Filter rows with required data
    const rowsWithRequiredData = rows.filter(row => 
      row.product_name && 
      row.product_name.trim() !== '' &&
      row.uom && 
      row.value && 
      row.price && row.price > 0 &&
      row.quantity && row.quantity > 0
    );
    
    if (rowsWithRequiredData.length === 0) {
      setError('No valid inventory entries to submit');
      setBulkOperationActive(false);
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of rowsWithRequiredData) {
      setSaving(row.id); // Show saving indicator for the current row
      
      try {
        // Prepare the payload for useSubmitVariant
        const variantData = {
          product_name: row.product_name,
          uom: row.uom,
          value: row.value,
          mrp: row.price.toString(),
          sell_price: row.offer && row.offer > 0 ? row.offer.toString() : row.price.toString(),
          available_quantity: row.quantity.toString(),
          product_id: row.product_id
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
      setError(`Failed to submit all ${rowsWithRequiredData.length} variant${rowsWithRequiredData.length !== 1 ? 's' : ''}`);
    } else {
      setSuccess(`${successCount} of ${rowsWithRequiredData.length} variant${rowsWithRequiredData.length !== 1 ? 's' : ''} submitted successfully`);
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
            disabled={bulkOperationActive || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            title="Keyboard shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
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
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">?</kbd>
              <span className="text-blue-800">Toggle shortcuts</span>
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Brand
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Product *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Variant Name *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                UOM
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Value
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Price
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Offer
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium">No inventory data yet</div>
                    <p className="text-sm">Click "Add New Row" or press Ctrl/Cmd + N to start adding inventory</p>
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
                          ? { value: row.product_id, label: `${products.find(p => p.id.toString() === row.product_id)?.product_name}${products.find(p => p.id.toString() === row.product_id)?.brand_name ? ` (${products.find(p => p.id.toString() === row.product_id)?.brand_name})` : ''}` }
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
                            {product.product_name} {product.brand_name ? `(${product.brand_name})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.variant_name}
                      onChange={(e) => updateRow(row.id, 'variant_name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Variant Name"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.uom}
                      onChange={(e) => updateRow(row.id, 'uom', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!row.isNew}
                    >
                      <option value="">Select UOM</option>
                      <option value="GM">GM</option>
                      <option value="Pack">Pack</option>
                      <option value="kg">kg</option>
                      <option value="Piece">Piece</option>
                      <option value="Box">Box</option>
                      <option value="Bag">Bag</option>
                      <option value="Dozen">Dozen</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Value"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.price || ''}
                      onChange={(e) => updateRow(row.id, 'price', e.target.value ? parseInt(e.target.value) || 0 : 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      step="1"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.offer || ''}
                      onChange={(e) => updateRow(row.id, 'offer', e.target.value ? parseInt(e.target.value) || 0 : 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      step="1"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.quantity || ''}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value ? parseInt(e.target.value) || 0 : 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
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
          * Required fields | Ctrl/Cmd + N to add row | Ctrl/Cmd + S to save | ? for shortcuts
        </div>
      </div>
    </div>
  );
}
