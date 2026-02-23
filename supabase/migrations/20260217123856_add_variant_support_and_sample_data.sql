/*
  # Add Variant Support and Sample Data

  1. Schema Changes
    - Add variant support fields to product_master table
      - `has_variants` (boolean) - indicates if product has variations
      - `variant_type` (text) - type of variant (color, flavor, size, etc.)
    
    - Add variant fields to batch_master table
      - `variant_value` (text) - specific variant value (e.g., "Red", "Vanilla", "Large")

  2. Sample Data
    - Insert sample products in product_master
    - Insert sample batches in batch_master
  
  3. Notes
    - Existing records will have has_variants = false by default
    - Sample data includes both regular and variant products
*/

-- Add variant support to product_master
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'has_variants'
  ) THEN
    ALTER TABLE product_master ADD COLUMN has_variants boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'variant_type'
  ) THEN
    ALTER TABLE product_master ADD COLUMN variant_type text;
  END IF;
END $$;

-- Add variant support to batch_master
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_master' AND column_name = 'variant_value'
  ) THEN
    ALTER TABLE batch_master ADD COLUMN variant_value text;
  END IF;
END $$;

-- Clear existing sample data if any
DELETE FROM batch_master WHERE batch_number LIKE 'PARA-%' OR batch_number LIKE 'AMOX-%' OR batch_number LIKE 'VITC-%' 
  OR batch_number LIKE 'COUGH-%' OR batch_number LIKE 'PROT-%' OR batch_number LIKE 'BAND-%' 
  OR batch_number LIKE 'SANI-%' OR batch_number LIKE 'MULTI-%';

DELETE FROM product_master WHERE product_name IN (
  'Paracetamol 500mg', 'Amoxicillin 250mg', 'Vitamin C 500mg', 'Cough Syrup 100ml',
  'Protein Powder 1kg', 'Bandage Roll', 'Hand Sanitizer 500ml', 'Multivitamin Tablets'
);

-- Insert sample products
INSERT INTO product_master (
  product_name, brand_name, generic_name, category, sub_category,
  dosage_form, strength, base_pack_size, hsn_code, gst_percentage,
  schedule_type, prescription_required, storage_condition, manufacturer,
  barcode, status, has_variants, variant_type
) VALUES
  -- Regular products without variants
  ('Paracetamol 500mg', 'MediCare', 'Paracetamol', 'Analgesics', 'Fever & Pain Relief',
   'Tablet', '500mg', '10 Tablets', '30049099', 12,
   'Schedule H', true, 'Store below 25°C', 'MediCare Pharma Ltd', '8901234567890', 'active', false, NULL),
  
  ('Amoxicillin 250mg', 'HealthMax', 'Amoxicillin', 'Antibiotics', 'Penicillin',
   'Capsule', '250mg', '10 Capsules', '30042000', 12,
   'Schedule H', true, 'Store below 25°C', 'HealthMax Industries', '8901234567891', 'active', false, NULL),
  
  ('Vitamin C 500mg', 'WellLife', 'Ascorbic Acid', 'Vitamins', 'Supplements',
   'Tablet', '500mg', '30 Tablets', '30049011', 12,
   NULL, false, 'Store in cool dry place', 'WellLife Nutrition', '8901234567892', 'active', false, NULL),
  
  -- Products with variants
  ('Cough Syrup 100ml', 'CoughCare', 'Dextromethorphan', 'Cough & Cold', 'Antitussive',
   'Syrup', '15mg/5ml', '100ml', '30049013', 12,
   NULL, false, 'Store below 25°C', 'CoughCare Pharma', '8901234567893', 'active', true, 'flavor'),
  
  ('Protein Powder 1kg', 'FitPro', 'Whey Protein', 'Supplements', 'Protein',
   'Powder', '25g per serving', '1kg', '21069099', 18,
   NULL, false, 'Store in cool dry place', 'FitPro Nutrition', '8901234567894', 'active', true, 'flavor'),
  
  ('Bandage Roll', 'FirstAid', NULL, 'Medical Supplies', 'Dressing',
   'Roll', NULL, '5cm x 4.5m', '30059010', 12,
   NULL, false, 'Store in dry place', 'FirstAid Medical', '8901234567895', 'active', true, 'size'),
  
  ('Hand Sanitizer 500ml', 'CleanHands', 'Ethyl Alcohol', 'Hygiene', 'Sanitizers',
   'Gel', '70% Alcohol', '500ml', '38089400', 18,
   NULL, false, 'Store away from heat', 'CleanHands Ltd', '8901234567896', 'active', true, 'fragrance'),
  
  ('Multivitamin Tablets', 'DailyHealth', 'Multivitamin Complex', 'Vitamins', 'Daily Supplements',
   'Tablet', 'Multi', '60 Tablets', '30049012', 12,
   NULL, false, 'Store in cool dry place', 'DailyHealth Corp', '8901234567897', 'active', false, NULL);

