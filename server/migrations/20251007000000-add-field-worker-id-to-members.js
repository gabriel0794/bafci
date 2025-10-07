import { DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  // First add the column without the foreign key constraint
  await queryInterface.addColumn('Members', 'field_worker_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'field_worker_id'
  });

  // Then add the foreign key constraint
  await queryInterface.addConstraint('Members', {
    fields: ['field_worker_id'],
    type: 'foreign key',
    name: 'members_field_worker_id_fkey',
    references: {
      table: 'field_workers',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  // Add index for better query performance
  await queryInterface.addIndex('Members', ['field_worker_id'], {
    name: 'members_field_worker_id_idx',
    fields: ['field_worker_id']
  });
};

export const down = async (queryInterface, Sequelize) => {
  // First remove the foreign key constraint
  await queryInterface.removeConstraint('Members', 'members_field_worker_id_fkey');
  
  // Then remove the index
  await queryInterface.removeIndex('Members', 'members_field_worker_id_idx');
  
  // Finally, remove the column
  await queryInterface.removeColumn('Members', 'field_worker_id');
};

export default { up, down };
