'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Revenues', 'periodType');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Revenues', 'periodType', {
      type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'daily'
    });
  }
};
