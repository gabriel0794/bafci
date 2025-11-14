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
    logging: false
  }
);

async function markComplete() {
  try {
    await sequelize.authenticate();
    
    // Mark the late payment fields migration as complete since columns already exist
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20251111000000-add-late-payment-fields.js')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✓ Marked 20251111000000-add-late-payment-fields.js as complete');
    console.log('  (Columns already exist in database)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

markComplete();
