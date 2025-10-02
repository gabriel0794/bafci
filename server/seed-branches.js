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

async function seedBranches() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Insert branches
    const branches = [
      { name: 'Ozamiz', isActive: true },
      { name: 'Opol', isActive: true },
      { name: 'Cagayan de Oro City', isActive: true },
      { name: 'Gingoog', isActive: true },
      { name: 'Claveria', isActive: true },
      { name: 'Molave', isActive: true },
      { name: 'Jimenez', isActive: true }
    ];

    for (const branch of branches) {
      await sequelize.query(
        `INSERT INTO "Branches" (name, "isActive", "createdAt", "updatedAt")
         VALUES (:name, :isActive, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        {
          replacements: branch,
          type: Sequelize.QueryTypes.INSERT
        }
      );
      console.log(`Inserted branch: ${branch.name}`);
    }

    console.log('All branches seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding branches:', error);
    process.exit(1);
  }
}

seedBranches();
