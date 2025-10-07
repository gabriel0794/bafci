import { DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('field_workers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
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
        model: 'Branches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      field: 'branch_id'
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'member_count'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    // Table options
    timestamps: true,
    underscored: true
  });

  // Add index for better query performance
  await queryInterface.addIndex('field_workers', ['branch_id'], {
    name: 'field_workers_branch_id_idx'
  });
};

export const down = async (queryInterface, Sequelize) => {
  // Drop the index first
  await queryInterface.removeIndex('field_workers', 'field_workers_branch_id_idx');
  // Then drop the table
  await queryInterface.dropTable('field_workers');
};

export default { up, down };
