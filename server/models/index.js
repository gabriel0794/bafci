import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import { initBranch, Branch } from './branch.model.js';
import Revenue from './revenue.model.js';
import { initMember, Member } from './member.js';
import { initFieldWorker, FieldWorker } from './fieldWorker.js';

// Initialize all models
initBranch(sequelize);
initFieldWorker(sequelize);
initMember(sequelize);

// Define all associations here to avoid circular dependencies
Revenue.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Revenue.belongsTo(Branch, {
  foreignKey: 'branchId',
  as: 'branch'
});

Branch.hasMany(Revenue, {
  foreignKey: 'branchId',
  as: 'revenues'
});

Branch.hasMany(FieldWorker, {
  foreignKey: 'branchId',
  as: 'fieldWorkers'
});

User.hasMany(Revenue, {
  foreignKey: 'userId',
  as: 'revenues'
});

// FieldWorker associations
FieldWorker.belongsTo(Branch, {
  foreignKey: 'branchId',
  as: 'branch'
});

FieldWorker.hasMany(Member, {
  foreignKey: 'fieldWorkerId',
  as: 'members'
});

// Member associations
Member.belongsTo(FieldWorker, {
  foreignKey: 'fieldWorkerId',
  as: 'fieldWorker',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Export all models
export { 
  sequelize, 
  User, 
  Branch, 
  Revenue, 
  Member, 
  FieldWorker 
};

export default { 
  sequelize, 
  User, 
  Branch, 
  Revenue, 
  Member, 
  FieldWorker 
};
