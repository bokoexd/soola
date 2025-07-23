import mongoose from 'mongoose';
import User from './models/User';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    console.log('Running admin user seeding...');
    
    // Default admin credentials - in production these should be set via environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    
    console.log(`Checking if admin user exists: ${adminEmail}`);
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      await adminUser.save();
      console.log(`Admin user created: ${adminEmail}`);
      console.log('IMPORTANT: Change this default password immediately in production!');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Export a function that ensures admin exists
export const ensureAdminExists = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin users found. Creating default admin...');
      return seedAdmin();
    } else {
      console.log(`Found ${adminCount} existing admin users.`);
    }
  } catch (error) {
    console.error('Error checking admin existence:', error);
  }
};

export default seedAdmin;
