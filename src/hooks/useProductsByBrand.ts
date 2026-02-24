import { useState } from 'react';
import { useUserData } from './useUserData';

interface ProductParams {
  brand_name: string;
}

interface ProductResponse {
  success: boolean;
  data: string[];
}

interface UseProductsByBrandReturn {
  products: string[];
  productsLoading: boolean;
  productsError: string | null;
  userDataLoading: boolean;
  userDataError: string | null;
  fetchProducts: (params: ProductParams) => Promise<void>;
}

const useProductsByBrand = (): UseProductsByBrandReturn => {
  const [products, setProducts] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  const { userData, loading: userDataLoading, error: userDataError } = useUserData();

  const fetchProducts = async (params: ProductParams) => {
    // Wait for user data to load if needed
    if (userDataLoading) {
      setProductsError('Waiting for user data to load');
      setProductsLoading(false);
      return;
    }
    
    if (!userData) {
      setProductsError('User data not available');
      setProductsLoading(false);
      return;
    }
    
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/getProductsByBrand`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_id: userData.business_id,
            sub_category_id: userData.sub_category_id ?? 0,
            brand_name: params.brand_name
          }),
        }
      );
      
      const data: ProductResponse = await response.json();
      
      if (data.success) {
        setProducts(data.data || []);
      } else {
        setProductsError('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      setProductsError('Error fetching products');
      setProducts([]);
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  return {
    products,
    productsLoading,
    productsError,
    userDataLoading,
    userDataError,
    fetchProducts
  };
};

export default useProductsByBrand;