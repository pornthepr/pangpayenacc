-- Default categories from requirement section 3.2. created_by/updated_by stay
-- null (seeded by migration, not by one of the 3 app users).
insert into categories (type, name, icon, color, sort_order) values
  ('income', 'เงินสมทบจากสมาชิก', 'users', '#16a34a', 1),
  ('income', 'ดอกเบี้ย', 'landmark', '#22c55e', 2),
  ('income', 'รายได้อื่น ๆ', 'circle-plus', '#4ade80', 3),
  ('expense', 'ค่าซ่อมบ้าน', 'hammer', '#ef4444', 1),
  ('expense', 'ค่าใช้จ่ายของแม่', 'heart', '#f97316', 2),
  ('expense', 'ค่ากิจธุระงานของคุณพ่อ', 'briefcase', '#f59e0b', 3),
  ('expense', 'ค่าน้ำค่าไฟ', 'zap', '#eab308', 4),
  ('expense', 'ค่ารักษาพยาบาล', 'cross', '#dc2626', 5),
  ('expense', 'อื่น ๆ', 'more-horizontal', '#6b7280', 6);
