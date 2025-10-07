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
  paymentType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'payment_type'
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
