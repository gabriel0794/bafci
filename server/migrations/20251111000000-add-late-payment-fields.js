import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'is_late', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether the payment was made after the 5th of the month'
    });

    await queryInterface.addColumn('payments', 'late_fee_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Late fee percentage applied to delayed payments'
    });

    await queryInterface.addColumn('payments', 'late_fee_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Calculated late fee amount'
    });

    await queryInterface.addColumn('payments', 'total_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Total amount including late fees (amount + late_fee_amount)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('payments', 'is_late');
    await queryInterface.removeColumn('payments', 'late_fee_percentage');
    await queryInterface.removeColumn('payments', 'late_fee_amount');
    await queryInterface.removeColumn('payments', 'total_amount');
  }
};

export const _meta = {
  version: 1
};
