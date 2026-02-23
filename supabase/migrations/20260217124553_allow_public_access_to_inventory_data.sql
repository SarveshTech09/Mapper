/*
  # Allow Public Access to Inventory Data

  1. Changes
    - Drop existing authenticated-only policies
    - Create new policies that allow anonymous (public) access
    - This allows the app to work without authentication

  2. Security Note
    - These policies allow public read/write access
    - Suitable for development and testing
    - Should be restricted in production environments
*/

-- Drop existing policies for product_master
DROP POLICY IF EXISTS "Allow authenticated users to view products" ON product_master;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON product_master;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON product_master;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON product_master;

-- Create new public policies for product_master
CREATE POLICY "Allow public to view products"
  ON product_master FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert products"
  ON product_master FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update products"
  ON product_master FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete products"
  ON product_master FOR DELETE
  USING (true);

-- Drop existing policies for batch_master
DROP POLICY IF EXISTS "Allow authenticated users to view batches" ON batch_master;
DROP POLICY IF EXISTS "Allow authenticated users to insert batches" ON batch_master;
DROP POLICY IF EXISTS "Allow authenticated users to update batches" ON batch_master;
DROP POLICY IF EXISTS "Allow authenticated users to delete batches" ON batch_master;

-- Create new public policies for batch_master
CREATE POLICY "Allow public to view batches"
  ON batch_master FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert batches"
  ON batch_master FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update batches"
  ON batch_master FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete batches"
  ON batch_master FOR DELETE
  USING (true);

-- Drop existing policies for variant_master
DROP POLICY IF EXISTS "Allow authenticated users to view variants" ON variant_master;
DROP POLICY IF EXISTS "Allow authenticated users to insert variants" ON variant_master;
DROP POLICY IF EXISTS "Allow authenticated users to update variants" ON variant_master;
DROP POLICY IF EXISTS "Allow authenticated users to delete variants" ON variant_master;

-- Create new public policies for variant_master
CREATE POLICY "Allow public to view variants"
  ON variant_master FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert variants"
  ON variant_master FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update variants"
  ON variant_master FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete variants"
  ON variant_master FOR DELETE
  USING (true);

-- Drop existing policies for vendor_master
DROP POLICY IF EXISTS "Allow authenticated users to view vendors" ON vendor_master;
DROP POLICY IF EXISTS "Allow authenticated users to insert vendors" ON vendor_master;
DROP POLICY IF EXISTS "Allow authenticated users to update vendors" ON vendor_master;
DROP POLICY IF EXISTS "Allow authenticated users to delete vendors" ON vendor_master;

-- Create new public policies for vendor_master
CREATE POLICY "Allow public to view vendors"
  ON vendor_master FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert vendors"
  ON vendor_master FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update vendors"
  ON vendor_master FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete vendors"
  ON vendor_master FOR DELETE
  USING (true);

-- Drop existing policies for purchase_entry
DROP POLICY IF EXISTS "Allow authenticated users to view purchases" ON purchase_entry;
DROP POLICY IF EXISTS "Allow authenticated users to insert purchases" ON purchase_entry;
DROP POLICY IF EXISTS "Allow authenticated users to update purchases" ON purchase_entry;
DROP POLICY IF EXISTS "Allow authenticated users to delete purchases" ON purchase_entry;

-- Create new public policies for purchase_entry
CREATE POLICY "Allow public to view purchases"
  ON purchase_entry FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert purchases"
  ON purchase_entry FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update purchases"
  ON purchase_entry FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete purchases"
  ON purchase_entry FOR DELETE
  USING (true);

-- Drop existing policies for sales_entry
DROP POLICY IF EXISTS "Allow authenticated users to view sales" ON sales_entry;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales_entry;
DROP POLICY IF EXISTS "Allow authenticated users to update sales" ON sales_entry;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales" ON sales_entry;

-- Create new public policies for sales_entry
CREATE POLICY "Allow public to view sales"
  ON sales_entry FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert sales"
  ON sales_entry FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update sales"
  ON sales_entry FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete sales"
  ON sales_entry FOR DELETE
  USING (true);

-- Drop existing policies for stock_ledger
DROP POLICY IF EXISTS "Allow authenticated users to view stock ledger" ON stock_ledger;
DROP POLICY IF EXISTS "Allow authenticated users to insert stock ledger entries" ON stock_ledger;
DROP POLICY IF EXISTS "Allow authenticated users to update stock ledger entries" ON stock_ledger;
DROP POLICY IF EXISTS "Allow authenticated users to delete stock ledger entries" ON stock_ledger;

-- Create new public policies for stock_ledger
CREATE POLICY "Allow public to view stock ledger"
  ON stock_ledger FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert stock ledger entries"
  ON stock_ledger FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update stock ledger entries"
  ON stock_ledger FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete stock ledger entries"
  ON stock_ledger FOR DELETE
  USING (true);

-- Drop existing policies for product_variant_map
DROP POLICY IF EXISTS "Allow authenticated users to view product variant mappings" ON product_variant_map;
DROP POLICY IF EXISTS "Allow authenticated users to insert product variant mappings" ON product_variant_map;
DROP POLICY IF EXISTS "Allow authenticated users to delete product variant mappings" ON product_variant_map;

-- Create new public policies for product_variant_map
CREATE POLICY "Allow public to view product variant mappings"
  ON product_variant_map FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert product variant mappings"
  ON product_variant_map FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to delete product variant mappings"
  ON product_variant_map FOR DELETE
  USING (true);
