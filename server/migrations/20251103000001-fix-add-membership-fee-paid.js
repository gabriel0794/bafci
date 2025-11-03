/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('members');
    
    // Add membership_fee_paid column if it doesn't exist
    if (!tableDescription.membership_fee_paid) {
      await queryInterface.addColumn('members', 'membership_fee_paid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'membership_fee_paid'
      });
      
      // Add index for the field
      await queryInterface.addIndex('members', ['membership_fee_paid'], {
        name: 'members_membership_fee_paid'
      });
    }

    // Add membership_fee_paid_date if it doesn't exist
    if (!tableDescription.membership_fee_paid_date) {
      await queryInterface.addColumn('members', 'membership_fee_paid_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'membership_fee_paid_date'
      });
    }

    // Add last_contribution_date if it doesn't exist
    if (!tableDescription.last_contribution_date) {
      await queryInterface.addColumn('members', 'last_contribution_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'last_contribution_date',
        comment: 'Date of the last monthly contribution payment'
      });
      
      await queryInterface.addIndex('members', ['last_contribution_date'], {
        name: 'members_last_contribution_date'
      });
    }

    // Add next_due_date if it doesn't exist
    if (!tableDescription.next_due_date) {
      await queryInterface.addColumn('members', 'next_due_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'next_due_date',
        comment: 'Next due date for contribution payment'
      });
      
      await queryInterface.addIndex('members', ['next_due_date'], {
        name: 'members_next_due_date'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('members', 'members_membership_fee_paid');
    await queryInterface.removeColumn('members', 'membership_fee_paid');
    await queryInterface.removeColumn('members', 'membership_fee_paid_date');
    await queryInterface.removeIndex('members', 'members_last_contribution_date');
    await queryInterface.removeColumn('members', 'last_contribution_date');
    await queryInterface.removeIndex('members', 'members_next_due_date');
    await queryInterface.removeColumn('members', 'next_due_date');
  }
};
