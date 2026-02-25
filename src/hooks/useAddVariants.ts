import { useState } from "react";

interface UseAddVariantsReturn {
  fetchProductsByBrand: (brandName: string) => Promise<string[]>;
  productsByBrandLoading: boolean;
  productsByBrandError: string | null;
  fetchBrands: () => Promise<string[]>;
  brandsLoading: boolean;
  brandsError: string | null;
}

const useAddVariants = (): UseAddVariantsReturn => {
  const [productsByBrandLoading, setProductsByBrandLoading] = useState<boolean>(false);
  const [productsByBrandError, setProductsByBrandError] = useState<string | null>(null);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  const fetchProductsByBrand = async (brandName: string): Promise<string[]> => {
    setProductsByBrandLoading(true);
    setProductsByBrandError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setProductsByBrandError('Authentication token not found');
        return [];
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ayurvedic/get-products-by-brand`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            brand: brandName
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const productsData = Array.isArray(data.data) ? data.data : [];
        return productsData;
      } else {
        setProductsByBrandError(data.message || 'Failed to fetch products');
        return [];
      }
    } catch (error) {
      setProductsByBrandError(error instanceof Error ? error.message : 'Error fetching products by brand');
      return [];
    } finally {
      setProductsByBrandLoading(false);
    }
  };
  
  const fetchBrands = async (): Promise<string[]> => {
    setBrandsLoading(true);
    setBrandsError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setBrandsError('Authentication token not found');
        return [];
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/ayurvedic/get-brand-list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const brandsData = Array.isArray(data.data) ? data.data : [];
        return brandsData;
      } else {
        setBrandsError(data.message || 'Failed to fetch brands');
        return [];
      }
    } catch (error) {
      setBrandsError(error instanceof Error ? error.message : 'Error fetching brands');
      return [];
    } finally {
      setBrandsLoading(false);
    }
  };
  
  return {
    fetchProductsByBrand,
    productsByBrandLoading,
    productsByBrandError,
    fetchBrands,
    brandsLoading,
    brandsError,
  };
};

export default useAddVariants;
