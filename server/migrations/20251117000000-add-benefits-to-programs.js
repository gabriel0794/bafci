export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('programs', 'benefits', {
    type: Sequelize.TEXT,
    allowNull: true,
    after: 'name'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('programs', 'benefits');
};
