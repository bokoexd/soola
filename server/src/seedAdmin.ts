import mongoose from 'mongoose';
import User from './models/User';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const adminUser = new User({
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      });
      await adminUser.save();
      console.log('Admin user created: admin@example.com with password adminpassword');
      console.log('IMPORTANT: Change this default password immediately in production!');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

export default seedAdmin;
