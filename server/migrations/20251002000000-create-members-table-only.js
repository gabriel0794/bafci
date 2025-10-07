import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('members', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      applicationNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'application_number'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'full_name'
      },
      nickname: Sequelize.STRING,
      age: Sequelize.INTEGER,
      program: Sequelize.STRING,
      ageBracket: {
        type: Sequelize.STRING,
        field: 'age_bracket'
      },
      contributionAmount: {
        type: Sequelize.DECIMAL(10, 2),
        field: 'contribution_amount'
      },
      availmentPeriod: {
        type: Sequelize.STRING,
        field: 'availment_period'
      },
      picture: Sequelize.STRING,
      dateApplied: {
        type: Sequelize.DATEONLY,
        field: 'date_applied',
        defaultValue: Sequelize.fn('NOW')
      },
      completeAddress: {
        type: Sequelize.TEXT,
        field: 'complete_address'
      },
      provincialAddress: {
        type: Sequelize.TEXT,
        field: 'provincial_address'
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        field: 'date_of_birth'
      },
      placeOfBirth: {
        type: Sequelize.STRING,
        field: 'place_of_birth'
      },
      sex: Sequelize.STRING,
      civilStatus: {
        type: Sequelize.STRING,
        field: 'civil_status'
      },
      spouseName: {
        type: Sequelize.STRING,
        field: 'spouse_name'
      },
      spouseDob: {
        type: Sequelize.DATEONLY,
        field: 'spouse_dob'
      },
      churchAffiliation: {
        type: Sequelize.STRING,
        field: 'church_affiliation'
      },
      educationAttainment: {
        type: Sequelize.STRING,
        field: 'education_attainment'
      },
      presentEmployment: {
        type: Sequelize.STRING,
        field: 'present_employment'
      },
      employerName: {
        type: Sequelize.STRING,
        field: 'employer_name'
      },
      contactNumber: {
        type: Sequelize.STRING,
        field: 'contact_number'
      },
      beneficiaryName: {
        type: Sequelize.STRING,
        field: 'beneficiary_name'
      },
      beneficiaryDob: {
        type: Sequelize.DATEONLY,
        field: 'beneficiary_dob'
      },
      beneficiaryAge: {
        type: Sequelize.INTEGER,
        field: 'beneficiary_age'
      },
      beneficiaryRelationship: {
        type: Sequelize.STRING,
        field: 'beneficiary_relationship'
      },
      datePaid: {
        type: Sequelize.DATEONLY,
        field: 'date_paid'
      },
      receivedBy: {
        type: Sequelize.STRING,
        field: 'received_by'
      },
      orNumber: {
        type: Sequelize.STRING,
        field: 'or_number'
      },
      endorsedBy: {
        type: Sequelize.STRING,
        field: 'endorsed_by'
      },
      branch: Sequelize.STRING,
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('members');
};
