import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Check if Members table already exists
  const tables = await queryInterface.showAllTables();
  const membersTableExists = tables.includes('Members');

  if (!membersTableExists) {
    await queryInterface.createTable('Members', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      applicationNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nickname: Sequelize.STRING,
      age: Sequelize.INTEGER,
      program: Sequelize.STRING,
      ageBracket: Sequelize.STRING,
      contributionAmount: Sequelize.DECIMAL(10, 2),
      availmentPeriod: Sequelize.STRING,
      picture: Sequelize.STRING,
      dateApplied: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.fn('NOW')
      },
      completeAddress: Sequelize.TEXT,
      provincialAddress: Sequelize.TEXT,
      dateOfBirth: Sequelize.DATEONLY,
      placeOfBirth: Sequelize.STRING,
      sex: Sequelize.STRING,
      civilStatus: Sequelize.STRING,
      spouseName: Sequelize.STRING,
      spouseDob: Sequelize.DATEONLY,
      churchAffiliation: Sequelize.STRING,
      educationAttainment: Sequelize.STRING,
      presentEmployment: Sequelize.STRING,
      employerName: Sequelize.STRING,
      contactNumber: Sequelize.STRING,
      beneficiaryName: Sequelize.STRING,
      beneficiaryDob: Sequelize.DATEONLY,
      beneficiaryAge: Sequelize.INTEGER,
      beneficiaryRelationship: Sequelize.STRING,
      datePaid: Sequelize.DATEONLY,
      receivedBy: Sequelize.STRING,
      orNumber: Sequelize.STRING,
      endorsedBy: Sequelize.STRING,
      branch: Sequelize.STRING,
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Members');
};
