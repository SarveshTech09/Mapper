import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  product_name: string;
  brand_name: string | null;
  generic_name: string | null;
  category: string | null;
  sub_category: string | null;
  dosage_form: string | null;
  strength: string | null;
  base_pack_size: string | null;
  hsn_code: string | null;
  gst_percentage: number;
  schedule_type: string | null;
  prescription_required: boolean;
  storage_condition: string | null;
  has_variants: boolean;
  variant_type: string | null;
  manufacturer: string | null;
  drug_license_no: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Batch = {
  id: string;
  product_id: string;
  variant_value: string | null;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  purchase_rate: number;
  mrp: number;
  gst_percentage: number;
  initial_quantity: number;
  current_stock_qty: number;
  warehouse_location: string | null;
  cold_storage: boolean;
  supplier_name: string | null;
  purchase_invoice_no: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWithBatches = Product & {
  batches: Batch[];
};
