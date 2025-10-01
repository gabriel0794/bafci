import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function addBranchIdColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Revenues' AND column_name = 'branchId';
    `);

    if (results.length > 0) {
      console.log('branchId column already exists in Revenues table.');
      process.exit(0);
    }

    // Add the branchId column
    console.log('Adding branchId column to Revenues table...');
    await sequelize.query(`
      ALTER TABLE "Revenues" 
      ADD COLUMN "branchId" INTEGER 
      REFERENCES "Branches"(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
    `);

    console.log('✅ branchId column added successfully!');
    
    // Verify the column was added
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Revenues' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nRevenues table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding branchId column:', error);
    process.exit(1);
  }
}

addBranchIdColumn();
