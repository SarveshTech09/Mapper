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
  fetchProducts: (params: ProductParams) => Promise<string[]>;
}

const useProductsByBrand = (): UseProductsByBrandReturn => {
  const [products, setProducts] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  const { userData, loading: userDataLoading, error: userDataError } = useUserData();

  const fetchProducts = async (params: ProductParams): Promise<string[]> => {
    // Wait for user data to load if needed
    if (userDataLoading) {
      setProductsError('Waiting for user data to load');
      setProductsLoading(false);
      return [];
    }
    
    if (!userData) {
      setProductsError('User data not available');
      setProductsLoading(false);
      return [];
    }
    
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/getProductsByBrand`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            business_id: userData.business_id,
            sub_category_id: userData.sub_category_id ?? 0,
            brand_name: params.brand_name
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ProductResponse = await response.json();
      
      if (data.success) {
        const productsData = data.data || [];
        setProducts(productsData);
        return productsData;
      } else {
        setProductsError('Failed to fetch products');
        setProducts([]);
        return [];
      }
    } catch (error) {
      setProductsError('Error fetching products');
      setProducts([]);
      // Error handling done via setError state
      setProductsLoading(false);
      return [];
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