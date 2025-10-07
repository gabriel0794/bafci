export const up = async (queryInterface, Sequelize) => {
  // First check if the column already exists
  const tableDescription = await queryInterface.describeTable('Revenues');
  
  if (!tableDescription.branchId) {
    await queryInterface.addColumn('Revenues', 'branchId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for existing records
      references: {
        model: 'Branches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};

export const down = async (queryInterface, Sequelize) => {
  const tableDescription = await queryInterface.describeTable('Revenues');
  
  if (tableDescription.branchId) {
    await queryInterface.removeColumn('Revenues', 'branchId');
  }
};
