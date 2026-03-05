import { useState } from 'react';

interface VariantData {
  product_name: string;
  uom: string;
  value: string;
  mrp: string;
  sell_price: string;
  available_quantity: string;
  product_id: string | number;
  // Dynamic fields will be added here
  [key: string]: string | number;
}

interface ProductData {
  title: string;
  brand: string;
  category: string;
  gst_percentage: number;
  has_variants: number;
  variants: VariantData[];
  // Other dynamic fields
  [key: string]: string | number | VariantData[] | undefined;
}

interface BulkSubmitPayload {
  products: ProductData[];
}

interface SingleSubmitPayload {
  product_name: string;
  uom: string;
  value: string;
  mrp: string;
  sell_price: string;
  available_quantity: string;
  product_id: string | number;
  // Dynamic fields will be added here
  [key: string]: string | number;
}

interface UseBulkSubmitReturn {
  submitBulkData: (payload: BulkSubmitPayload) => Promise<boolean>;
  submitSingleData: (payload: SingleSubmitPayload) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function useBulkSubmit(): UseBulkSubmitReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitBulkData = async (payload: BulkSubmitPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/ayurvedic/bulk-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to submit bulk data');
      }

      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.message || 'Failed to submit bulk data');
      }
    } catch (err) {
      console.error('Error submitting bulk data:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit bulk data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitSingleData = async (payload: SingleSubmitPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/ayurvedic/add-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to submit single data');
      }

      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.message || 'Failed to submit single data');
      }
    } catch (err) {
      console.error('Error submitting single data:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit single data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitBulkData,
    submitSingleData,
    loading,
    error,
  };
}