export const up = async (queryInterface, Sequelize) => {
  const tableDescription = await queryInterface.describeTable('revenues');
  
  // Add receipt column if it doesn't exist
  if (!tableDescription.receipt) {
    await queryInterface.addColumn('revenues', 'receipt', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to uploaded receipt image for expenses'
    });
  }

  // Update category ENUM
  // First, convert any existing records to the new categories
  await queryInterface.sequelize.query(`
    UPDATE revenues 
    SET category = 'electric_bill' 
    WHERE category IN ('membership', 'training', 'merchandise', 'monthly', 'other')
  `);

  // For PostgreSQL: Drop old ENUM and create new one
  if (queryInterface.sequelize.options.dialect === 'postgres') {
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category DROP DEFAULT;
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_revenues_category";
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_revenues_category" AS ENUM ('electric_bill', 'water_bill', 'monthly_rent', 'internet');
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category TYPE "enum_revenues_category" USING category::text::"enum_revenues_category";
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category SET DEFAULT 'electric_bill';
    `);
  } else {
    // For MySQL/MariaDB
    await queryInterface.changeColumn('revenues', 'category', {
      type: Sequelize.ENUM('electric_bill', 'water_bill', 'monthly_rent', 'internet'),
      allowNull: false,
      defaultValue: 'electric_bill'
    });
  }
};

export const down = async (queryInterface, Sequelize) => {
  const tableDescription = await queryInterface.describeTable('revenues');
  
  // Remove receipt column if it exists
  if (tableDescription.receipt) {
    await queryInterface.removeColumn('revenues', 'receipt');
  }

  // Revert category ENUM to original values
  if (queryInterface.sequelize.options.dialect === 'postgres') {
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category DROP DEFAULT;
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_revenues_category";
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_revenues_category" AS ENUM ('membership', 'training', 'merchandise', 'monthly', 'other');
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category TYPE "enum_revenues_category" USING category::text::"enum_revenues_category";
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE revenues 
      ALTER COLUMN category SET DEFAULT 'other';
    `);
  } else {
    // For MySQL/MariaDB
    await queryInterface.changeColumn('revenues', 'category', {
      type: Sequelize.ENUM('membership', 'training', 'merchandise', 'monthly', 'other'),
      allowNull: false,
      defaultValue: 'other'
    });
  }
};
