import express from 'express';
import models from '../models/index.js';

const router = express.Router();
const { Program, ProgramAgeBracket, Branch } = models;

// Get all programs
router.get('/', async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        },
        {
          model: ProgramAgeBracket,
          as: 'ageBrackets',
          attributes: ['id', 'ageRange', 'minAge', 'maxAge', 'contributionAmount', 'availmentPeriod']
        }
      ],
      where: { isActive: true },
      order: [
        ['name', 'ASC'],
        [{ model: ProgramAgeBracket, as: 'ageBrackets' }, 'minAge', 'ASC']
      ]
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get programs by branch ID
router.get('/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;

    const programs = await Program.findAll({
      where: { 
        branchId: branchId,
        isActive: true 
      },
      include: [
        {
          model: ProgramAgeBracket,
          as: 'ageBrackets',
          attributes: ['id', 'ageRange', 'minAge', 'maxAge', 'contributionAmount', 'availmentPeriod'],
          order: [['minAge', 'ASC']]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs by branch:', error);
    res.status(500).json({ error: 'Failed to fetch programs for branch' });
  }
});

// Get programs by branch name
router.get('/branch/name/:branchName', async (req, res) => {
  try {
    const { branchName } = req.params;

    // First find the branch
    const branch = await Branch.findOne({
      where: { name: branchName }
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const programs = await Program.findAll({
      where: { 
        branchId: branch.id,
        isActive: true 
      },
      include: [
        {
          model: ProgramAgeBracket,
          as: 'ageBrackets',
          attributes: ['id', 'ageRange', 'minAge', 'maxAge', 'contributionAmount', 'availmentPeriod'],
          order: [['minAge', 'ASC']]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs by branch name:', error);
    res.status(500).json({ error: 'Failed to fetch programs for branch' });
  }
});

// Get age brackets for a specific program
router.get('/:programId/age-brackets', async (req, res) => {
  try {
    const { programId } = req.params;

    const ageBrackets = await ProgramAgeBracket.findAll({
      where: { programId: programId },
      order: [['minAge', 'ASC']]
    });

    res.json(ageBrackets);
  } catch (error) {
    console.error('Error fetching age brackets:', error);
    res.status(500).json({ error: 'Failed to fetch age brackets' });
  }
});

// Get contribution amount and availment period for a specific age
router.get('/:programId/age/:age', async (req, res) => {
  try {
    const { programId, age } = req.params;
    const ageNum = parseInt(age);

    const ageBracket = await ProgramAgeBracket.findOne({
      where: {
        programId: programId,
        minAge: { [models.sequelize.Sequelize.Op.lte]: ageNum },
        [models.sequelize.Sequelize.Op.or]: [
          { maxAge: { [models.sequelize.Sequelize.Op.gte]: ageNum } },
          { maxAge: null }
        ]
      }
    });

    if (!ageBracket) {
      return res.status(404).json({ error: 'No age bracket found for this age' });
    }

    res.json({
      ageRange: ageBracket.ageRange,
      contributionAmount: ageBracket.contributionAmount,
      availmentPeriod: ageBracket.availmentPeriod
    });
  } catch (error) {
    console.error('Error fetching age bracket for age:', error);
    res.status(500).json({ error: 'Failed to fetch age bracket information' });
  }
});

// Create a new program (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, branchId, ageBrackets } = req.body;

    // Create the program
    const program = await Program.create({
      name,
      branchId,
      isActive: true
    });

    // Create age brackets if provided
    if (ageBrackets && Array.isArray(ageBrackets)) {
      const bracketsToCreate = ageBrackets.map(bracket => ({
        programId: program.id,
        ageRange: bracket.ageRange,
        minAge: bracket.minAge,
        maxAge: bracket.maxAge,
        contributionAmount: bracket.contributionAmount,
        availmentPeriod: bracket.availmentPeriod
      }));

      await ProgramAgeBracket.bulkCreate(bracketsToCreate);
    }

    // Fetch the complete program with age brackets
    const completeProgram = await Program.findByPk(program.id, {
      include: [
        {
          model: ProgramAgeBracket,
          as: 'ageBrackets',
          order: [['minAge', 'ASC']]
        }
      ]
    });

    res.status(201).json(completeProgram);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update a program
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, branchId, isActive } = req.body;

    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    await program.update({ name, branchId, isActive });

    const updatedProgram = await Program.findByPk(id, {
      include: [
        {
          model: ProgramAgeBracket,
          as: 'ageBrackets',
          order: [['minAge', 'ASC']]
        }
      ]
    });

    res.json(updatedProgram);
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete a program (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    await program.update({ isActive: false });

    res.json({ message: 'Program deactivated successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

export default router;
