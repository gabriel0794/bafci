import { DataTypes, Model } from 'sequelize';

class FieldWorker extends Model {}

const initModel = (sequelize) => {
  FieldWorker.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      },
      field: 'branch_id',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'member_count'
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
    modelName: 'FieldWorker',
    tableName: 'field_workers',
    timestamps: true,
    underscored: true
  });

  // Define association in the associate method
  FieldWorker.associate = function(models) {
    FieldWorker.hasMany(models.Member, {
      foreignKey: 'fieldWorkerId',
      as: 'members'
    });
    
    // Add belongsTo association with Branch
    FieldWorker.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
  };

  return FieldWorker;
};

export { initModel as initFieldWorker, FieldWorker };
