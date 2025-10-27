import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: console.log
  }
);

async function checkBranches() {
  try {
    const [branches] = await sequelize.query(
      `SELECT id, name FROM branches ORDER BY id`
    );
    
    console.log('\n=== All Branches ===');
    branches.forEach(branch => {
      console.log(`ID: ${branch.id}, Name: "${branch.name}"`);
    });
    
    console.log('\n=== Looking for specific branches ===');
    const [targetBranches] = await sequelize.query(
      `SELECT id, name FROM branches WHERE name IN ('Carmen (CDO)', 'OPOL')`
    );
    
    console.log('Found branches:', targetBranches);
    
    console.log('\n=== Current Programs ===');
    const [programs] = await sequelize.query(
      `SELECT id, name, branch_id FROM programs ORDER BY branch_id, id`
    );
    
    programs.forEach(program => {
      console.log(`Program ID: ${program.id}, Name: ${program.name}, Branch ID: ${program.branch_id}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
  }
}

checkBranches();
