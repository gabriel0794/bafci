'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // Define association with Member
      Payment.belongsTo(models.Member, {
        foreignKey: 'memberId',
        as: 'member'
      });
    }
  }

  Payment.init({
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'member_id',
      references: {
        model: 'Members',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Amount must be a valid decimal number'
        },
        min: {
          args: [0.01],
          msg: 'Amount must be greater than 0'
        }
      }
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'payment_date',
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          msg: 'Payment date must be a valid date'
        }
      }
    },
    paymentType: {
      type: DataTypes.ENUM('membership_fee', 'monthly_contribution'),
      allowNull: false,
      field: 'payment_type',
      defaultValue: 'monthly_contribution',
      validate: {
        isIn: {
          args: [['membership_fee', 'monthly_contribution']],
          msg: 'Invalid payment type'
        }
      }
    },
    periodStart: {
      type: DataTypes.DATEONLY,
      field: 'period_start',
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Period start must be a valid date'
        }
      }
    },
    periodEnd: {
      type: DataTypes.DATEONLY,
      field: 'period_end',
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Period end must be a valid date'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'paid', 'overdue']],
          msg: 'Invalid payment status'
        }
      }
    },
    referenceNumber: {
      type: DataTypes.STRING,
      field: 'reference_number',
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['member_id']
      },
      {
        fields: ['payment_date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_type']
      }
    ]
  });

  return Payment;
};
