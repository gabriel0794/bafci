import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bafci',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 6969,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 10000
    }
  }
);

// Define the correct order of migrations
const MIGRATION_ORDER = [
  '20251001000001-create-branches.js',
  '20230929123216-create-revenue.js',
  '20251001000002-add-branch-to-revenues.js',
  '20251003000000-create-members-table-only.js',
  '20251003011800-add-payment-fields-to-members.js',
  '20251003021351-create-payments.js',
  '20251003020000-fix-database-schema.js',
  '20251111000000-add-late-payment-fields.js',
  '20251117000000-add-benefits-to-programs.js'
];

async function runMigrations() {
  const transaction = await sequelize.transaction();
  
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Get files in the correct order
    const migrationFiles = MIGRATION_ORDER.filter(file => 
      fs.existsSync(path.join(migrationsDir, file))
    );

    console.log('Found migrations in order:');
    migrationFiles.forEach(file => console.log(`- ${file}`));

    // Create SequelizeMeta table if it doesn't exist
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('SequelizeMeta', {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      }
    }, { transaction, ifNotExists: true });

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta"',
      { transaction }
    );
    
    const executedMigrationNames = executedMigrations.map(m => m.name);
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrationNames.includes(file.replace('.js', ''))
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations.');
      await transaction.commit();
      return;
    }

    console.log('Running pending migrations in this order:');
    pendingMigrations.forEach(file => console.log(`- ${file}`));

    // Run pending migrations
    for (const file of pendingMigrations) {
      try {
        console.log(`\nRunning migration: ${file}`);
        const migrationModule = await import(`file://${path.join(migrationsDir, file)}`);
        const migration = migrationModule.default || migrationModule;
        
        // Run the migration
        await migration.up(queryInterface, Sequelize, { transaction });
        
        // Record the migration
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES ($1) ON CONFLICT DO NOTHING',
          { 
            bind: [file.replace('.js', '')],
            transaction 
          }
        );
        
        console.log(`✅ Successfully ran migration: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error);
        throw error; // This will trigger the rollback
      }
    }

    await transaction.commit();
    console.log('\nAll migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nError running migrations:', error);
    await transaction.rollback();
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migrations
runMigrations();
