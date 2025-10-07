import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // First create the ENUM type with the exact case we'll reference
  await queryInterface.sequelize.query(
    'CREATE TYPE "enum_Revenues_period_type" AS ENUM (\'daily\', \'weekly\', \'monthly\', \'yearly\')'
  );

  // Then create the table
  await queryInterface.createTable('Revenues', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    category: {
      type: Sequelize.ENUM('membership', 'training', 'merchandise', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    periodType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly',
      field: 'period_type'
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      field: 'created_at',
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      field: 'updated_at',
      defaultValue: Sequelize.NOW
    }
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Revenues');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Revenues_period_type"');
};
