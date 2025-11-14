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

async function removeDuplicate() {
  try {
    await sequelize.authenticate();
    
    // Simply remove the entry without .js extension
    await sequelize.query(`
      DELETE FROM "SequelizeMeta" 
      WHERE name = '20251111000000-add-late-payment-fields';
    `);
    
    console.log('✓ Removed duplicate entry');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

removeDuplicate();
