
-- Insert sample classes for the SO Center system
INSERT INTO classes (id, name, description, is_active) VALUES 
  (gen_random_uuid(), '1st Class', 'First standard', true),
  (gen_random_uuid(), '2nd Class', 'Second standard', true),
  (gen_random_uuid(), '3rd Class', 'Third standard', true),
  (gen_random_uuid(), '4th Class', 'Fourth standard', true),
  (gen_random_uuid(), '5th Class', 'Fifth standard', true),
  (gen_random_uuid(), '6th Class', 'Sixth standard', true),
  (gen_random_uuid(), '7th Class', 'Seventh standard', true),
  (gen_random_uuid(), '8th Class', 'Eighth standard', true),
  (gen_random_uuid(), '9th Class', 'Ninth standard', true),
  (gen_random_uuid(), '10th Class', 'Tenth standard', true)
ON CONFLICT DO NOTHING;

-- Insert corresponding class fees for each class
INSERT INTO class_fees (id, class_id, course_type, admission_fee, monthly_fee, yearly_fee, description, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'monthly',
  500.00,
  200.00,
  2000.00,
  'Standard fees for ' || c.name,
  true
FROM classes c
ON CONFLICT DO NOTHING;

-- Also insert yearly fee records
INSERT INTO class_fees (id, class_id, course_type, admission_fee, monthly_fee, yearly_fee, description, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'yearly',
  500.00,
  200.00,
  2000.00,
  'Standard yearly fees for ' || c.name,
  true
FROM classes c
ON CONFLICT DO NOTHING;
