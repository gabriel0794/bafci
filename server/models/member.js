import { DataTypes, Model } from 'sequelize';

class Member extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
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
    contributionAmount: DataTypes.DECIMAL,
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
    timestamps: true,
    underscored: true
  });
  
  return Member;
};

export { initModel as initMember, Member };