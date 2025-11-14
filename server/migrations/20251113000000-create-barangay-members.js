import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('barangay_members', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    region_code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'PSGC region code'
    },
    region_name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Region name for display'
    },
    province_code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'PSGC province code'
    },
    province_name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Province name for display'
    },
    city_code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'PSGC city/municipality code'
    },
    city_name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'City/Municipality name for display'
    },
    barangay_code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'PSGC barangay code'
    },
    barangay_name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Barangay name for display'
    },
    member_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of members in this barangay'
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this barangay entry is active'
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add index for faster lookups
  await queryInterface.addIndex('barangay_members', ['barangay_code'], {
    name: 'idx_barangay_members_barangay_code'
  });

  // Add composite index for region/province/city/barangay combination
  await queryInterface.addIndex('barangay_members', 
    ['region_code', 'province_code', 'city_code', 'barangay_code'], 
    {
      name: 'idx_barangay_members_location',
      unique: true // Prevent duplicate entries for the same barangay
    }
  );
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('barangay_members');
};
