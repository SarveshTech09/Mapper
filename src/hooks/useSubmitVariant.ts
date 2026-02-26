import { useState } from "react";
import { useUserData } from "./useUserData";

interface VariantData {
  product_name: string;
  uom: string;
  value: string;
  mrp: string;
  sell_price: string;
  available_quantity: string;
  product_id: string | number;
}

interface SubmitVariantResponse {
  success: boolean;
  message: string;
}

interface UseSubmitVariantReturn {
  submitVariant: (variant: VariantData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const useSubmitVariant = (): UseSubmitVariantReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { userData, loading: userDataLoading } = useUserData();

  const submitVariant = async (variant: VariantData): Promise<boolean> => {
    // Wait for user data to load if needed
    if (userDataLoading) {
      setError("Waiting for user data to load");
      return false;
    }

    if (!userData) {
      setError("User data not available");
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

      // Validate required fields
      if (!variant.uom?.trim()) {
        setError("Unit of measure is required");
        return false;
      }
      if (!variant.value?.trim()) {
        setError("Value is required");
        return false;
      }
      if (!variant.mrp?.trim()) {
        setError("MRP is required");
        return false;
      }
      if (!variant.sell_price?.trim()) {
        setError("Sell price is required");
        return false;
      }
      if (!variant.available_quantity?.trim()) {
        setError("Available quantity is required");
        return false;
      }
      if (!variant.product_id) {
        setError("Product ID is required");
        return false;
      }

      const requestBody = {
        product_name: variant.product_name,
        uom: variant.uom,
        value: variant.value,
        mrp: variant.mrp,
        sell_price: variant.sell_price,
        available_quantity: variant.available_quantity,
        product_id: variant.product_id
      };

      console.log('Sending variant payload:', requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ayurvedic/add-variant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Check if response is HTML (redirect) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        console.log('HTML Response:', text.substring(0, 500));
        throw new Error('API returned HTML instead of JSON - likely authentication issue or endpoint not found');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data: SubmitVariantResponse = await response.json();
      console.log('API Response:', data);

      if (!data.success) {
        setError(data.message || "Failed to submit variant");
        return false;
      }

      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error submitting variant",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitVariant,
    loading,
    error,
  };
};

export default useSubmitVariant;