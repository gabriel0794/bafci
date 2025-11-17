import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Check if DATABASE_URL is provided (production/Render)
// Otherwise use individual variables (local development)
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use DATABASE_URL from Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render PostgreSQL
      }
    },
    logging: false, // Disable logging in production
  });
  console.log('Using DATABASE_URL for connection');
} else {
  // Local development: Use individual environment variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: process.env.DB_PORT,
      logging: false,
    }
  );
  console.log('Using individual DB variables for connection');
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Connection details:', {
      usingDatabaseUrl: !!process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    process.exit(1);
  }
};

export default sequelize;