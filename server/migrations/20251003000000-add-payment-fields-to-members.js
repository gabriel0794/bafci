/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Check if the column exists before adding it
    const tableDescription = await queryInterface.describeTable('members');
    
    if (!tableDescription.membership_fee_paid) {
      await queryInterface.addColumn('members', 'membership_fee_paid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'membership_fee_paid'
      });
    }

    if (!tableDescription.membership_fee_paid_date) {
      await queryInterface.addColumn('members', 'membership_fee_paid_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'membership_fee_paid_date'
      });
    }

    if (!tableDescription.last_contribution_date) {
      await queryInterface.addColumn('members', 'last_contribution_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'last_contribution_date',
        comment: 'Date of the last monthly contribution payment'
      });
    }

    if (!tableDescription.next_due_date) {
      await queryInterface.addColumn('members', 'next_due_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'next_due_date',
        comment: 'Next due date for contribution payment'
      });
    }

    // Add indexes for the new fields if they don't exist
    const indexes = await queryInterface.showIndex('members');
    const indexNames = indexes.map(idx => idx.name);
    
    if (!indexNames.includes('members_membership_fee_paid')) {
      await queryInterface.addIndex('members', ['membership_fee_paid'], {
        name: 'members_membership_fee_paid'
      });
    }
    
    if (!indexNames.includes('members_last_contribution_date')) {
      await queryInterface.addIndex('members', ['last_contribution_date'], {
        name: 'members_last_contribution_date'
      });
    }
    
    if (!indexNames.includes('members_next_due_date')) {
      await queryInterface.addIndex('members', ['next_due_date'], {
        name: 'members_next_due_date'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('members', 'membership_fee_paid');
    await queryInterface.removeColumn('members', 'membership_fee_paid_date');
    await queryInterface.removeColumn('members', 'last_contribution_date');
    await queryInterface.removeColumn('members', 'next_due_date');
  }
};
