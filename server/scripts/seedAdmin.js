import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import sequelize from '../config/db.js';
import '../models/index.js';
import User from '../authentication/user.js';

dotenv.config();

/**
 * Seed script to create an initial admin user in the database
 * This can be run on both local and production databases
 * 
 * Usage:
 * node scripts/seedAdmin.js
 */

const seedAdminUser = async () => {
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
      console.log('   Username: admin');
      console.log('   Role:', existingAdmin.role);
      process.exit(0);
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
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin12345');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAdminUser();
