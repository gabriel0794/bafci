import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import Branch from './branch.model.js';

const Revenue = sequelize.define('Revenue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notZero: function(value) {
        if (parseFloat(value) === 0) {
          throw new Error('Amount cannot be zero');
        }
      }
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  category: {
    type: DataTypes.ENUM('membership', 'training', 'merchandise', 'monthly','other'),
    allowNull: false,
    defaultValue: 'other',
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Branches',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',  // Changed from 'Staff' to 'Users' to match your existing table
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// Associations are defined in models/index.js to avoid circular dependencies

export default Revenue;
