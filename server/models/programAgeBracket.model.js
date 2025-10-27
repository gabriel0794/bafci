import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class ProgramAgeBracket extends Model {}

ProgramAgeBracket.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  programId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'program_id',
    references: {
      model: 'programs',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  ageRange: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'age_range',
    comment: 'Age range in format "18 - 25" or "96 - 101 UP"'
  },
  minAge: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'min_age',
    comment: 'Minimum age for this bracket'
  },
  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_age',
    comment: 'Maximum age for this bracket (null for open-ended like "101 UP")'
  },
  contributionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'contribution_amount',
    comment: 'Monthly contribution amount for this age bracket'
  },
  availmentPeriod: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'availment_period',
    comment: 'Availment period in format "3 mons & 1 day"'
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
  modelName: 'ProgramAgeBracket',
  tableName: 'program_age_brackets',
  underscored: true,
  timestamps: true
});

// This will be called after all models are loaded
ProgramAgeBracket.associate = (models) => {
  ProgramAgeBracket.belongsTo(models.Program, {
    foreignKey: 'programId',
    as: 'program'
  });
};

export default ProgramAgeBracket;
