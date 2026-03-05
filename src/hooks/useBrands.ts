import { useState } from 'react';
import { useUserData } from './useUserData';



interface BrandResponse {
  success: boolean;
  data: string[];
}

interface UseBrandsReturn {
  brands: string[];
  brandsLoading: boolean;
  brandsError: string | null;
  userDataLoading: boolean;
  userDataError: string | null;
  fetchBrands: () => Promise<void>;
}

const useBrands = (): UseBrandsReturn => {
  const [brands, setBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  
  const { userData, loading: userDataLoading, error: userDataError } = useUserData();

  const fetchBrands = async () => {
    // Wait for user data to load if needed
    if (userDataLoading) {
      setBrandsError('Waiting for user data to load');
      setBrandsLoading(false);
      return;
    }
    
    if (!userData) {
      setBrandsError('User data not available');
      setBrandsLoading(false);
      return;
    }
    
    setBrandsLoading(true);
    setBrandsError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/getMaterBrandBrands`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_id: userData.business_id,
            sub_category_id: userData.sub_category_id ?? 0
          }),
        }
      );
      
      const data: BrandResponse = await response.json();
      
      if (data.success) {
        setBrands(data.data || []);
      } else {
        setBrandsError('Failed to fetch brands');
        setBrands([]);
      }
    } catch (error) {
      setBrandsError('Error fetching brands');
      setBrands([]);
      console.error('Error fetching brands:', error);
    } finally {
      setBrandsLoading(false);
    }
  };

  return {
    brands,
    brandsLoading,
    brandsError,
    userDataLoading,
    userDataError,
    fetchBrands
  };
};

export default useBrands;