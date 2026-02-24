import { useState, useEffect } from 'react';

interface UserData {
  business_id: number;
  sub_category_id?: number;
}

// Cache for user data to prevent multiple API calls
let userDataCache: UserData | null = null;
let userDataLoading = false;
let userDataError: string | null = null;

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(userDataCache);
  const [loading, setLoading] = useState<boolean>(() => {
    // If cache exists, don't show loading state
    return !userDataCache && !userDataError && !userDataLoading;
  });
  const [error, setError] = useState<string | null>(userDataError);

  useEffect(() => {
    const fetchUserData = async () => {
      // If data is already cached, don't fetch again
      if (userDataCache) {
        return;
      }
      
      // If another instance is already loading, wait for it
      if (userDataLoading) {
        // Poll for the cached data
        const pollInterval = setInterval(() => {
          if (userDataCache || userDataError) {
            clearInterval(pollInterval);
            setUserData(userDataCache);
            setError(userDataError);
            setLoading(false);
          }
        }, 100);
        return;
      }
      
      userDataLoading = true;
      setLoading(true);
      
      const token = localStorage.getItem("access_token");
      if (!token) {
        userDataError = "No access token found";
        setError("No access token found");
        userDataLoading = false;
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate the response structure
        if (data && typeof data.business_id !== 'undefined') {
          userDataCache = {
            business_id: data.business_id,
            sub_category_id: data.sub_category_id || undefined
          };
          setUserData(userDataCache);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        userDataError = err instanceof Error ? err.message : 'Failed to fetch user data';
        setError(userDataError);
      } finally {
        userDataLoading = false;
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Cleanup function to reset loading state if component unmounts
    return () => {
      // Don't reset the cache when component unmounts
    };
  }, []);

  return { userData, loading, error };
};