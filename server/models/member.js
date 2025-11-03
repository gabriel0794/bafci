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
  branch: DataTypes.STRING,
  membershipFeePaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'membership_fee_paid'
  },
  membershipFeeAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 600,
    field: 'membership_fee_amount'
  },
  membershipFeePaidDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'membership_fee_paid_date'
  },
  lastContributionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_contribution_date'
  },
  nextDueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'next_due_date'
  }
}, {
  sequelize,
  modelName: 'Member',
  tableName: 'members',
  timestamps: true,
  underscored: true,
  hooks: {
    // After creating a new member, increment the field worker's member count
    afterCreate: async (member, options) => {
      if (member.fieldWorkerId) {
        const FieldWorker = sequelize.models.FieldWorker;
        await FieldWorker.increment('memberCount', {
          by: 1,
          where: { id: member.fieldWorkerId },
          transaction: options.transaction
        });
      }
    },
    
    // After updating a member, adjust member counts if field worker changed
    afterUpdate: async (member, options) => {
      // Check if fieldWorkerId was changed
      if (member.changed('fieldWorkerId')) {
        const FieldWorker = sequelize.models.FieldWorker;
        const previousFieldWorkerId = member._previousDataValues.fieldWorkerId;
        const newFieldWorkerId = member.fieldWorkerId;
        
        // Decrement count for previous field worker
        if (previousFieldWorkerId) {
          await FieldWorker.decrement('memberCount', {
            by: 1,
            where: { id: previousFieldWorkerId },
            transaction: options.transaction
          });
        }
        
        // Increment count for new field worker
        if (newFieldWorkerId) {
          await FieldWorker.increment('memberCount', {
            by: 1,
            where: { id: newFieldWorkerId },
            transaction: options.transaction
          });
        }
      }
    },
    
    // After deleting a member, decrement the field worker's member count
    afterDestroy: async (member, options) => {
      if (member.fieldWorkerId) {
        const FieldWorker = sequelize.models.FieldWorker;
        await FieldWorker.decrement('memberCount', {
          by: 1,
          where: { id: member.fieldWorkerId },
          transaction: options.transaction
        });
      }
    }
  }
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