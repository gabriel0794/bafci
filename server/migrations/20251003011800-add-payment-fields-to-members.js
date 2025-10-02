'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Members', 'membership_fee_paid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'membership_fee_paid'
    });

    await queryInterface.addColumn('Members', 'membership_fee_paid_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      field: 'membership_fee_paid_date'
    });

    await queryInterface.addColumn('Members', 'last_contribution_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      field: 'last_contribution_date',
      comment: 'Date of the last monthly contribution payment'
    });

    await queryInterface.addColumn('Members', 'next_due_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      field: 'next_due_date',
      comment: 'Next due date for contribution payment'
    });

    // Add indexes for the new fields
    await queryInterface.addIndex('Members', ['membership_fee_paid']);
    await queryInterface.addIndex('Members', ['next_due_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Members', 'membership_fee_paid');
    await queryInterface.removeColumn('Members', 'membership_fee_paid_date');
    await queryInterface.removeColumn('Members', 'last_contribution_date');
    await queryInterface.removeColumn('Members', 'next_due_date');
  }
};
