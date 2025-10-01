-- Seed initial branches
INSERT INTO "Branches" (name, "isActive", "createdAt", "updatedAt")
VALUES 
  ('Ozamiz', true, NOW(), NOW()),
  ('Opol', true, NOW(), NOW()),
  ('Cagayan de Oro City', true, NOW(), NOW()),
  ('Gingoog', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify the insert
SELECT * FROM "Branches";
