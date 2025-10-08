'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Add the username column, allowing null values temporarily
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING,
      allowNull: true, // Allow nulls initially
      unique: true,
    });

    // Populate the username column for existing users using their email
    await queryInterface.sequelize.query(
      'UPDATE users SET username = email WHERE username IS NULL'
    );

    // Alter the column to be NOT NULL
    await queryInterface.changeColumn('users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'username');
  }
};
