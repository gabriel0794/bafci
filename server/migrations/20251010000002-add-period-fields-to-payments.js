/** @type {import('sequelize-cli').Migration} */
import { QueryTypes } from 'sequelize';

export default {
  async up(queryInterface, Sequelize) {
    // Check if period_start column exists in payments table
    const periodStartExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'period_start'
      )`,
      { type: QueryTypes.SELECT }
    );

    // Add period_start if it doesn't exist
    if (!periodStartExists[0].exists) {
      await queryInterface.addColumn('payments', 'period_start', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Start date of the payment period'
      });
      console.log('Added period_start column to payments table');
    }

    // Check if next_payment column exists in payments table
    const nextPaymentExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'next_payment'
      )`,
      { type: QueryTypes.SELECT }
    );

    // Add next_payment if it doesn't exist
    if (!nextPaymentExists[0].exists) {
      await queryInterface.addColumn('payments', 'next_payment', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Next payment due date'
      });
      console.log('Added next_payment column to payments table');
    }
  },

  async down(queryInterface, Sequelize) {
    // This will be a no-op since we're only adding columns if they don't exist
    console.log('No need to rollback - columns were only added if they did not exist');
  }
};
