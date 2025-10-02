import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Check if periodType column exists before removing it
  const tableDescription = await queryInterface.describeTable('Revenues');
  if (tableDescription.periodType) {
    await queryInterface.removeColumn('Revenues', 'periodType');
  }
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Revenues', 'periodType', {
    type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'daily'
  });
};
