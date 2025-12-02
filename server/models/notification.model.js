import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Type of notification: payment_due, new_member, payment_made, general'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'member_id',
    references: {
      model: 'members',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional data related to the notification'
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['read']
    },
    {
      fields: ['type']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Associations
Notification.associate = (models) => {
  Notification.belongsTo(models.Member, {
    foreignKey: 'memberId',
    as: 'member',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
};

export default Notification;
