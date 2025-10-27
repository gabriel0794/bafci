export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('members', 'field_worker_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'field_workers',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('members', 'field_worker_id');
};
