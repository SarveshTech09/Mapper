import { useState } from 'react';

interface SubCategory {
  product_category: string;
}

interface OptionType {
  value: string;
  label: string;
}

// Custom hook that provides a function to fetch subcategories
export const useSubCategories = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubCategories = async (businessId: number, selectedCategory: string) => {
    if (!selectedCategory || !businessId) {
      return [];
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("No access token found");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/optical/getCategory/${businessId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category_type: selectedCategory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const subArray: SubCategory[] = result.data ?? result ?? [];

      // Format subcategories
      const formattedSubCategories = subArray.map((item) => ({
        value: item.product_category,
        label: item.product_category,
      }));

      return formattedSubCategories;
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchSubCategories, loading, error };
};