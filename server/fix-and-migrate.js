import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'bafci',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 6969,
    dialect: 'postgres',
    logging: console.log
  }
);

async function fixAndMigrate() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Fix the SequelizeMeta entry
    console.log('\n1. Fixing SequelizeMeta table...');
    await sequelize.query(`
      DELETE FROM "SequelizeMeta" WHERE name = '20251111000000-add-late-payment-fields';
    `);
    console.log('   - Removed old entry without .js extension');

    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20251111000000-add-late-payment-fields.js')
      ON CONFLICT DO NOTHING;
    `);
    console.log('   - Added correct entry with .js extension');

    // Verify the fix
    const [results] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" 
      WHERE name LIKE '%20251111%' OR name LIKE '%20251113%'
      ORDER BY name;
    `);
    console.log('\n2. Current migration status for these files:');
    results.forEach(row => {
      console.log(`   - ${row.name}`);
    });

    console.log('\n✓ Fix complete! Now run: npx sequelize-cli db:migrate');
    console.log('  This will apply the barangay_members migration.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixAndMigrate();
