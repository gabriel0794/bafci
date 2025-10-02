'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Disable foreign key checks
    await queryInterface.sequelize.query('SET CONSTRAINTS ALL DEFERRED');

    // Drop existing tables in reverse order of dependencies
    const tables = [
      'Payments',
      'Members',
      'Branches',
      'Revenues',
      'Users'
    ];

    for (const table of tables) {
      try {
        await queryInterface.dropTable(table, { cascade: true, force: true });
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Table ${table} does not exist or could not be dropped:`, error.message);
      }
    }

    // Recreate tables in the correct order
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: Sequelize.STRING,
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      password: Sequelize.STRING,
      role: {
        type: Sequelize.STRING,
        defaultValue: 'user',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('Branches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('Revenues', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      amount: Sequelize.DECIMAL(10, 2),
      description: Sequelize.STRING,
      date: Sequelize.DATEONLY,
      branchId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Branches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('Members', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... (all existing Member fields)
      membershipFeePaid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'membership_fee_paid',
      },
      membershipFeePaidDate: {
        type: Sequelize.DATEONLY,
        field: 'membership_fee_paid_date',
        allowNull: true,
      },
      lastContributionDate: {
        type: Sequelize.DATEONLY,
        field: 'last_contribution_date',
        allowNull: true,
      },
      nextDueDate: {
        type: Sequelize.DATEONLY,
        field: 'next_due_date',
        allowNull: true,
      },
      // ... (other Member fields)
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('Payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Members',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'member_id',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'payment_date',
        defaultValue: Sequelize.NOW,
      },
      paymentType: {
        type: Sequelize.ENUM('membership_fee', 'monthly_contribution'),
        allowNull: false,
        field: 'payment_type',
        defaultValue: 'monthly_contribution',
      },
      periodStart: {
        type: Sequelize.DATEONLY,
        field: 'period_start',
        allowNull: true,
      },
      periodEnd: {
        type: Sequelize.DATEONLY,
        field: 'period_end',
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'pending',
      },
      referenceNumber: {
        type: Sequelize.STRING,
        field: 'reference_number',
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // Add indexes
    await queryInterface.addIndex('Payments', ['member_id']);
    await queryInterface.addIndex('Payments', ['payment_date']);
    await queryInterface.addIndex('Payments', ['status']);
    await queryInterface.addIndex('Payments', ['payment_type']);
    await queryInterface.addIndex('Members', ['membership_fee_paid']);
    await queryInterface.addIndex('Members', ['next_due_date']);

    console.log('Database schema has been reset successfully');
  },

  async down(queryInterface, Sequelize) {
    // This is a one-way migration
    console.log('This migration cannot be rolled back automatically');
  }
};
