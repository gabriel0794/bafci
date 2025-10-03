/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
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
          model: 'Members',
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
      paymentType: {
        type: Sequelize.ENUM('membership_fee', 'monthly_contribution'),
        allowNull: false,
        field: 'payment_type',
        defaultValue: 'monthly_contribution'
      },
      periodStart: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'period_start',
        comment: 'Start date of the payment period (for recurring payments)'
      },
      periodEnd: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'period_end',
        comment: 'End date of the payment period (for recurring payments)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'overdue'),
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
    await queryInterface.addIndex('Payments', ['member_id']);
    await queryInterface.addIndex('Payments', ['payment_date']);
    await queryInterface.addIndex('Payments', ['status']);
    await queryInterface.addIndex('Payments', ['payment_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};