import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface, Sequelize) {
    // First, remove the payment_type column
    await queryInterface.removeColumn('payments', 'payment_type');
    
    // Rename period_end to next_payment
    await queryInterface.renameColumn('payments', 'period_end', 'next_payment');
    
    // Remove the old index on payment_type
    await queryInterface.removeIndex('payments', ['payment_type']);
    
    // Add index on next_payment if it doesn't exist
    const [results] = await queryInterface.sequelize.query(
      `SELECT * FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'payments_next_payment';`
    );
    
    if (results.length === 0) {
      await queryInterface.addIndex('payments', ['next_payment']);
    }
  },

  async down(queryInterface, Sequelize) {
    // Add back payment_type column
    await queryInterface.addColumn('payments', 'payment_type', {
      type: Sequelize.ENUM('membership_fee', 'monthly_contribution'),
      allowNull: true,
      defaultValue: 'monthly_contribution'
    });
    
    // Rename next_payment back to period_end
    await queryInterface.renameColumn('payments', 'next_payment', 'period_end');
    
    // Remove the next_payment index
    await queryInterface.removeIndex('payments', ['next_payment']);
    
    // Add back the payment_type index
    await queryInterface.addIndex('payments', ['payment_type']);
  }
};

export const _meta = {
  version: 1
};
