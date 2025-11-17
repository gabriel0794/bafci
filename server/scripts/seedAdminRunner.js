import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';
import '../models/index.js';
import User from '../authentication/user.js';

/**
 * Seed admin user - can be called from API endpoint or script
 * Returns a result object instead of exiting the process
 */
export const seedAdminUser = async () => {
  try {
    console.log('🌱 Starting database seed...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Skipping creation.');
      return {
        success: true,
        message: 'Admin user already exists',
        username: 'admin',
        alreadyExists: true
      };
    }

    // Create admin user with custom credentials
    const hashedPassword = await bcrypt.hash('admin12345', 10);
    
    const adminUser = await User.create({
      name: 'Administrator',
      username: 'admin',
      email: 'admin@bafci.com',
      phone: '09123456789',
      address: 'BAFCI Main Office',
      password: hashedPassword,
      role: 3, // 3 = account manager (can only create staff accounts)
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: admin12345');

    return {
      success: true,
      message: 'Admin user created successfully',
      username: 'admin',
      role: adminUser.role,
      alreadyExists: false
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return {
      success: false,
      message: 'Error seeding database',
      error: error.message
    };
  }
};
