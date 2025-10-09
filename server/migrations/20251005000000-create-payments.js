/** @type {import('sequelize-cli').Migration} */
import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface, Sequelize) {
    // Create ENUM types first
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'member_id'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'payment_date',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      periodStart: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'period_start',
        comment: 'Start date of the payment period'
      },
      nextPayment: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'next_payment',
        comment: 'Next payment due date'
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      referenceNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'reference_number'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for frequently queried fields
    await queryInterface.addIndex('payments', ['member_id']);
    await queryInterface.addIndex('payments', ['payment_date']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['next_payment']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};