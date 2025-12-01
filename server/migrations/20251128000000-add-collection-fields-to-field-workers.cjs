'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add total_membership_fee_collection column
    await queryInterface.addColumn('field_workers', 'total_membership_fee_collection', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    });

    // Add total_monthly_payment_collection column
    await queryInterface.addColumn('field_workers', 'total_monthly_payment_collection', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('field_workers', 'total_membership_fee_collection');
    await queryInterface.removeColumn('field_workers', 'total_monthly_payment_collection');
  }
};
