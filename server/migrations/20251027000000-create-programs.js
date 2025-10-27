export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('programs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    branch_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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

  // Add index for faster lookups
  await queryInterface.addIndex('programs', ['branch_id']);
  await queryInterface.addIndex('programs', ['name', 'branch_id'], {
    unique: true,
    name: 'unique_program_per_branch'
  });
};

export const down = async (queryInterface, Sequelize) => {
  try {
    await queryInterface.dropTable('programs');
  } catch (error) {
    console.log('Ignoring error while dropping programs table:', error.message);
  }
};
