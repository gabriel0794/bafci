import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import Branch from './branch.model.js';

class Revenue extends Model {}

Revenue.init({
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
    type: DataTypes.ENUM('membership', 'training', 'merchandise', 'monthly', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id',
    },
    field: 'branch_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
  modelName: 'Revenue',
  tableName: 'revenues',
  timestamps: true,
  underscored: true
});

// This will be called after all models are loaded
Revenue.associate = (models) => {
  Revenue.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Revenue.belongsTo(models.Branch, {
    foreignKey: 'branchId',
    as: 'branch'
  });
};

export default Revenue;
