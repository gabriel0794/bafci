/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('members');
    
    // Add membership_fee_amount column if it doesn't exist
    if (!tableDescription.membership_fee_amount) {
      await queryInterface.addColumn('members', 'membership_fee_amount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 600,
        field: 'membership_fee_amount',
        comment: 'Membership fee amount in currency units'
      });
    }

    // Update the default value of membership_fee_paid to true for new records
    // Note: This changes the column default, but doesn't affect existing records
    if (tableDescription.membership_fee_paid) {
      await queryInterface.changeColumn('members', 'membership_fee_paid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'membership_fee_paid'
      });
    }

    // Optional: Update existing records to set membership_fee_paid to true
    // Uncomment the following line if you want to update all existing members
    // await queryInterface.sequelize.query(
    //   "UPDATE members SET membership_fee_paid = true WHERE membership_fee_paid = false"
    // );
  },

  async down(queryInterface, Sequelize) {
    // Remove the membership_fee_amount column
    await queryInterface.removeColumn('members', 'membership_fee_amount');
    
    // Revert membership_fee_paid default back to false
    await queryInterface.changeColumn('members', 'membership_fee_paid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'membership_fee_paid'
    });
  }
};
