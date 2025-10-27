import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Program extends Model {}

Program.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'branch_id',
    references: {
      model: 'branches',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
  modelName: 'Program',
  tableName: 'programs',
  underscored: true,
  timestamps: true
});

// This will be called after all models are loaded
Program.associate = (models) => {
  Program.belongsTo(models.Branch, {
    foreignKey: 'branchId',
    as: 'branch'
  });

  Program.hasMany(models.ProgramAgeBracket, {
    foreignKey: 'programId',
    as: 'ageBrackets'
  });
};

export default Program;
