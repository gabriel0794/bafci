export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('members', 'period_start', {
    type: Sequelize.DATEONLY,
    comment: 'Start date of the current payment period'
  });

  await queryInterface.addColumn('members', 'next_payment', {
    type: Sequelize.DATEONLY,
    comment: 'Next payment due date'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('members', 'period_start');
  await queryInterface.removeColumn('members', 'next_payment');
};
