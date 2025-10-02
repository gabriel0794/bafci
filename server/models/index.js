import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import Branch from './branch.model.js';
import Revenue from './revenue.model.js';
import { initMember, Member } from './member.js';

// Initialize the Member model
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

User.hasMany(Revenue, {
  foreignKey: 'userId',
  as: 'revenues'
});

// Member associations can be added here if needed

// Export all models
export { sequelize, User, Branch, Revenue, Member };
export default { sequelize, User, Branch, Revenue, Member };
