import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import Branch from './branch.model.js';
import Revenue from './revenue.model.js';
import Member from './member.js';
import FieldWorker from './fieldWorker.js';
import Payment from './payment.js';

// Initialize models
const models = {
  User,
  Branch,
  Revenue,
  Member,
  FieldWorker,
  Payment,
  sequelize
};

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models;
