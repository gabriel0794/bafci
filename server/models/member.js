import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Member extends Model {}

Member.init({
  applicationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'application_number'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name'
  },
  nickname: DataTypes.STRING,
  age: DataTypes.INTEGER,
  program: DataTypes.STRING,
  ageBracket: {
    type: DataTypes.STRING,
    field: 'age_bracket'
  },
  contributionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'contribution_amount'
  },
  availmentPeriod: {
    type: DataTypes.STRING,
    field: 'availment_period'
  },
  picture: DataTypes.STRING,
  dateApplied: {
    type: DataTypes.DATEONLY,
    field: 'date_applied'
  },
  completeAddress: {
    type: DataTypes.TEXT,
    field: 'complete_address'
  },
  provincialAddress: {
    type: DataTypes.TEXT,
    field: 'provincial_address'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth'
  },

  placeOfBirth: {
    type: DataTypes.STRING,
    field: 'place_of_birth'
  },
  sex: DataTypes.STRING,
  civilStatus: {
    type: DataTypes.STRING,
    field: 'civil_status'
  },
  spouseName: {
    type: DataTypes.STRING,
    field: 'spouse_name'
  },
  spouseDob: {
    type: DataTypes.DATEONLY,
    field: 'spouse_dob'
  },
  churchAffiliation: {
    type: DataTypes.STRING,
    field: 'church_affiliation'
  },
  educationAttainment: {
    type: DataTypes.STRING,
    field: 'education_attainment'
  },
  presentEmployment: {
    type: DataTypes.STRING,
    field: 'present_employment'
  },
  employerName: {
    type: DataTypes.STRING,
    field: 'employer_name'
  },
  contactNumber: {
    type: DataTypes.STRING,
    field: 'contact_number'
  },
  beneficiaryName: {
    type: DataTypes.STRING,
    field: 'beneficiary_name'
  },
  beneficiaryDob: {
    type: DataTypes.DATEONLY,
    field: 'beneficiary_dob'
  },
  beneficiaryAge: {
    type: DataTypes.INTEGER,
    field: 'beneficiary_age'
  },
  beneficiaryRelationship: {
    type: DataTypes.STRING,
    field: 'beneficiary_relationship'
  },
  datePaid: {
    type: DataTypes.DATEONLY,
    field: 'date_paid'
  },
  receivedBy: {
    type: DataTypes.STRING,
    field: 'received_by'
  },
  orNumber: {
    type: DataTypes.STRING,
    field: 'or_number'
  },
  fieldWorkerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'field_worker_id',
    references: {
      model: 'field_workers',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  branch: DataTypes.STRING
}, {
  sequelize,
  modelName: 'Member',
  tableName: 'members',
  timestamps: true,
  underscored: true
});

// This will be called after all models are loaded
Member.associate = (models) => {
  Member.hasMany(models.Payment, {
    foreignKey: 'memberId',
    as: 'payments'
  });
  
  Member.belongsTo(models.FieldWorker, {
    foreignKey: 'fieldWorkerId',
    as: 'fieldWorker',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
};

export default Member;