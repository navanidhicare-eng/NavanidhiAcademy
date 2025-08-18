-- Add sample leads data for Marketing Head dashboard testing
-- Insert sample villages if they don't exist
INSERT INTO villages (id, name, code, mandal_id) 
SELECT gen_random_uuid(), 'Hyderabad', 'HYD', m.id
FROM mandals m 
WHERE m.name = 'Hyderabad' 
AND NOT EXISTS (SELECT 1 FROM villages WHERE name = 'Hyderabad')
LIMIT 1;

INSERT INTO villages (id, name, code, mandal_id) 
SELECT gen_random_uuid(), 'Bangalore', 'BLR', m.id 
FROM mandals m 
WHERE m.name ILIKE '%bangalore%' OR m.name ILIKE '%bengaluru%'
AND NOT EXISTS (SELECT 1 FROM villages WHERE name = 'Bangalore')
LIMIT 1;

-- Insert sample leads data for testing
INSERT INTO leads (
  id, 
  student_name, 
  parent_name, 
  mobile_number, 
  whatsapp_number, 
  email,
  address,
  village_id,
  interested_class,
  lead_source,
  priority,
  expected_join_date,
  notes,
  status,
  created_by,
  assigned_to,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Rajesh Kumar',
  'Suresh Kumar', 
  '9876543210',
  '9876543210',
  'suresh.kumar@example.com',
  '123 MG Road, Hyderabad',
  (SELECT id FROM villages WHERE name = 'Hyderabad' LIMIT 1),
  (SELECT id FROM classes WHERE name ILIKE '%10th%' OR name ILIKE '%class 10%' LIMIT 1),
  'online',
  'high',
  '2025-02-01',
  'Interested in mathematics tutoring. Parent works in IT.',
  'contacted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM users WHERE role = 'office_staff' LIMIT 1),
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  'Priya Sharma',
  'Amit Sharma',
  '9987654321', 
  '9987654321',
  'amit.sharma@example.com',
  '456 Brigade Road, Bangalore',
  (SELECT id FROM villages WHERE name = 'Bangalore' LIMIT 1),
  (SELECT id FROM classes WHERE name ILIKE '%9th%' OR name ILIKE '%class 9%' LIMIT 1),
  'referral',
  'medium',
  '2025-02-15', 
  'Referred by existing student. Looking for science subjects.',
  'interested',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'Anil Reddy',
  'Krishna Reddy',
  '9123456789',
  '9123456789', 
  'krishna.reddy@example.com',
  '789 Tank Bund, Hyderabad',
  (SELECT id FROM villages WHERE name = 'Hyderabad' LIMIT 1),
  (SELECT id FROM classes WHERE name ILIKE '%8th%' OR name ILIKE '%class 8%' LIMIT 1),
  'walk_in',
  'low',
  '2025-03-01',
  'Walk-in inquiry. Parent wants to know about fees structure.',
  'new',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'Sneha Patel',
  'Ramesh Patel',
  '9234567890',
  '9234567890',
  'ramesh.patel@example.com',
  '321 Commercial Street, Bangalore', 
  (SELECT id FROM villages WHERE name = 'Bangalore' LIMIT 1),
  (SELECT id FROM classes WHERE name ILIKE '%7th%' OR name ILIKE '%class 7%' LIMIT 1),
  'marketing_campaign',
  'high',
  '2025-02-10',
  'Responded to Facebook ad campaign. Very interested in enrollment.',
  'visit_scheduled',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM users WHERE role = 'office_staff' LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 hour'
),
(
  gen_random_uuid(),
  'Vikram Singh',
  'Rajendra Singh',
  '9345678901',
  '9345678901',
  'rajendra.singh@example.com',
  '654 Banjara Hills, Hyderabad',
  (SELECT id FROM villages WHERE name = 'Hyderabad' LIMIT 1), 
  (SELECT id FROM classes WHERE name ILIKE '%6th%' OR name ILIKE '%class 6%' LIMIT 1),
  'online',
  'medium',
  '2025-02-20',
  'Found us through Google search. Comparing with other academies.',
  'contacted',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM users WHERE role = 'office_staff' LIMIT 1),
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '6 hours'
);

-- Add some follow-ups for the leads
INSERT INTO lead_follow_ups (
  id,
  lead_id,
  follow_up_date,
  action,
  remarks,
  next_follow_up_date,
  performed_by,
  created_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM leads WHERE student_name = 'Rajesh Kumar' LIMIT 1),
  CURRENT_DATE - 2,
  'Called',
  'Parent interested but wants to discuss fee structure. Scheduled follow-up.',
  CURRENT_DATE + 1,
  (SELECT id FROM users WHERE role = 'office_staff' LIMIT 1),
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(), 
  (SELECT id FROM leads WHERE student_name = 'Sneha Patel' LIMIT 1),
  CURRENT_DATE - 1,
  'Visited',
  'Family visited the center. Very impressed with facilities. Ready to enroll.',
  CURRENT_DATE + 2,
  (SELECT id FROM users WHERE role = 'office_staff' LIMIT 1),
  NOW() - INTERVAL '1 day'
);