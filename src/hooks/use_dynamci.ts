

const getToken = () => localStorage.getItem('access_token');
const getTenantSchema = () => localStorage.getItem('tenant_schema');
const getBusinessId = () => localStorage.getItem('business_id');
const getSubCategoryId = () => localStorage.getItem('sub_category_id');



export const accountdetails = async (FormName: string) => {
  const token = getToken();
  console.log("Access Token:", token);
  if (!token) throw new Error("No access token found. Please log in again.");
 
  const tenantSchema = getTenantSchema();
  const businessId = getBusinessId();
  const subCategoryId = getSubCategoryId();
 
  console.log("Tenant Schema:", tenantSchema);
  console.log("Business ID:", businessId);
  console.log("Sub Category ID:", subCategoryId ?? null );
  console.log("Form Name:", FormName);
 
  if (!businessId) throw new Error("No business ID found. Please log in again.");
 
  const url = new URL(`${import.meta.env.VITE_BASE_URL}/api/get_form`);
  url.searchParams.append('tenant_schema', tenantSchema || '');
  url.searchParams.append('business_id', businessId.toString());
 
const parsedSubCategoryId =
  subCategoryId && subCategoryId !== 'null' ? parseInt(subCategoryId) : null;
 
if (parsedSubCategoryId !== null && !isNaN(parsedSubCategoryId)) {
  url.searchParams.append('sub_category_id', parsedSubCategoryId.toString());
}
 
 
 
 
  url.searchParams.append('form_name', FormName);
 
  console.log("Final URL:", url.toString());
 
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
 
    console.log("Raw Response Status:", response.status);
    
    const data = await response.json();
    console.log("Account Details Response:", data);
 
    if (!response.ok) {
      console.warn("Non-OK Response", response.status, data);
    }
 
    if (data.error && typeof data.error === 'string') {
      throw new Error(data.error);
    }
 
    if (data.message && response.status !== 200) {
      throw new Error(data.message);
    }
 
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};