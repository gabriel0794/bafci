import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Payment extends Model {}

Payment.init({
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'member_id',
    references: {
      model: 'members',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'payment_date',
    defaultValue: DataTypes.NOW
  },
  referenceNumber: {
    type: DataTypes.STRING,
    field: 'reference_number',
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed'
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    field: 'period_start',
    comment: 'Start date of the payment period'
  },
  nextPayment: {
    type: DataTypes.DATEONLY,
    field: 'next_payment',
    comment: 'Next payment due date'
  },
  isLate: {
    type: DataTypes.BOOLEAN,
    field: 'is_late',
    defaultValue: false,
    allowNull: false,
    comment: 'Whether the payment was made after the 5th of the month'
  },
  lateFeePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'late_fee_percentage',
    defaultValue: 0,
    allowNull: false,
    comment: 'Late fee percentage applied to delayed payments'
  },
  lateFeeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'late_fee_amount',
    defaultValue: 0,
    allowNull: false,
    comment: 'Calculated late fee amount'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'total_amount',
    defaultValue: 0,
    allowNull: false,
    comment: 'Total amount including late fees (amount + late_fee_amount)'
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
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: true,
  underscored: true
});

// This will be called after all models are loaded
Payment.associate = (models) => {
  Payment.belongsTo(models.Member, {
    foreignKey: 'memberId',
    as: 'member'
  });
};

export default Payment;
