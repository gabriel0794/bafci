export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('members', 'status', {
    type: Sequelize.ENUM('Alive', 'Deceased', 'Void', 'Kicked'),
    allowNull: false,
    defaultValue: 'Alive'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('members', 'status');
  // Also need to drop the ENUM type
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_members_status";');
}