-- Insert sample batches
DO $$
DECLARE
  product_id_paracetamol uuid;
  product_id_amoxicillin uuid;
  product_id_vitaminc uuid;
  product_id_coughsyrup uuid;
  product_id_protein uuid;
  product_id_bandage uuid;
  product_id_sanitizer uuid;
  product_id_multivitamin uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO product_id_paracetamol FROM product_master WHERE product_name = 'Paracetamol 500mg';
  SELECT id INTO product_id_amoxicillin FROM product_master WHERE product_name = 'Amoxicillin 250mg';
  SELECT id INTO product_id_vitaminc FROM product_master WHERE product_name = 'Vitamin C 500mg';
  SELECT id INTO product_id_coughsyrup FROM product_master WHERE product_name = 'Cough Syrup 100ml';
  SELECT id INTO product_id_protein FROM product_master WHERE product_name = 'Protein Powder 1kg';
  SELECT id INTO product_id_bandage FROM product_master WHERE product_name = 'Bandage Roll';
  SELECT id INTO product_id_sanitizer FROM product_master WHERE product_name = 'Hand Sanitizer 500ml';
  SELECT id INTO product_id_multivitamin FROM product_master WHERE product_name = 'Multivitamin Tablets';

  -- Insert batches for regular products
  IF product_id_paracetamol IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_paracetamol, 'PARA-2024-001', '2024-01-15', '2026-01-15',
       45.50, 65.00, 12, 500, 450, 'Rack A1, Shelf 2', false, 'MediSupply Co', 'INV-2024-0001', NULL),
      (product_id_paracetamol, 'PARA-2024-002', '2024-06-20', '2026-06-20',
       46.00, 65.00, 12, 300, 280, 'Rack A1, Shelf 3', false, 'MediSupply Co', 'INV-2024-0045', NULL);
  END IF;

  IF product_id_amoxicillin IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_amoxicillin, 'AMOX-2024-001', '2024-03-10', '2026-03-10',
       85.00, 120.00, 12, 200, 150, 'Rack B2, Shelf 1', true, 'PharmaDist Ltd', 'INV-2024-0023', NULL);
  END IF;

  IF product_id_vitaminc IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_vitaminc, 'VITC-2024-001', '2024-02-05', '2026-02-05',
       120.00, 180.00, 12, 400, 380, 'Rack C3, Shelf 1', false, 'WellLife Direct', 'INV-2024-0012', NULL);
  END IF;

  -- Insert batches for variant products
  IF product_id_coughsyrup IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_coughsyrup, 'COUGH-2024-001', '2024-04-12', '2025-04-12',
       95.00, 135.00, 12, 150, 120, 'Rack D1, Shelf 2', false, 'CoughCare Direct', 'INV-2024-0034', 'Orange'),
      (product_id_coughsyrup, 'COUGH-2024-002', '2024-04-12', '2025-04-12',
       95.00, 135.00, 12, 150, 145, 'Rack D1, Shelf 2', false, 'CoughCare Direct', 'INV-2024-0034', 'Cherry'),
      (product_id_coughsyrup, 'COUGH-2024-003', '2024-05-20', '2025-05-20',
       95.00, 135.00, 12, 100, 95, 'Rack D1, Shelf 3', false, 'CoughCare Direct', 'INV-2024-0056', 'Mint');
  END IF;

  IF product_id_protein IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_protein, 'PROT-2024-001', '2024-01-08', '2026-01-08',
       850.00, 1299.00, 18, 100, 75, 'Rack E1, Shelf 1', false, 'FitPro Wholesale', 'INV-2024-0005', 'Chocolate'),
      (product_id_protein, 'PROT-2024-002', '2024-01-08', '2026-01-08',
       850.00, 1299.00, 18, 80, 65, 'Rack E1, Shelf 1', false, 'FitPro Wholesale', 'INV-2024-0005', 'Vanilla'),
      (product_id_protein, 'PROT-2024-003', '2024-03-15', '2026-03-15',
       850.00, 1299.00, 18, 60, 58, 'Rack E1, Shelf 2', false, 'FitPro Wholesale', 'INV-2024-0029', 'Strawberry');
  END IF;

  IF product_id_bandage IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_bandage, 'BAND-2024-001', '2024-02-10', '2027-02-10',
       25.00, 45.00, 12, 300, 250, 'Rack F2, Shelf 1', false, 'FirstAid Supply', 'INV-2024-0015', '5cm'),
      (product_id_bandage, 'BAND-2024-002', '2024-02-10', '2027-02-10',
       35.00, 60.00, 12, 200, 180, 'Rack F2, Shelf 1', false, 'FirstAid Supply', 'INV-2024-0015', '7.5cm'),
      (product_id_bandage, 'BAND-2024-003', '2024-02-10', '2027-02-10',
       45.00, 75.00, 12, 150, 140, 'Rack F2, Shelf 2', false, 'FirstAid Supply', 'INV-2024-0015', '10cm');
  END IF;

  IF product_id_sanitizer IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_sanitizer, 'SANI-2024-001', '2024-05-01', '2026-05-01',
       145.00, 220.00, 18, 250, 200, 'Rack G1, Shelf 1', false, 'CleanHands Dist', 'INV-2024-0048', 'Unscented'),
      (product_id_sanitizer, 'SANI-2024-002', '2024-05-01', '2026-05-01',
       145.00, 220.00, 18, 200, 185, 'Rack G1, Shelf 1', false, 'CleanHands Dist', 'INV-2024-0048', 'Lavender'),
      (product_id_sanitizer, 'SANI-2024-003', '2024-06-15', '2026-06-15',
       145.00, 220.00, 18, 180, 175, 'Rack G1, Shelf 2', false, 'CleanHands Dist', 'INV-2024-0067', 'Lemon');
  END IF;

  IF product_id_multivitamin IS NOT NULL THEN
    INSERT INTO batch_master (
      product_id, batch_number, manufacturing_date, expiry_date,
      purchase_rate, mrp, gst_percentage, initial_quantity, current_stock_qty,
      warehouse_location, cold_storage, supplier_name, purchase_invoice_no, variant_value
    ) VALUES
      (product_id_multivitamin, 'MULTI-2024-001', '2024-03-20', '2026-03-20',
       280.00, 425.00, 12, 350, 300, 'Rack H2, Shelf 1', false, 'DailyHealth Direct', 'INV-2024-0031', NULL);
  END IF;

END $$;
