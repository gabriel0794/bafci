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
    logging: false
  }
);

async function seedFieldWorkers() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const fieldWorkers = [
      { name: 'Romeo S. Lacar Jr.', age: 46, branch_id: 3, member_count: 0 },
    ];

    for (const worker of fieldWorkers) {
      await sequelize.query(
        `INSERT INTO "field_workers" (name, age, branch_id, member_count, created_at, updated_at)
         VALUES (:name, :age, :branch_id, :member_count, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        {
          replacements: worker,
          type: Sequelize.QueryTypes.INSERT
        }
      );
      console.log(`Inserted field worker: ${worker.name}`);
    }

    console.log('All field workers seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding field workers:', error);
    process.exit(1);
  }
}

seedFieldWorkers();
