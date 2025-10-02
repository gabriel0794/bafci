import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {

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
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'daily'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Revenues');
};
