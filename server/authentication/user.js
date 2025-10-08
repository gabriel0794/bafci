import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // 1 = admin (full access), 2 = staff (regular user), 3 = account manager (can only create staff accounts)
    defaultValue: 2,
  },
}, {
  tableName: 'users', // Explicitly set the table name to lowercase
  timestamps: true,   // Ensure timestamps are enabled
  underscored: true   // Use snake_case for columns to match other models
});

// This will be called after all models are loaded
User.associate = (models) => {
  User.hasMany(models.Revenue, {
    foreignKey: 'userId',
    as: 'revenues'
  });
};

export default User;