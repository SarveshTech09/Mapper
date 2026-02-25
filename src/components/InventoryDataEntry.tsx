import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2, Keyboard } from 'lucide-react';
import ReactSelect from 'react-select';

interface Product {
  id: string;
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

  const loadData = async () => {
    try {
      setLoading(true);

      // Fallback to mock data if API fails
      const mockProducts: Product[] = [
        {
          id: '1',
          product_name: 'Paracetamol 500mg',
          brand_name: 'Dolo',
          has_variants: false,
        },
        {
          id: '2',
          product_name: 'Amoxicillin Capsules',
          brand_name: 'Amoxil',
          has_variants: true,
          variant_type: 'Strength',
        },
        {
          id: '3',
          product_name: 'Vitamin C',
          brand_name: 'Celin',
          has_variants: false,
        }
      ];
      
      setProducts(mockProducts);
      setRows([{
        id: `temp-${Date.now()}`,
        isNew: true,
        product_id: '',
        product_name: '',
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
      setError(err instanceof Error ? err.message : 'Failed to load data');
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

        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.product_name = product.product_name;
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
    if (!row.product_id || !row.variant_name) {
      setError('Product and Variant Name are required');
      return;
    }

    if (row.product_has_variants && !row.variant_name) {
      setError('Variant name is required for this product');
      return;
    }

    setSaving(row.id);
    setError(null);

    try {
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
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
                            updateRow(row.id, 'product_id', selectedOption.value);
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
                      value={row.price}
                      onChange={(e) => updateRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.offer}
                      onChange={(e) => updateRow(row.id, 'offer', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={!row.isNew}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', parseInt(e.target.value) || 0)}
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
