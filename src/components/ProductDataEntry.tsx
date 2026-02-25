import { useState, useEffect } from 'react';
import { Plus, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useUserData } from '../hooks/useUserData';
import { useCategories } from '../hooks/useCategories';
import { useSubCategories } from '../hooks/useSubCategories';
import useBrands from '../hooks/useBrands';
import useProductsByBrand from '../hooks/useProductsByBrand';

interface OptionType {
  value: string;
  label: string;
}

interface ProductRow {
  id: string;
  isNew: boolean;
  product_name: string;
  brand_name: string;
  category: string;
  sub_category: string;
  image: File | null;
  prescription: string;
  hsn_code: string;
  gst_percentage: number | '';
  inventory_selling: boolean;
  description: string;
  has_variants: boolean;
  variant_type: string;
  status: string;
  availableSubCategories?: { value: string; label: string }[];
}

export default function ProductDataEntry() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

    const { userData, loading: userLoading, error: userError } = useUserData();
    const businessId = userData?.business_id || null;
    const subCategoryId = userData?.sub_category_id || null;

    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories(businessId, subCategoryId);
    const { fetchSubCategories, error: subCategoriesError } = useSubCategories();
    const { brands, brandsLoading, brandsError, fetchBrands } = useBrands();
    const { productsError, fetchProducts } = useProductsByBrand();
    const [rowProductsMap, setRowProductsMap] = useState<Record<string, string[]>>({});
    const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>({});
    const [rowSubCategoryLoadingMap, setRowSubCategoryLoadingMap] = useState<Record<string, boolean>>({});
    const [categoriesLoadingState, setCategoriesLoadingState] = useState<boolean>(false);



    useEffect(() => {
        if (userData && !brandsLoading && brands.length === 0) {
      fetchBrands();
    }
  }, [userData, brandsLoading, brands, fetchBrands]);

    useEffect(() => {
        if (!userLoading && !categoriesLoading && !brandsLoading && rows.length === 0) {
      setRows([{ 
        id: `initial-${Date.now()}`, 
        isNew: true, 
        product_name: '', 
        brand_name: '', 
        category: '', 
        sub_category: '', 
        image: null, 
        prescription: '', 
        hsn_code: '', 
        gst_percentage: '', 
        inventory_selling: false, 
        description: '', 
        has_variants: false, 
        variant_type: '', 
        status: 'active',
        availableSubCategories: [],
      }]);
    }
  }, [userLoading, categoriesLoading, brandsLoading, rows.length]);



  const addNewRow = () => {
    const newRow: ProductRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      product_name: '',
      brand_name: '',
      category: '',
      sub_category: '',
      image: null,
      prescription: '',
      hsn_code: '',
      gst_percentage: '',
      inventory_selling: false,
      description: '',
      has_variants: false,
      variant_type: '',
      status: 'active',
      availableSubCategories: [],
    };
    setRows([newRow, ...rows]);
  };

  const updateRow = async (id: string, field: keyof ProductRow, value: any) => {
    if (field === 'category' && businessId) {
      // Set loading state for categories
      setCategoriesLoadingState(true);

            setRows(prev => 
        prev.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
      
            if (value) {
                setRowSubCategoryLoadingMap(prev => ({ ...prev, [id]: true }));
        
        const subCategories = await fetchSubCategories(businessId, value);
        
        setRows(prev => 
          prev.map(row => {
            if (row.id === id) {
                            const shouldResetSubCategory = row.sub_category && !subCategories.some(sc => sc.value === row.sub_category);
              const newSubCategory = shouldResetSubCategory ? '' : row.sub_category;
              
              return { ...row, availableSubCategories: subCategories, sub_category: newSubCategory };
            }
            return row;
          })
        );
        
        setRowSubCategoryLoadingMap(prev => ({ ...prev, [id]: false }));
        setCategoriesLoadingState(false);
      } else {
                setRows(prev => 
          prev.map(row =>
            row.id === id ? { ...row, availableSubCategories: [], sub_category: '' } : row
          )
        );
        setRowSubCategoryLoadingMap(prev => ({ ...prev, [id]: false }));
        setCategoriesLoadingState(false);
      }
    } else if (field === 'brand_name') {
            setRows(prev => 
        prev.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
      
            if (value) {
        try {
          const brandName = value;
          const rowBrandKey = `${id}-${brandName}`;
          
                    setRowLoadingMap(prev => ({ ...prev, [id]: true }));
          
                    const productsData = await fetchProducts({ brand_name: brandName });
          
                    setRowProductsMap(prev => ({
            ...prev,
            [rowBrandKey]: [...productsData]
          }));
          
                    setRowLoadingMap(prev => ({ ...prev, [id]: false }));
        } catch (error) {
                    setRowLoadingMap(prev => ({ ...prev, [id]: false }));
        }
      } else {
                setRowProductsMap(prev => {
          const newMap = { ...prev };
                    Object.keys(newMap).forEach(key => {
            if (key.startsWith(`${id}-`)) {
              delete newMap[key];
            }
          });
          return newMap;
        });
                setRowLoadingMap(prev => ({ ...prev, [id]: false }));
      }
    } else {
            setRows(rows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      ));
    }
  };

  const saveRow = async (row: ProductRow) => {
    if (!row.product_name) {
      setError('Product Name is required');
      return;
    }

    setSaving(row.id);
    setError(null);

    try {
            if (row.isNew) {
                const newRows = rows.map(r => 
          r.id === row.id ? { ...row, isNew: false } : r
        );
        setRows(newRows);
        setSuccess('Product added successfully');
      } else {
                const newRows = rows.map(r => 
          r.id === row.id ? { ...row } : r
        );
        setRows(newRows);
        setSuccess('Product updated successfully');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (row: ProductRow) => {
    if (row.isNew) {
      setRows(rows.filter(r => r.id !== row.id));
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
            setRows(rows.filter(r => r.id !== row.id));
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const cancelNewRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const saveAllRows = async () => {
    setError(null);
    setSuccess(null);
    
    const rowsToSave = rows.filter(row => row.product_name.trim() !== '');
    if (rowsToSave.length === 0) {
      setError('No valid products to save');
      return;
    }
    for (const row of rowsToSave) {
      await saveRow(row);
    }
  };

  if (userLoading || categoriesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

    if (userError || categoriesError || subCategoriesError || brandsError || productsError) {
    setError(userError || categoriesError || subCategoriesError || brandsError || productsError || "Failed to load data");
  }

    const brandOptions = brands.map(brand => ({
    value: brand,
    label: brand
  }));

    const getProductOptions = (row: ProductRow) => {
    const rowBrandKey = `${row.id}-${row.brand_name}`;
    const productsForRow = rowProductsMap[rowBrandKey] || [];
    return productsForRow.map(product => ({
      value: product,
      label: product
    }));
  };

    const filteredRows = rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Master Data Entry</h2>
          <p className="text-gray-600 mt-1">Add and manage products directly in the grid</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </button>
          <button
            onClick={saveAllRows}
            disabled={rows.some(row => saving === row.id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
        </div>
      </div>


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
              {[
                { key: 'brand_name', label: 'Brand Name', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]' },
                { key: 'product_name', label: 'Product Name *', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]' },
                { key: 'category', label: 'Category', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'sub_category', label: 'Sub Category', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'image', label: 'Image', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[160px]' },
                { key: 'prescription', label: 'Prescription', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[110px]' },
                { key: 'hsn_code', label: 'HSN No', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]' },
                { key: 'gst_percentage', label: 'GST %', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]' },
                { key: 'description', label: 'Description', className: 'px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[180px]' },
                { key: 'inventory_selling', label: 'Inventory Selling', className: 'px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]' },
                { key: 'actions', label: 'Actions', className: 'px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]' },
              ].map((header) => (
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
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium">No products found</div>
                    <p className="text-sm">Click "Add New Product" to start adding products</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className={`${row.isNew ? 'bg-blue-50' : row.status === 'inactive' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-3 py-2">
                    <CreatableSelect
                      value={row.brand_name ? { value: row.brand_name, label: row.brand_name } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'brand_name', selectedOption?.value || '');
                      }}
                      options={brandOptions}
                      placeholder={brandsLoading ? "Loading brands..." : "Brand"}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isLoading={brandsLoading}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <CreatableSelect
                      value={row.product_name ? { value: row.product_name, label: row.product_name } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'product_name', selectedOption?.value || '');
                      }}
                      options={getProductOptions(row)}
                      placeholder={row.brand_name ? (rowLoadingMap[row.id] ? "Loading products..." : "Product Name") : "Select brand first"}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isLoading={rowLoadingMap[row.id] && !!row.brand_name}
                      isDisabled={!row.brand_name}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ReactSelect
                      value={row.category ? { value: row.category, label: row.category } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'category', selectedOption?.value || '');
                      }}
                      options={categories}
                      placeholder={categoriesLoadingState ? "Loading categories..." : (row.category ? row.category : "Category...")}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      isLoading={categoriesLoadingState}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ReactSelect
                      value={row.sub_category ? { value: row.sub_category, label: row.sub_category } : null}
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(row.id, 'sub_category', selectedOption?.value || '');
                      }}
                      options={row.availableSubCategories || []}
                      placeholder={rowSubCategoryLoadingMap[row.id] ? "Loading sub-categories..." : (row.sub_category ? row.sub_category : (row.category ? "Select sub-category..." : "SubCategory..."))}
                      className="text-sm"
                      menuPortalTarget={document.body}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minWidth: 150,
                          minHeight: 36,
                        }),
                        valueContainer: (provided) => ({
                          ...provided,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                      }}
                      isSearchable
                      isLoading={rowSubCategoryLoadingMap[row.id] && !!row.category}
                      isDisabled={!row.category}
                      closeMenuOnSelect={true}
                      blurInputOnSelect={true}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label
                      className={`flex flex-row items-center justify-center w-full h-[36px] border-2 border-dashed rounded cursor-pointer transition-colors gap-1.5 px-2 ${row.image ? 'border-green-400 bg-green-50 hover:bg-green-100' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        if (!['image/jpeg', 'image/png'].includes(file.type)) { alert('Only JPG / PNG allowed'); return; }
                        if (file.size > 1 * 1024 * 1024) { alert('Max size is 1 MB'); return; }
                        updateRow(row.id, 'image', file);
                        setSuccess('Image uploaded successfully');
                        setTimeout(() => setSuccess(null), 3000);
                      }}
                    >
                      {row.image ? (
                        <>
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} /><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21" /></svg>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-4m0 0l4 4m-4-4v9M20 16l-4-4m0 0l-4 4m4-4V3" /></svg>
                          <span className="text-[11px] text-gray-500">Click or drag image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!['image/jpeg', 'image/png'].includes(file.type)) { alert('Only JPG / PNG allowed'); return; }
                          if (file.size > 1 * 1024 * 1024) { alert('Max size is 1 MB'); return; }
                          updateRow(row.id, 'image', file);
                          setSuccess('Image uploaded successfully');
                          setTimeout(() => setSuccess(null), 3000);
                        }}
                      />
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.prescription}
                      onChange={(e) => updateRow(row.id, 'prescription', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" disabled>Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.hsn_code}
                      onChange={(e) => updateRow(row.id, 'hsn_code', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.gst_percentage}
                      onChange={(e) => updateRow(row.id, 'gst_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" disabled>Select</option>
                      <option value="5">5</option>
                      <option value="12">12</option>
                      <option value="18">18</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description"
                    />
                  </td>

                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.inventory_selling}
                      onChange={(e) => updateRow(row.id, 'inventory_selling', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
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
                          title="Deactivate"
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
          Showing: <span className="font-medium text-gray-900">{filteredRows.length}</span> products
        </div>
        <div className="text-xs text-gray-500">
          * Required fields | Click Save icon to save each row
        </div>
      </div>
    </div>
  );
}