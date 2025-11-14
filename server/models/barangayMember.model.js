import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class BarangayMember extends Model {}

BarangayMember.init({
  regionCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'region_code'
  },
  regionName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'region_name'
  },
  provinceCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'province_code'
  },
  provinceName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'province_name'
  },
  cityCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'city_code'
  },
  cityName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'city_name'
  },
  barangayCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'barangay_code'
  },
  barangayName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'barangay_name'
  },
  memberCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'member_count'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  sequelize,
  modelName: 'BarangayMember',
  tableName: 'barangay_members',
  timestamps: true,
  underscored: true
});

export default BarangayMember;
