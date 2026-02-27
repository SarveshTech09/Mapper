import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, X, Keyboard, AlertCircle, Check } from 'lucide-react';
import useAddVariants from '../hooks/useAddVariants';
import useSubmitVariant from '../hooks/useSubmitVariant';
import { LoadingSpinner } from './ui/StatusMessages';
import { ParentRow, ChildRow } from './ui/TableRowComponents';

interface Product {
  id: number; // Original numeric ID from API
  product_name: string;
  brand_name?: string;
  has_variants: boolean;
  variant_type?: string;
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
    // Prevent shortcuts from firing when typing in input fields
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
      // Focus on the first input field of the first row
      const firstInput = document.querySelector('input, select') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      // Select all text in currently focused input
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.select();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      // Close shortcuts panel if open
      if (showShortcuts) {
        setShowShortcuts(false);
      }
      // Blur current input focus
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
      
      // Initialize with one empty parent row
      setRows([{
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
      setRows([{
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
      quantity: 0
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

  const saveRow = async (row: BatchRow, isChild: boolean = false, parentId?: string) => {
    // For child rows, we need to get the parent product info
    let productInfo = row;
    
    if (isChild && parentId) {
      // Find the parent to get product information
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

  const deleteRow = async (row: BatchRow, isChild: boolean = false, parentId?: string) => {
    if (row.isNew) {
      if (isChild && parentId) {
        // Remove child from parent's children array
        setRows(prevRows => {
          return prevRows.map(parentRow => {
            if (parentRow.id === parentId && parentRow.__children) {
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
      
      setSuccess('Batch deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="medium" />
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
      <style>{`
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
        .card-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">Inventory Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage inventory directly in the grid</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add New Row
          </button>
          <button
            onClick={submitAllRows}
            disabled={bulkOperationActive || rows.length === 0}
            className="gradient-btn flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 text-sm hover:scale-105"
            title="Keyboard shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>
  
      {showShortcuts && (
        <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 border border-blue-200/50 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Keyboard className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900 text-lg">Keyboard Shortcuts</h3>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-all duration-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + N</kbd>
              <span className="text-blue-800 font-medium">Add new row</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + S</kbd>
              <span className="text-blue-800 font-medium">Save first unsaved row</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + Enter</kbd>
              <span className="text-blue-800 font-medium">Submit all rows</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + K</kbd>
              <span className="text-blue-800 font-medium">Toggle shortcuts</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">?</kbd>
              <span className="text-blue-800 font-medium">Toggle shortcuts</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + D</kbd>
              <span className="text-blue-800 font-medium">Focus first input</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Ctrl/Cmd + A</kbd>
              <span className="text-blue-800 font-medium">Select all in field</span>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <kbd className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-mono text-xs shadow-sm">Esc</kbd>
              <span className="text-blue-800 font-medium">Close panels/blur focus</span>
            </div>
          </div>
        </div>
      )}
  
      {(error || submitError) && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-200/50 rounded-xl text-red-700 shadow-sm backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-medium">{error || submitError}</span>
          <button 
            onClick={() => {
              setError(null);
              // Clear submit error if needed
            }} 
            className="ml-auto hover:bg-red-100 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-200/50 rounded-xl text-green-700 shadow-sm backdrop-blur-sm">
          <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="font-medium">{success}</span>
        </div>
      )}
  
      <div className="overflow-x-auto card-glass rounded-2xl shadow-xl border border-white/30 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-white/50 sticky top-0 backdrop-blur-sm border-b border-gray-200/30">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px] bg-white/30">
                Brand
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px] bg-white/30">
                Product *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px] bg-white/30">
                Variant Name *
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px] bg-white/30">
                UOM
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] bg-white/30">
                Value
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] bg-white/30">
                Price
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] bg-white/30">
                Offer
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px] bg-white/30">
                Quantity
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-white min-w-[150px] border-l border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200/30">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">No inventory data yet</div>
                    <p className="text-sm text-gray-600">Click "Add New Row" or press Ctrl/Cmd + N to start adding inventory</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <>
                  <ParentRow
                    row={row}
                    brands={brands}
                    brandsLoading={brandsLoading}
                    products={products}
                    productsByBrandLoading={productsByBrandLoading}
                    updateRow={updateRow}
                    saveRow={saveRow}
                    deleteRow={deleteRow}
                    addVariantToProduct={addVariantToProduct}
                    cancelNewRow={cancelNewRow}
                    saving={saving}
                    submitLoading={submitLoading}
                  />
                    
                  {/* Child Rows */}
                  {row.__children && row.__children.map((child) => (
                    <ChildRow
                      child={child}
                      parentRowId={row.id}
                      updateRow={updateRow}
                      saveRow={saveRow}
                      deleteRow={deleteRow}
                      cancelNewRow={cancelNewRow}
                      saving={saving}
                      submitLoading={submitLoading}
                    />
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
  
      <div className="flex items-center justify-between text-sm text-gray-600 bg-white/30 px-4 py-3 rounded-xl border border-gray-200/30 backdrop-blur-sm">
        <div>
          Total Batches: <span className="font-medium text-gray-900 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">{rows.length}</span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs">* Required fields</span>
          <span>Ctrl/Cmd + N to add row | Ctrl/Cmd + S to save | ? for shortcuts</span>
        </div>
      </div>
    </div>
  );
}
