import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Branch extends Model {}

const initModel = (sequelize) => {
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

  // Define association in the associate method
  Branch.associate = function(models) {
    Branch.hasMany(models.FieldWorker, {
      foreignKey: 'branchId',
      as: 'fieldWorkers'
    });
  };

  return Branch;
};

const Branch = initModel(sequelize);

export default Branch;
