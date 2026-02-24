import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2, Keyboard } from 'lucide-react';
import ReactSelect from 'react-select';

interface Product {
  id: string;
  product_name: string;
  brand_name?: string;
  generic_name?: string;
  has_variants: boolean;
  variant_type?: string;
  gst_percentage: number;
  strength?: string;
}

interface BatchRow {
  id: string;
  isNew: boolean;
  product_id: string;
  product_name: string;
  product_has_variants: boolean;
  product_variant_type: string;
  variant_value: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  purchase_rate: number;
  mrp: number;
  gst_percentage: number;
  initial_quantity: number;
  current_stock_qty: number;
  warehouse_location: string;
  cold_storage: boolean;
  supplier_name: string;
  purchase_invoice_no: string;
}

export default function InventoryDataEntry() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    console.log('Component mounted, loading data...');
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
  
  useEffect(() => {
    console.log('Products updated:', products);
    console.log('Products count:', products.length);
    console.log('Product details:', products.map(p => ({ id: p.id, name: p.product_name })));
  }, [products]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // First try the API
      try {
        const response = await fetch('http://localhost:5000/api/inventory-data');
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Success - Full response:', data);
          console.log('API Response type:', Array.isArray(data) ? 'array' : typeof data);
          
          // Handle the actual API response structure
          // API returns an array of batch objects with embedded product info
          let apiProducts: Product[] = [];
          let apiBatches: any[] = [];
          
          if (Array.isArray(data)) {
            // Extract unique products from batch data
            const productMap = new Map<string, Product>();
            
            data.forEach((batch: any) => {
              if (!productMap.has(batch.product_id)) {
                productMap.set(batch.product_id, {
                  id: batch.product_id,
                  product_name: batch.product_name,
                  brand_name: batch.brand_name || undefined,
                  generic_name: undefined,
                  has_variants: batch.has_variants || false,
                  variant_type: batch.variant_type || undefined,
                  gst_percentage: parseFloat(batch.gst_percentage) || 12,
                  strength: undefined
                });
              }
            });
            
            apiProducts = Array.from(productMap.values());
            apiBatches = data;
            
            console.log('Extracted products from API:', apiProducts);
            console.log('Batches from API:', apiBatches);
          } else {
            console.log('API returned unexpected format:', data);
            throw new Error('Unexpected API response format');
          }
          
          console.log('Final products to load:', apiProducts);
          
          setProducts(apiProducts);
          console.log('Products set in state:', apiProducts);
          console.log('Number of products:', apiProducts.length);
          console.log('Product names:', apiProducts.map(p => p.product_name));

          const formattedRows: BatchRow[] = apiBatches.map((batch: any) => {
            return {
              id: batch.id.toString(),
              isNew: false,
              product_id: batch.product_id.toString(),
              product_name: batch.product_name || 'Unknown',
              product_has_variants: batch.has_variants || false,
              product_variant_type: batch.variant_type || '',
              variant_value: batch.variant_value || '',
              batch_number: batch.batch_number,
              manufacturing_date: batch.manufacturing_date ? batch.manufacturing_date.split('T')[0] : '',
              expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : '',
              purchase_rate: parseFloat(batch.purchase_rate) || 0,
              mrp: parseFloat(batch.mrp) || 0,
              gst_percentage: parseFloat(batch.gst_percentage) || 12,
              initial_quantity: batch.initial_quantity || 0,
              current_stock_qty: batch.current_stock_qty || 0,
              warehouse_location: batch.warehouse_location || '',
              cold_storage: batch.cold_storage || false,
              supplier_name: batch.supplier_name || '',
              purchase_invoice_no: batch.purchase_invoice_no || '',
            };
          });

          setRows(formattedRows);
          
          // No need to initialize search terms with ReactSelect
          return;
        }
      } catch (apiError) {
        console.log('API call failed, using mock data:', apiError);
      }
      
      // Fallback to mock data if API fails
      console.log('Using mock data as fallback');
      const mockProducts: Product[] = [
        {
          id: '1',
          product_name: 'Paracetamol 500mg',
          brand_name: 'Dolo',
          has_variants: false,
          gst_percentage: 12,
        },
        {
          id: '2',
          product_name: 'Amoxicillin Capsules',
          brand_name: 'Amoxil',
          has_variants: true,
          variant_type: 'Strength',
          gst_percentage: 12,
        },
        {
          id: '3',
          product_name: 'Vitamin C',
          brand_name: 'Celin',
          has_variants: false,
          gst_percentage: 18,
        }
      ];
      
      setProducts(mockProducts);
      console.log('Mock products set:', mockProducts);
      
      // Initialize with empty rows for mock data
      setRows([]);
      
    } catch (err) {
      console.error('Load data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Initialize with empty data on error
      setProducts([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const addNewRow = () => {
    const newRow: BatchRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      product_id: '',
      product_name: '',
      product_has_variants: false,
      product_variant_type: '',
      variant_value: '',
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      purchase_rate: 0,
      mrp: 0,
      gst_percentage: 12,
      initial_quantity: 0,
      current_stock_qty: 0,
      warehouse_location: '',
      cold_storage: false,
      supplier_name: '',
      purchase_invoice_no: '',
    };
    
    setRows([newRow, ...rows]);
    
    console.log('Products available when adding new row:', products);
  };

  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };

        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.product_name = product.product_name;
            updated.gst_percentage = product.gst_percentage;
            updated.product_has_variants = product.has_variants;
            updated.product_variant_type = product.variant_type || '';
            if (!product.has_variants) {
              updated.variant_value = '';
            }
          }
        }

        if (field === 'initial_quantity' && row.isNew) {
          updated.current_stock_qty = value;
        }

        return updated;
      }
      return row;
    }));
  };

  const saveRow = async (row: BatchRow) => {
    if (!row.product_id || !row.batch_number) {
      setError('Product and Batch Number are required');
      return;
    }

    if (row.product_has_variants && !row.variant_value) {
      setError('Variant value is required for this product');
      return;
    }

    setSaving(row.id);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/batch', {
      //   method: row.isNew ? 'POST' : 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(row)
      // });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (row.isNew) {
        setSuccess('Batch added successfully');
        await loadData();
      } else {
        setSuccess('Batch updated successfully');
        await loadData();
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save batch');
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/batch/${row.id}`, {
      //   method: 'DELETE'
      // });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess('Batch deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const handleProductSelect = (rowId: string, product: Product) => {
    updateRow(rowId, 'product_id', product.id);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage inventory directly in the grid</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            title="Keyboard shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Row
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Product *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Variant
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Batch Number *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Mfg Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Expiry Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Purchase Rate
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                MRP
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">
                GST %
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Initial Qty
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Current Qty
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Location
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Supplier
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Invoice No
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Cold Storage
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
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
                        value={products.find(p => p.id === row.product_id) 
                          ? { value: row.product_id, label: `${products.find(p => p.id === row.product_id)?.product_name}${products.find(p => p.id === row.product_id)?.brand_name ? ` (${products.find(p => p.id === row.product_id)?.brand_name})` : ''}` } 
                          : null}
                        onChange={(selectedOption: { value: string; label: string } | null) => {
                          if (selectedOption) {
                            const product = products.find(p => p.id === selectedOption.value);
                            if (product) {
                              handleProductSelect(row.id, product);
                            }
                          } else {
                            updateRow(row.id, 'product_id', '');
                          }
                        }}
                        options={products.map(product => ({
                          value: product.id,
                          label: `${product.product_name}${product.brand_name ? ` (${product.brand_name})` : ''}`
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
                    {row.product_has_variants ? (
                      <input
                        type="text"
                        value={row.variant_value}
                        onChange={(e) => updateRow(row.id, 'variant_value', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={row.product_variant_type || 'Variant'}
                        disabled={!row.isNew}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm italic">N/A</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.batch_number}
                      onChange={(e) => updateRow(row.id, 'batch_number', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Batch #"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={row.manufacturing_date}
                      onChange={(e) => updateRow(row.id, 'manufacturing_date', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={row.expiry_date}
                      onChange={(e) => updateRow(row.id, 'expiry_date', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.purchase_rate}
                      onChange={(e) => updateRow(row.id, 'purchase_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.mrp}
                      onChange={(e) => updateRow(row.id, 'mrp', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.gst_percentage}
                      onChange={(e) => updateRow(row.id, 'gst_percentage', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.initial_quantity}
                      onChange={(e) => updateRow(row.id, 'initial_quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.current_stock_qty}
                      onChange={(e) => updateRow(row.id, 'current_stock_qty', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        row.current_stock_qty < 10 ? 'bg-red-50 text-red-700 font-medium' : ''
                      }`}
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.warehouse_location}
                      onChange={(e) => updateRow(row.id, 'warehouse_location', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Location"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.supplier_name}
                      onChange={(e) => updateRow(row.id, 'supplier_name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Supplier"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.purchase_invoice_no}
                      onChange={(e) => updateRow(row.id, 'purchase_invoice_no', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Invoice #"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.cold_storage}
                      onChange={(e) => updateRow(row.id, 'cold_storage', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id}
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
