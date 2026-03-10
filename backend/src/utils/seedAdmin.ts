import User from '../models/User';

export const seedAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Seed superadmin user if env vars are set
    if (process.env.SUPERADMIN_EMAIL) {
      const superAdminExists = await User.findOne({
        email: process.env.SUPERADMIN_EMAIL,
      });

      if (!superAdminExists) {
        await User.create({
          name: process.env.SUPERADMIN_NAME || 'Super Admin',
          email: process.env.SUPERADMIN_EMAIL,
          password: process.env.SUPERADMIN_PASSWORD,
          role: 'superadmin',
        });
        console.log('✅ Super admin user created successfully');
      } else {
        console.log('ℹ️  Super admin user already exists');
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
  }
};
