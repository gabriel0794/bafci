import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Branches', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

};

export const down = async (queryInterface, Sequelize) => {
  // First, remove the foreign key constraint from Revenues
  const tableDescription = await queryInterface.describeTable('Revenues');
  
  if (tableDescription.branchId) {
    // Get the constraint name
    const [results] = await queryInterface.sequelize.query(
      `SELECT constraint_name 
       FROM information_schema.table_constraints 
       WHERE table_name = 'Revenues' 
       AND constraint_type = 'FOREIGN KEY' 
       AND constraint_name LIKE '%branchId%'`
    );
    
    if (results && results.length > 0) {
      const constraintName = results[0].constraint_name;
      await queryInterface.removeConstraint('Revenues', constraintName);
    }
    
    // Remove the column
    await queryInterface.removeColumn('Revenues', 'branchId');
  }
  
  // Now it's safe to drop the Branches table
  await queryInterface.dropTable('Branches');
};
