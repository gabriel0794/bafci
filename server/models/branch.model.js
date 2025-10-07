import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Branch extends Model {}

Branch.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Branch',
  tableName: 'branches',
  underscored: true,
  timestamps: true
});

// This will be called after all models are loaded
Branch.associate = (models) => {
  Branch.hasMany(models.FieldWorker, {
    foreignKey: 'branchId',
    as: 'fieldWorkers'
  });

  Branch.hasMany(models.Revenue, {
    foreignKey: 'branchId',
    as: 'revenues'
  });
};

export default Branch;
