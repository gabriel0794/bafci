'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists first
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('notifications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'general'
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        read: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        member_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'members',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Add indexes (ignore if they already exist)
    try {
      await queryInterface.addIndex('notifications', ['read'], { name: 'notifications_read_idx' });
    } catch (e) { /* Index may already exist */ }
    
    try {
      await queryInterface.addIndex('notifications', ['type'], { name: 'notifications_type_idx' });
    } catch (e) { /* Index may already exist */ }
    
    try {
      await queryInterface.addIndex('notifications', ['created_at'], { name: 'notifications_created_at_idx' });
    } catch (e) { /* Index may already exist */ }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
