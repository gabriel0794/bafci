export const up = async (queryInterface, Sequelize) => {
  // Define program data in one place for clarity
  const jacinthAgeBrackets = [
    { range: '18 - 25', minAge: 18, maxAge: 25, amount: 55, availment: '3 mons & 1 day' },
    { range: '26 - 30', minAge: 26, maxAge: 30, amount: 75, availment: '4 mons & 1 day' },
    { range: '31 - 35', minAge: 31, maxAge: 35, amount: 97, availment: '5 mons & 1 day' },
    { range: '36 - 40', minAge: 36, maxAge: 40, amount: 115, availment: '6 mons & 1 day' },
    { range: '41 - 45', minAge: 41, maxAge: 45, amount: 120, availment: '7 mons & 1 day' },
    { range: '46 - 50', minAge: 46, maxAge: 50, amount: 135, availment: '8 mons & 1 day' },
    { range: '51 - 55', minAge: 51, maxAge: 55, amount: 145, availment: '9 mons & 1 day' },
    { range: '56 - 60', minAge: 56, maxAge: 60, amount: 160, availment: '10 mons & 1 day' },
    { range: '61 - 65', minAge: 61, maxAge: 65, amount: 185, availment: '12 mons & 1 day' },
    { range: '66 - 70', minAge: 66, maxAge: 70, amount: 195, availment: '14 mons & 1 day' },
    { range: '71 - 75', minAge: 71, maxAge: 75, amount: 210, availment: '16 mons & 1 day' },
    { range: '76 - 80', minAge: 76, maxAge: 80, amount: 235, availment: '18 mons & 1 day' },
    { range: '81 - 85', minAge: 81, maxAge: 85, amount: 260, availment: '24 mons & 1 day' },
    { range: '86 - 90', minAge: 86, maxAge: 90, amount: 285, availment: '24 mons & 1 day' },
    { range: '91 - 95', minAge: 91, maxAge: 95, amount: 350, availment: '24 mons & 1 day' },
    { range: '96 - 101 UP', minAge: 96, maxAge: null, amount: 395, availment: '24 mons & 1 day' }
  ];

  const chalcedonyAgeBrackets = [
    { range: '18 - 25', minAge: 18, maxAge: 25, amount: 80, availment: '3 mons & 1 day' },
    { range: '26 - 30', minAge: 26, maxAge: 30, amount: 105, availment: '4 mons & 1 day' },
    { range: '31 - 35', minAge: 31, maxAge: 35, amount: 130, availment: '5 mons & 1 day' },
    { range: '36 - 40', minAge: 36, maxAge: 40, amount: 145, availment: '6 mons & 1 day' },
    { range: '41 - 45', minAge: 41, maxAge: 45, amount: 150, availment: '7 mons & 1 day' },
    { range: '46 - 50', minAge: 46, maxAge: 50, amount: 165, availment: '8 mons & 1 day' },
    { range: '51 - 55', minAge: 51, maxAge: 55, amount: 180, availment: '9 mons & 1 day' },
    { range: '56 - 60', minAge: 56, maxAge: 60, amount: 195, availment: '10 mons & 1 day' },
    { range: '61 - 65', minAge: 61, maxAge: 65, amount: 225, availment: '12 mons & 1 day' },
    { range: '66 - 70', minAge: 66, maxAge: 70, amount: 240, availment: '14 mons & 1 day' },
    { range: '71 - 75', minAge: 71, maxAge: 75, amount: 265, availment: '16 mons & 1 day' },
    { range: '76 - 80', minAge: 76, maxAge: 80, amount: 290, availment: '18 mons & 1 day' },
    { range: '81 - 85', minAge: 81, maxAge: 85, amount: 325, availment: '24 mons & 1 day' },
    { range: '86 - 90', minAge: 86, maxAge: 90, amount: 360, availment: '24 mons & 1 day' },
    { range: '91 - 95', minAge: 91, maxAge: 95, amount: 415, availment: '24 mons & 1 day' },
    { range: '96 - 101 UP', minAge: 96, maxAge: null, amount: 450, availment: '24 mons & 1 day' }
  ];

  const blessAgeBrackets = [
    { range: '18 - 25', minAge: 18, maxAge: 25, amount: 60, availment: '3 mons & 1 day' },
    { range: '26 - 30', minAge: 26, maxAge: 30, amount: 85, availment: '4 mons & 1 day' },
    { range: '31 - 35', minAge: 31, maxAge: 35, amount: 110, availment: '5 mons & 1 day' },
    { range: '36 - 40', minAge: 36, maxAge: 40, amount: 125, availment: '6 mons & 1 day' },
    { range: '41 - 45', minAge: 41, maxAge: 45, amount: 135, availment: '7 mons & 1 day' },
    { range: '46 - 50', minAge: 46, maxAge: 50, amount: 150, availment: '8 mons & 1 day' },
    { range: '51 - 55', minAge: 51, maxAge: 55, amount: 165, availment: '9 mons & 1 day' },
    { range: '56 - 60', minAge: 56, maxAge: 60, amount: 180, availment: '10 mons & 1 day' },
    { range: '61 - 65', minAge: 61, maxAge: 65, amount: 205, availment: '12 mons & 1 day' },
    { range: '66 - 70', minAge: 66, maxAge: 70, amount: 220, availment: '14 mons & 1 day' },
    { range: '71 - 75', minAge: 71, maxAge: 75, amount: 240, availment: '16 mons & 1 day' },
    { range: '76 - 80', minAge: 76, maxAge: 80, amount: 265, availment: '18 mons & 1 day' },
    { range: '81 - 85', minAge: 81, maxAge: 85, amount: 295, availment: '24 mons & 1 day' },
    { range: '86 - 90', minAge: 86, maxAge: 90, amount: 325, availment: '24 mons & 1 day' },
    { range: '91 - 95', minAge: 91, maxAge: 95, amount: 385, availment: '24 mons & 1 day' },
    { range: '96 - 101 UP', minAge: 96, maxAge: null, amount: 425, availment: '24 mons & 1 day' }
  ];

  // Start a transaction
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Clear existing data within the transaction
    await queryInterface.bulkDelete('program_age_brackets', null, { transaction });
    await queryInterface.bulkDelete('programs', null, { transaction });

    // Get branch IDs
    const branches = await queryInterface.sequelize.query(
      `SELECT id, name FROM branches WHERE name IN ('Carmen (CDO)', 'Opol')`,
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );
    const carmenBranch = branches.find(b => b.name === 'Carmen (CDO)');
    const opolBranch = branches.find(b => b.name === 'Opol');

    if (!carmenBranch && !opolBranch) {
      console.log('Carmen (CDO) and OPOL branches not found. Skipping seeding.');
      await transaction.rollback();
      return;
    }

    // Create programs for each branch (one-to-many relationship)
    const programsToCreate = [];
    
    // Carmen (CDO) branch - Only BLESS program
    if (carmenBranch) {
      programsToCreate.push({ 
        name: 'BLESS', 
        branch_id: carmenBranch.id, 
        is_active: true, 
        created_at: new Date(), 
        updated_at: new Date() 
      });
    }
    
    // OPOL branch - Both JACINTH and CHALCEDONY programs
    if (opolBranch) {
      programsToCreate.push({ 
        name: 'JACINTH', 
        branch_id: opolBranch.id, 
        is_active: true, 
        created_at: new Date(), 
        updated_at: new Date() 
      });
      programsToCreate.push({ 
        name: 'CHALCEDONY', 
        branch_id: opolBranch.id, 
        is_active: true, 
        created_at: new Date(), 
        updated_at: new Date() 
      });
    }

    // Insert all programs
    await queryInterface.bulkInsert('programs', programsToCreate, { transaction });

    // Fetch the newly created programs to get their IDs
    const createdPrograms = await queryInterface.sequelize.query(
      'SELECT id, name, branch_id FROM programs',
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    // Create age brackets for each program
    const ageBracketsToCreate = [];
    createdPrograms.forEach(program => {
      let brackets_data;
      if (program.name === 'JACINTH') {
        brackets_data = jacinthAgeBrackets;
      } else if (program.name === 'CHALCEDONY') {
        brackets_data = chalcedonyAgeBrackets;
      } else if (program.name === 'BLESS') {
        brackets_data = blessAgeBrackets;
      }
      
      if (brackets_data) {
        brackets_data.forEach(bracket => {
          ageBracketsToCreate.push({
            program_id: program.id,
            age_range: bracket.range,
            min_age: bracket.minAge,
            max_age: bracket.maxAge,
            contribution_amount: bracket.amount,
            availment_period: bracket.availment,
            created_at: new Date(),
            updated_at: new Date()
          });
        });
      }
    });

    // Insert all age brackets
    if (ageBracketsToCreate.length > 0) {
      await queryInterface.bulkInsert('program_age_brackets', ageBracketsToCreate, { transaction });
    }

    // Commit the transaction
    await transaction.commit();
    console.log(`Successfully seeded ${createdPrograms.length} programs and ${ageBracketsToCreate.length} age brackets.`);

  } catch (error) {
    // Rollback transaction if any error occurs
    await transaction.rollback();
    console.error('Error during seeding transaction:', error);
    throw error;
  }

};

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // The order is important due to foreign key constraints
    await queryInterface.bulkDelete('program_age_brackets', null, { transaction });
    await queryInterface.bulkDelete('programs', null, { transaction });
    await transaction.commit();
    console.log('Successfully reverted seed data.');
  } catch (error) {
    await transaction.rollback();
    console.log(`Ignoring error during seed data rollback: ${error.message}`);
  }
};
