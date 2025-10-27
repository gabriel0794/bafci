export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('program_age_brackets', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    program_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'programs',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    age_range: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Age range in format "18 - 25" or "96 - 101 UP"'
    },
    min_age: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Minimum age for this bracket'
    },
    max_age: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum age for this bracket (null for open-ended like "101 UP")'
    },
    contribution_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Monthly contribution amount for this age bracket'
    },
    availment_period: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Availment period in format "3 mons & 1 day"'
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
  await queryInterface.addIndex('program_age_brackets', ['program_id']);
  await queryInterface.addIndex('program_age_brackets', ['min_age', 'max_age']);
};

export const down = async (queryInterface, Sequelize) => {
  try {
    await queryInterface.dropTable('program_age_brackets');
  } catch (error) {
    console.log('Ignoring error while dropping program_age_brackets table:', error.message);
  }
};
