import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Branches', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Seed initial branches
  await queryInterface.bulkInsert('Branches', [
    {
      name: 'Ozamiz',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Opol',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Cagayan de Oro City',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Gingoog',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Branches');
}
