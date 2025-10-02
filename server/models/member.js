import { DataTypes, Model } from 'sequelize';

class Member extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Define association with Payment
    Member.hasMany(models.Payment, {
      foreignKey: 'memberId',
      as: 'payments'
    });
  }
}

const initModel = (sequelize) => {
  
  Member.init({
    applicationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nickname: DataTypes.STRING,
    age: DataTypes.INTEGER,
    program: DataTypes.STRING,
    ageBracket: DataTypes.STRING,
    contributionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    availmentPeriod: DataTypes.STRING,
    picture: DataTypes.STRING,
    dateApplied: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    },
    completeAddress: DataTypes.TEXT,
    provincialAddress: DataTypes.TEXT,
    dateOfBirth: DataTypes.DATEONLY,
    placeOfBirth: DataTypes.STRING,
    sex: DataTypes.STRING,
    civilStatus: DataTypes.STRING,
    spouseName: DataTypes.STRING,
    spouseDob: DataTypes.DATEONLY,
    churchAffiliation: DataTypes.STRING,
    educationAttainment: DataTypes.STRING,
    presentEmployment: DataTypes.STRING,
    employerName: DataTypes.STRING,
    contactNumber: DataTypes.STRING,
    beneficiaryName: DataTypes.STRING,
    beneficiaryDob: DataTypes.DATEONLY,
    beneficiaryAge: DataTypes.INTEGER,
    beneficiaryRelationship: DataTypes.STRING,
    datePaid: DataTypes.DATEONLY,
    receivedBy: DataTypes.STRING,
    orNumber: DataTypes.STRING,
    endorsedBy: DataTypes.STRING,
    branch: DataTypes.STRING,
    membershipFeePaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'membership_fee_paid'
    },
    membershipFeePaidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'membership_fee_paid_date',
      validate: {
        isDate: {
          msg: 'Membership fee paid date must be a valid date'
        }
      }
    },
    lastContributionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_contribution_date',
      validate: {
        isDate: {
          msg: 'Last contribution date must be a valid date'
        }
      }
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'next_due_date',
      validate: {
        isDate: {
          msg: 'Next due date must be a valid date'
        }
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Member',
    tableName: 'Members',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['membership_fee_paid']
      },
      {
        fields: ['next_due_date']
      }
    ]
  });
  
  return Member;
};

export { initModel as initMember, Member };