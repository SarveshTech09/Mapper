import { useState, useEffect } from 'react';

interface UserData {
  business_id: number;
  sub_category_id?: number;
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate the response structure
        if (data && typeof data.business_id !== 'undefined') {
          setUserData({
            business_id: data.business_id,
            sub_category_id: data.sub_category_id || undefined
          });
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userData, loading, error };
};