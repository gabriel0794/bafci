import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationHelper.js';

const router = express.Router();
const { BarangayMember, sequelize } = models;

const queryFieldMap = {
  region_code: 'regionCode',
  province_code: 'provinceCode',
  city_code: 'cityCode',
  barangay_code: 'barangayCode',
  is_active: 'isActive'
};

router.get('/', auth, async (req, res) => {
  try {
    const where = {};

    Object.entries(queryFieldMap).forEach(([queryKey, modelKey]) => {
      if (req.query[queryKey] !== undefined && req.query[queryKey] !== '') {
        where[modelKey] = req.query[queryKey];
      }
    });

    const barangayMembers = await BarangayMember.findAll({
      where,
      order: [
        ['memberCount', 'DESC'],
        ['barangayName', 'ASC']
      ]
    });

    const serialized = barangayMembers.map(entry => entry.toJSON());
    res.json(serialized);
  } catch (error) {
    console.error('Error fetching barangay members:', error);
    res.status(500).json({
      message: 'Failed to fetch barangay members',
      error: error.message
    });
  }
});

router.post('/adjust', auth, async (req, res) => {
  const {
    regionCode,
    regionName,
    provinceCode,
    provinceName,
    cityCode,
    cityName,
    barangayCode,
    barangayName,
    delta
  } = req.body;

  try {
    const requiredStringFields = [
      ['regionCode', regionCode],
      ['regionName', regionName],
      ['provinceCode', provinceCode],
      ['provinceName', provinceName],
      ['cityCode', cityCode],
      ['cityName', cityName],
      ['barangayCode', barangayCode],
      ['barangayName', barangayName]
    ];

    for (const [field, value] of requiredStringFields) {
      if (!value || typeof value !== 'string') {
        return res.status(400).json({
          message: `${field} is required`
        });
      }
    }

    const parsedDelta = parseInt(delta, 10);
    if (Number.isNaN(parsedDelta) || parsedDelta === 0) {
      return res.status(400).json({
        message: 'delta must be a non-zero integer'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const where = { regionCode, provinceCode, cityCode, barangayCode };
      let barangayMember = await BarangayMember.findOne({
        where,
        transaction
      });

      if (!barangayMember) {
        if (parsedDelta < 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Cannot reduce members for a barangay that has no existing record'
          });
        }

        barangayMember = await BarangayMember.create({
          regionCode,
          regionName,
          provinceCode,
          provinceName,
          cityCode,
          cityName,
          barangayCode,
          barangayName,
          memberCount: parsedDelta,
          isActive: true
        }, { transaction });
      } else {
        const newCount = barangayMember.memberCount + parsedDelta;

        if (newCount < 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Member count cannot be negative'
          });
        }

        await barangayMember.update({
          regionName,
          provinceName,
          cityName,
          barangayName,
          memberCount: newCount
        }, { transaction });
      }

      await transaction.commit();

      // Create notification for barangay member count change
      if (parsedDelta > 0) {
        await createNotification({
          type: NOTIFICATION_TYPES.BARANGAY_MEMBER_ADDED,
          message: `${parsedDelta} member(s) added to barangay list: ${barangayName}, ${cityName}`,
          metadata: { 
            barangayId: barangayMember.id,
            barangayName,
            cityName,
            provinceName,
            delta: parsedDelta,
            newTotal: barangayMember.memberCount
          }
        });
      }

      res.json(barangayMember.toJSON());
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error('Error adjusting barangay member count:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Barangay entry already exists with the provided identifiers'
      });
    }

    res.status(500).json({
      message: 'Failed to adjust barangay member count',
      error: error.message
    });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      message: 'isActive must be a boolean value'
    });
  }

  try {
    const barangayMember = await BarangayMember.findByPk(id);

    if (!barangayMember) {
      return res.status(404).json({
        message: 'Barangay member record not found'
      });
    }

    await barangayMember.update({ isActive });
    res.json(barangayMember.toJSON());
  } catch (error) {
    console.error('Error updating barangay member status:', error);
    res.status(500).json({
      message: 'Failed to update barangay member status',
      error: error.message
    });
  }
});

export default router;
