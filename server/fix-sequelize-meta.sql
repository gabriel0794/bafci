-- Fix the SequelizeMeta table entry for late payment fields migration
DELETE FROM "SequelizeMeta" WHERE name = '20251111000000-add-late-payment-fields';
INSERT INTO "SequelizeMeta" (name) VALUES ('20251111000000-add-late-payment-fields.js');

-- Verify the fix
SELECT * FROM "SequelizeMeta" WHERE name LIKE '%20251111%' ORDER BY name;
