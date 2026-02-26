import { useState } from "react";
import { useUserData } from "./useUserData";

interface ProductData {
  brand: string;
  category: string;
  description: string;
  gst_percentage: number;
  has_variants: number;
  hsn_no: string;
  image: File | null;
  is_inventory: number;
  prescription_required: number;
  sub_category: string;
  title: string;
}

interface AddProductsResponse {
  success: boolean;
  message: string;
}

interface UseAddProductsReturn {
  addProducts: (products: ProductData[]) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const useAddProducts = (): UseAddProductsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { userData, loading: userDataLoading } = useUserData();

  const addProducts = async (products: ProductData[]): Promise<boolean> => {
    // Wait for user data to load if needed
    if (userDataLoading) {
      setError("Waiting for user data to load");
      return false;
    }

    if (!userData) {
      setError("User data not available");
      return false;
    }

    if (products.length === 0) {
      setError("No products to submit");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found");
        return false;
      }

      // Process each product individually since API expects single product objects
      for (const product of products) {
        // Validate required fields for each product
        if (!product.title?.trim()) {
          setError("Product title is required");
          return false;
        }
        if (!product.brand?.trim()) {
          setError("Product brand is required");
          return false;
        }
        if (!product.category?.trim()) {
          setError("Product category is required");
          return false;
        }
        if (!product.sub_category?.trim()) {
          setError("Product sub-category is required");
          return false;
        }

        // Transform product data - convert File objects to base64 or handle appropriately
        let imageString = "";
        if (product.image) {
          // Convert file to base64
          imageString = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(product.image as File);
          });
        }

        const requestBody = {
          title: product.title,
          brand: product.brand,
          category: product.category,
          description: product.description,
          gst_percentage: product.gst_percentage || 0,
          has_variants: product.has_variants,
          hsn_no: product.hsn_no,
          image: imageString,
          is_inventory: product.is_inventory,
          prescription_required: product.prescription_required,
          sub_category: product.sub_category,
        };

        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/ayurvedic/add-products`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const data: AddProductsResponse = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to add products");
          return false;
        }
      }

      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error adding products",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    addProducts,
    loading,
    error,
  };
};

export default useAddProducts;
