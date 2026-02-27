import { useState, useEffect } from "react";
import { Plus, Save, X, AlertCircle, Check, Trash2 } from "lucide-react";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";
import { useUserData } from "../hooks/useUserData";
import { useCategories } from "../hooks/useCategories";
import { useSubCategories } from "../hooks/useSubCategories";
import useBrands from "../hooks/useBrands";
import useProductsByBrand from "../hooks/useProductsByBrand";
import useAddProducts from "../hooks/useAddProducts";

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
  gst_percentage: number | "";
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

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories(businessId, subCategoryId);
  const { fetchSubCategories, error: subCategoriesError } = useSubCategories();
  const { brands, brandsLoading, brandsError, fetchBrands } = useBrands();
  const { productsError, fetchProducts } = useProductsByBrand();
  const {
    addProducts,
    loading: addProductsLoading,
    error: addProductsError,
  } = useAddProducts();
  const [rowProductsMap, setRowProductsMap] = useState<
    Record<string, string[]>
  >({});
  const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>(
    {},
  );
  const [rowSubCategoryLoadingMap, setRowSubCategoryLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [categoriesLoadingState, setCategoriesLoadingState] =
    useState<boolean>(false);

  useEffect(() => {
    if (userData && !brandsLoading && brands.length === 0) {
      fetchBrands();
    }
  }, [userData, brandsLoading, brands, fetchBrands]);

  useEffect(() => {
    if (
      !userLoading &&
      !categoriesLoading &&
      !brandsLoading &&
      rows.length === 0
    ) {
      setRows([
        {
          id: `initial-${Date.now()}`,
          isNew: true,
          product_name: "",
          brand_name: "",
          category: "",
          sub_category: "",
          image: null,
          prescription: "",
          hsn_code: "",
          gst_percentage: "",
          inventory_selling: false,
          description: "",
          has_variants: false,
          variant_type: "",
          status: "active",
          availableSubCategories: [],
        },
      ]);
    }
  }, [userLoading, categoriesLoading, brandsLoading, rows.length]);

  const addNewRow = () => {
    const newRow: ProductRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      product_name: "",
      brand_name: "",
      category: "",
      sub_category: "",
      image: null,
      prescription: "",
      hsn_code: "",
      gst_percentage: "",
      inventory_selling: false,
      description: "",
      has_variants: false,
      variant_type: "",
      status: "active",
      availableSubCategories: [],
    };
    setRows([newRow, ...rows]);
  };

  const updateRow = async (id: string, field: keyof ProductRow, value: any) => {
    if (field === "category" && businessId) {
      // Set loading state for categories
      setCategoriesLoadingState(true);

      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );

      if (value) {
        setRowSubCategoryLoadingMap((prev) => ({ ...prev, [id]: true }));

        const subCategories = await fetchSubCategories(businessId, value);

        setRows((prev) =>
          prev.map((row) => {
            if (row.id === id) {
              const shouldResetSubCategory =
                row.sub_category &&
                !subCategories.some((sc) => sc.value === row.sub_category);
              const newSubCategory = shouldResetSubCategory
                ? ""
                : row.sub_category;

              return {
                ...row,
                availableSubCategories: subCategories,
                sub_category: newSubCategory,
              };
            }
            return row;
          }),
        );

        setRowSubCategoryLoadingMap((prev) => ({ ...prev, [id]: false }));
        setCategoriesLoadingState(false);
      } else {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, availableSubCategories: [], sub_category: "" }
              : row,
          ),
        );
        setRowSubCategoryLoadingMap((prev) => ({ ...prev, [id]: false }));
        setCategoriesLoadingState(false);
      }
    } else if (field === "brand_name") {
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );

      if (value) {
        try {
          const brandName = value;
          const rowBrandKey = `${id}-${brandName}`;

          setRowLoadingMap((prev) => ({ ...prev, [id]: true }));
          const productsData = await fetchProducts({ brand_name: brandName });
          setRowProductsMap((prev) => ({
            ...prev,
            [rowBrandKey]: [...productsData],
          }));

          setRowLoadingMap((prev) => ({ ...prev, [id]: false }));
        } catch (error) {
          setRowLoadingMap((prev) => ({ ...prev, [id]: false }));
        }
      } else {
        setRowProductsMap((prev) => {
          const newMap = { ...prev };
          Object.keys(newMap).forEach((key) => {
            if (key.startsWith(`${id}-`)) {
              delete newMap[key];
            }
          });
          return newMap;
        });
        setRowLoadingMap((prev) => ({ ...prev, [id]: false }));
      }
    } else {
      setRows(
        rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
    }
  };

  const saveRow = async (row: ProductRow) => {
    if (!row.product_name) {
      setError("Product Name is required");
      return;
    }

    setSaving(row.id);
    setError(null);

    try {
      const productData = [
        {
          brand: row.brand_name,
          category: row.category,
          description: row.description,
          gst_percentage:
            row.gst_percentage === "" ? "0" : String(row.gst_percentage),
          has_variants: row.has_variants ? 1 : 0,
          hsn_no: row.hsn_code,
          image: row.image,
          is_inventory: row.inventory_selling ? 1 : 0,
          prescription_required: row.prescription === "yes" ? 1 : 0,
          sub_category: row.sub_category,
          title: row.product_name,
        },
      ];
      const success = await addProducts(productData);

      if (success) {
        if (row.isNew) {
          const newRows = rows.map((r) =>
            r.id === row.id ? { ...row, isNew: false } : r,
          );
          setRows(newRows);
          setSuccess("Product submitted successfully");
        } else {
          const newRows = rows.map((r) => (r.id === row.id ? { ...row } : r));
          setRows(newRows);
          setSuccess("Product updated successfully");
        }

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(addProductsError || "Failed to submit product");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (row: ProductRow) => {
    if (row.isNew) {
      setRows(rows.filter((r) => r.id !== row.id));
      return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setRows(rows.filter((r) => r.id !== row.id));
      setSuccess("Product deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const cancelNewRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const saveAllRows = async () => {
    setError(null);
    setSuccess(null);

    const rowsToSave = rows.filter((row) => row.product_name.trim() !== "");
    if (rowsToSave.length === 0) {
      setError("No valid products to save");
      return;
    }

    // Transform rows to API format
    const productsData = rowsToSave.map((row) => ({
      brand: row.brand_name,
      category: row.category,
      description: row.description,
      gst_percentage:
        row.gst_percentage === "" ? "" : row.gst_percentage.toString(),
      has_variants: row.has_variants ? 1 : 0,
      hsn_no: row.hsn_code, // This will be transformed to hsn_code in the hook
      image: row.image,
      is_inventory: row.inventory_selling ? 1 : 0,
      prescription_required: row.prescription === "yes" ? 1 : 0,
      sub_category: row.sub_category,
      title: row.product_name,
    }));

    try {
      const success = await addProducts(productsData);
      if (success) {
        setSuccess("All products submitted successfully");
        // Clear the form after successful submission
        setRows([]);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(addProductsError || "Failed to submit products");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit products",
      );
    }
  };

  if (userLoading || categoriesLoading || brandsLoading || addProductsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          {addProductsLoading ? "Submitting products..." : "Loading..."}
        </span>
      </div>
    );
  }

  if (
    userError ||
    categoriesError ||
    subCategoriesError ||
    brandsError ||
    productsError
  ) {
    setError(
      userError ||
        categoriesError ||
        subCategoriesError ||
        brandsError ||
        productsError ||
        "Failed to load data",
    );
  }

  const brandOptions = brands.map((brand) => ({
    value: brand,
    label: brand,
  }));

  const getProductOptions = (row: ProductRow) => {
    const rowBrandKey = `${row.id}-${row.brand_name}`;
    const productsForRow = rowProductsMap[rowBrandKey] || [];
    return productsForRow.map((product) => ({
      value: product,
      label: product,
    }));
  };

  const filteredRows = rows;

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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">
            Product Master Data Entry
          </h2>
          <p className="text-gray-600 mt-1">
            Add and manage products directly in the grid
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </button>
          <button
            onClick={saveAllRows}
            disabled={
              rows.some((row) => saving === row.id) || addProductsLoading
            }
            className="gradient-btn flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Submit All
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-200/50 rounded-xl text-red-700 shadow-sm backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded-lg transition-colors">
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
              {[
                {
                  key: "brand_name",
                  label: "Brand Name",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px] bg-white/30",
                },
                {
                  key: "product_name",
                  label: "Product Name *",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]",
                },
                {
                  key: "category",
                  label: "Category",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]",
                },
                {
                  key: "sub_category",
                  label: "Sub Category",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]",
                },
                {
                  key: "image",
                  label: "Image",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[160px]",
                },
                {
                  key: "prescription",
                  label: "Prescription",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[110px]",
                },
                {
                  key: "hsn_code",
                  label: "HSN No",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]",
                },
                {
                  key: "gst_percentage",
                  label: "GST %",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]",
                },
                {
                  key: "description",
                  label: "Description",
                  className:
                    "px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[180px]",
                },
                {
                  key: "inventory_selling",
                  label: "Inventory Selling",
                  className:
                    "px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]",
                },
                {
                  key: "actions",
                  label: "Actions",
                  className:
                    "px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-white min-w-[120px] border-l border-gray-200",
                },
              ].map((header) => (
                <th key={header.key} className={header.className}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200/30">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">No products found</div>
                    <p className="text-sm text-gray-600">
                      Click "Add New Product" to start adding products
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className={`${row.isNew ? "bg-blue-50/30 hover:bg-blue-50/50" : row.status === "inactive" ? "bg-gray-50/30 opacity-60" : "hover:bg-white/50"} transition-all duration-200`}
                >
                  <td className="px-3 py-2">
                    <CreatableSelect
                      value={
                        row.brand_name
                          ? { value: row.brand_name, label: row.brand_name }
                          : null
                      }
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(
                          row.id,
                          "brand_name",
                          selectedOption?.value || "",
                        );
                      }}
                      options={brandOptions}
                      placeholder={
                        brandsLoading ? "Loading brands..." : "Brand"
                      }
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
                      value={
                        row.product_name
                          ? { value: row.product_name, label: row.product_name }
                          : null
                      }
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(
                          row.id,
                          "product_name",
                          selectedOption?.value || "",
                        );
                      }}
                      options={getProductOptions(row)}
                      placeholder={
                        row.brand_name
                          ? rowLoadingMap[row.id]
                            ? "Loading products..."
                            : "Product Name"
                          : "Select brand first"
                      }
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
                      value={
                        row.category
                          ? { value: row.category, label: row.category }
                          : null
                      }
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(
                          row.id,
                          "category",
                          selectedOption?.value || "",
                        );
                      }}
                      options={categories}
                      placeholder={
                        categoriesLoadingState
                          ? "Loading categories..."
                          : row.category
                            ? row.category
                            : "Category..."
                      }
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
                      value={
                        row.sub_category
                          ? { value: row.sub_category, label: row.sub_category }
                          : null
                      }
                      onChange={(selectedOption: OptionType | null) => {
                        updateRow(
                          row.id,
                          "sub_category",
                          selectedOption?.value || "",
                        );
                      }}
                      options={row.availableSubCategories || []}
                      placeholder={
                        rowSubCategoryLoadingMap[row.id]
                          ? "Loading sub-categories..."
                          : row.sub_category
                            ? row.sub_category
                            : row.category
                              ? "Select sub-category..."
                              : "SubCategory..."
                      }
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
                      isLoading={
                        rowSubCategoryLoadingMap[row.id] && !!row.category
                      }
                      isDisabled={!row.category}
                      closeMenuOnSelect={true}
                      blurInputOnSelect={true}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label
                      className={`flex flex-row items-center justify-center w-full h-[36px] border-2 border-dashed rounded cursor-pointer transition-colors gap-1.5 px-2 ${row.image ? "border-green-400 bg-green-50 hover:bg-green-100" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        if (!["image/jpeg", "image/png"].includes(file.type)) {
                          alert("Only JPG / PNG allowed");
                          return;
                        }
                        if (file.size > 1 * 1024 * 1024) {
                          alert("Max size is 1 MB");
                          return;
                        }
                        updateRow(row.id, "image", file);
                        setSuccess("Image uploaded successfully");
                        setTimeout(() => setSuccess(null), 3000);
                      }}
                    >
                      {row.image ? (
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
                          if (
                            !["image/jpeg", "image/png"].includes(file.type)
                          ) {
                            alert("Only JPG / PNG allowed");
                            return;
                          }
                          if (file.size > 1 * 1024 * 1024) {
                            alert("Max size is 1 MB");
                            return;
                          }
                          updateRow(row.id, "image", file);
                          setSuccess("Image uploaded successfully");
                          setTimeout(() => setSuccess(null), 3000);
                        }}
                      />
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.prescription}
                      onChange={(e) =>
                        updateRow(row.id, "prescription", e.target.value)
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.hsn_code}
                      onChange={(e) =>
                        updateRow(row.id, "hsn_code", e.target.value)
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.gst_percentage}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "gst_percentage",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="5">5</option>
                      <option value="12">12</option>
                      <option value="18">18</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.id, "description", e.target.value)
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description"
                    />
                  </td>

                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.inventory_selling}
                      onChange={(e) =>
                        updateRow(row.id, "inventory_selling", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-white border-l border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving === row.id}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      {row.isNew ? (
                        <button
                          onClick={() => cancelNewRow(row.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteRow(row)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
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

      <div className="flex items-center justify-between text-sm text-gray-600 bg-white/30 px-4 py-3 rounded-xl border border-gray-200/30 backdrop-blur-sm">
        <div>
          Showing:{" "}
          <span className="font-medium text-gray-900 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            {filteredRows.length}
          </span>{" "}
          products
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs">* Required fields</span>
          <span>Click Save icon to save each row</span>
        </div>
      </div>
    </div>
  );
}
