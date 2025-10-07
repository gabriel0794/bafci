import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Member extends Model {}

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
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  birthDate: DataTypes.DATEONLY,
  civilStatus: DataTypes.STRING,
  gender: DataTypes.STRING,
  address: DataTypes.TEXT,
  contactNumber: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  barangay: DataTypes.STRING,
  city: DataTypes.STRING,
  province: DataTypes.STRING,
  region: DataTypes.STRING,
  spouseName: DataTypes.STRING,
  spouseBirthDate: DataTypes.DATEONLY,
  spouseContactNumber: DataTypes.STRING,
  spouseOccupation: DataTypes.STRING,
  spouseMonthlyIncome: DataTypes.DECIMAL(10, 2),
  fatherName: DataTypes.STRING,
  fatherBirthDate: DataTypes.DATEONLY,
  fatherContactNumber: DataTypes.STRING,
  fatherOccupation: DataTypes.STRING,
  fatherMonthlyIncome: DataTypes.DECIMAL(10, 2),
  motherName: DataTypes.STRING,
  motherBirthDate: DataTypes.DATEONLY,
  motherContactNumber: DataTypes.STRING,
  motherOccupation: DataTypes.STRING,
  motherMonthlyIncome: DataTypes.DECIMAL(10, 2),
  dependents: DataTypes.INTEGER,
  dependentsInfo: DataTypes.TEXT,
  educationalAttainment: DataTypes.STRING,
  schoolName: DataTypes.STRING,
  course: DataTypes.STRING,
  yearLevel: DataTypes.STRING,
  isCurrentlyEnrolled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isGraduated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  yearGraduated: DataTypes.STRING,
  isEmployed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  employmentStatus: DataTypes.STRING,
  occupation: DataTypes.STRING,
  employerName: DataTypes.STRING,
  employerAddress: DataTypes.TEXT,
  employerContactNumber: DataTypes.STRING,
  monthlyIncome: DataTypes.DECIMAL(10, 2),
  yearsInCurrentJob: DataTypes.INTEGER,
  isSelfEmployed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  businessName: DataTypes.STRING,
  businessType: DataTypes.STRING,
  businessAddress: DataTypes.TEXT,
  businessContactNumber: DataTypes.STRING,
  businessYearsInOperation: DataTypes.INTEGER,
  averageMonthlyIncome: DataTypes.DECIMAL(10, 2),
  isOFW: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  country: DataTypes.STRING,
  yearsWorkingAbroad: DataTypes.INTEGER,
  monthlyRemittance: DataTypes.DECIMAL(10, 2),
  isPensioner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pensionType: DataTypes.STRING,
  monthlyPension: DataTypes.DECIMAL(10, 2),
  isStudent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  schoolLevel: DataTypes.STRING,
  schoolNameStudent: DataTypes.STRING,
  yearLevelStudent: DataTypes.STRING,
  isSingleParent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  numberOfChildren: DataTypes.INTEGER,
  childrenAges: DataTypes.STRING,
  isPWD: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  disabilityType: DataTypes.STRING,
  isSeniorCitizen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  seniorCitizenId: DataTypes.STRING,
  isIndigenous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  indigenousGroup: DataTypes.STRING,
  isSoloParent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  soloParentId: DataTypes.STRING,
  is4PsBeneficiary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  householdId4Ps: DataTypes.STRING,
  isPantawidPamilyaBeneficiary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  householdIdPantawid: DataTypes.STRING,
  isTUPADBeneficiary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tupadId: DataTypes.STRING,
  isOtherGovernmentAssistance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  governmentAssistanceType: DataTypes.STRING,
  governmentAssistanceDetails: DataTypes.TEXT,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  remarks: DataTypes.TEXT,
  fieldWorkerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'field_workers',
      key: 'id'
    },
    field: 'field_worker_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
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