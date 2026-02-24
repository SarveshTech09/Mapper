import { useState, useEffect } from 'react';

interface Category {
  category_type: string;
}

interface OptionType {
  value: string;
  label: string;
}

export const useCategories = (businessId: number | null, subCategoryId: number | null) => {
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchCategories = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("No access token found");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/getCategory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              business_id: businessId,
              sub_category_id: subCategoryId || null,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const categoryArray: Category[] = data.data ?? [];

        // Set categories for dropdown
        const categoryOptions = categoryArray.map((item) => ({
          value: item.category_type,
          label: item.category_type,
        }));

        setCategories(categoryOptions);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [businessId, subCategoryId]);

  return { categories, loading, error };
};