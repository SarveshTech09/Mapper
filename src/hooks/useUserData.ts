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

      // ✅ If already cached
      if (userDataCache) {
        setUserData(userDataCache);
        setLoading(false);
        return;
      }

      // ✅ Prevent multiple calls
      if (userDataLoading) return;

      userDataLoading = true;
      setLoading(true);

      const token = localStorage.getItem("access_token");

      console.log("TOKEN:", token);

      if (!token) {
        setError("No access token");
        setLoading(false);
        return;
      }

      try {

        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          }
        );

        console.log("STATUS:", response.status);

        const data = await response.json();

        console.log("API RESPONSE:", data);

        // ✅ Store both values
        const result = {
          business_id: data.business_id,
          sub_category_id: data.sub_category_id
        };

        // ✅ Cache
        userDataCache = result;

        // ✅ React state
        setUserData(result);

        // ✅ LocalStorage
        localStorage.setItem("business_id", result.business_id ?? "");
        localStorage.setItem("sub_category_id", result.sub_category_id ?? "");

      } catch (err) {

        console.error("ERROR:", err);

        userDataError = "Failed to fetch";

        setError(userDataError);

      } finally {

        userDataLoading = false;
        setLoading(false);

      }

    };

    fetchUserData();

  }, []);

  return { userData, loading, error };


 
};