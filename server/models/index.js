import sequelize from '../config/db.js';
import User from '../authentication/user.js';
import Branch from './branch.model.js';
import Revenue from './revenue.model.js';

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

export { sequelize, User, Branch, Revenue };
export default { sequelize, User, Branch, Revenue };
