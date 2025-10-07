export const up = async (queryInterface, Sequelize) => {
  // First check if the column already exists
  const tableDescription = await queryInterface.describeTable('revenues');
  
  if (!tableDescription.branch_id) {
    await queryInterface.addColumn('revenues', 'branch_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for existing records
      references: {
        model: 'branches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};

export const down = async (queryInterface, Sequelize) => {
  const tableDescription = await queryInterface.describeTable('revenues');
  
  if (tableDescription.branch_id) {
    await queryInterface.removeColumn('revenues', 'branch_id');
  }
};
