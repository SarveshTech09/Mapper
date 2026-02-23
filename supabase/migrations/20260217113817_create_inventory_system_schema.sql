/*
  # Inventory Management System Schema

  1. New Tables
    - `product_master`
      - Core product information including name, brand, category, dosage, strength, etc.
      - Contains pharmaceutical-specific fields like HSN code, GST, schedule type
    
    - `variant_master`
      - Product variant definitions (type and value)
      - Supports different variant types like pack size, color, etc.
    
    - `product_variant_map`
      - Junction table linking products to their variants
    
    - `batch_master`
      - Batch-level inventory tracking with expiry, pricing, and stock quantities
      - Links to products and tracks warehouse location
    
    - `vendor_master`
      - Supplier information with contact and payment terms
    
    - `purchase_entry`
      - Purchase transaction records
    
    - `sales_entry`
      - Sales transaction records with customer and prescription details
    
    - `stock_ledger`
      - Comprehensive stock movement tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage inventory
*/

-- Product Master Table
CREATE TABLE IF NOT EXISTS product_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  brand_name text,
  generic_name text,
  category text,
  sub_category text,
  dosage_form text,
  strength text,
  base_pack_size text,
  hsn_code text,
  gst_percentage numeric(5,2) DEFAULT 0,
  schedule_type text,
  prescription_required boolean DEFAULT false,
  storage_condition text,
  has_variants boolean DEFAULT false,
  manufacturer text,
  drug_license_no text,
  barcode text UNIQUE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Variant Master Table
CREATE TABLE IF NOT EXISTS variant_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_type text NOT NULL,
  variant_value text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(variant_type, variant_value)
);

-- Product Variant Mapping Table
CREATE TABLE IF NOT EXISTS product_variant_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product_master(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES variant_master(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, variant_id)
);

-- Batch Master Table
CREATE TABLE IF NOT EXISTS batch_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product_master(id) ON DELETE CASCADE,
  variant_combination text,
  batch_number text NOT NULL,
  manufacturing_date date,
  expiry_date date,
  purchase_rate numeric(10,2) DEFAULT 0,
  mrp numeric(10,2) DEFAULT 0,
  gst_percentage numeric(5,2) DEFAULT 0,
  initial_quantity integer DEFAULT 0,
  current_stock_qty integer DEFAULT 0,
  warehouse_location text,
  cold_storage boolean DEFAULT false,
  supplier_name text,
  purchase_invoice_no text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(batch_number, product_id)
);

-- Vendor Master Table
CREATE TABLE IF NOT EXISTS vendor_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  contact_person text,
  phone text,
  gst_number text,
  drug_license_no text,
  address text,
  payment_terms text,
  credit_days integer DEFAULT 0,
  bank_details text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Entry Table
CREATE TABLE IF NOT EXISTS purchase_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  vendor_id uuid REFERENCES vendor_master(id),
  product_id uuid NOT NULL REFERENCES product_master(id),
  variant text,
  batch_no text NOT NULL,
  expiry_date date,
  quantity integer DEFAULT 0,
  free_qty integer DEFAULT 0,
  purchase_rate numeric(10,2) DEFAULT 0,
  discount_percentage numeric(5,2) DEFAULT 0,
  gst_percentage numeric(5,2) DEFAULT 0,
  net_amount numeric(12,2) DEFAULT 0,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales Entry Table
CREATE TABLE IF NOT EXISTS sales_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no text NOT NULL UNIQUE,
  bill_date date NOT NULL,
  customer_name text,
  doctor_name text,
  product_id uuid NOT NULL REFERENCES product_master(id),
  variant text,
  batch_no text NOT NULL,
  expiry_date date,
  quantity_sold integer DEFAULT 0,
  mrp numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  gst numeric(10,2) DEFAULT 0,
  net_amount numeric(12,2) DEFAULT 0,
  prescription_no text,
  mode_of_payment text DEFAULT 'cash',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stock Ledger Table
CREATE TABLE IF NOT EXISTS stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  product_id uuid NOT NULL REFERENCES product_master(id),
  variant text,
  batch_no text NOT NULL,
  opening_stock integer DEFAULT 0,
  purchase_qty integer DEFAULT 0,
  sales_qty integer DEFAULT 0,
  return_qty integer DEFAULT 0,
  damaged_qty integer DEFAULT 0,
  closing_stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE product_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_master
CREATE POLICY "Allow authenticated users to view products"
  ON product_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON product_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON product_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON product_master FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for variant_master
CREATE POLICY "Allow authenticated users to view variants"
  ON variant_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert variants"
  ON variant_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update variants"
  ON variant_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete variants"
  ON variant_master FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for product_variant_map
CREATE POLICY "Allow authenticated users to view product variant mappings"
  ON product_variant_map FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert product variant mappings"
  ON product_variant_map FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product variant mappings"
  ON product_variant_map FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for batch_master
CREATE POLICY "Allow authenticated users to view batches"
  ON batch_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert batches"
  ON batch_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update batches"
  ON batch_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete batches"
  ON batch_master FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for vendor_master
CREATE POLICY "Allow authenticated users to view vendors"
  ON vendor_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert vendors"
  ON vendor_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vendors"
  ON vendor_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete vendors"
  ON vendor_master FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for purchase_entry
CREATE POLICY "Allow authenticated users to view purchases"
  ON purchase_entry FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert purchases"
  ON purchase_entry FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchases"
  ON purchase_entry FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete purchases"
  ON purchase_entry FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sales_entry
CREATE POLICY "Allow authenticated users to view sales"
  ON sales_entry FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert sales"
  ON sales_entry FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales"
  ON sales_entry FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sales"
  ON sales_entry FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for stock_ledger
CREATE POLICY "Allow authenticated users to view stock ledger"
  ON stock_ledger FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert stock ledger entries"
  ON stock_ledger FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update stock ledger entries"
  ON stock_ledger FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete stock ledger entries"
  ON stock_ledger FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_master_barcode ON product_master(barcode);
CREATE INDEX IF NOT EXISTS idx_product_master_status ON product_master(status);
CREATE INDEX IF NOT EXISTS idx_batch_master_product_id ON batch_master(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_master_expiry_date ON batch_master(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_master_batch_number ON batch_master(batch_number);
CREATE INDEX IF NOT EXISTS idx_purchase_entry_invoice_no ON purchase_entry(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_entry_bill_no ON sales_entry(bill_no);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_id ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_date ON stock_ledger(date);