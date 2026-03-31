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

    // Seed technician accounts
    const technicians = [
      {
        email: process.env.TECH1_EMAIL || 'technician1@accuro.com.ph',
        password: process.env.TECH1_PASSWORD || 'TechPassword123!',
        name: process.env.TECH1_NAME || 'Technician 1',
        technicianNumber: 1,
      },
      {
        email: process.env.TECH2_EMAIL || 'technician2@accuro.com.ph',
        password: process.env.TECH2_PASSWORD || 'TechPassword123!',
        name: process.env.TECH2_NAME || 'Technician 2',
        technicianNumber: 2,
      },
      {
        email: process.env.TECH3_EMAIL || 'technician3@accuro.com.ph',
        password: process.env.TECH3_PASSWORD || 'TechPassword123!',
        name: process.env.TECH3_NAME || 'Technician 3',
        technicianNumber: 3,
      },
    ];

    for (const tech of technicians) {
      const exists = await User.findOne({ email: tech.email });
      if (!exists) {
        await User.create({
          name: tech.name,
          email: tech.email,
          password: tech.password,
          role: 'technician',
          technicianNumber: tech.technicianNumber,
        });
        console.log(`✅ ${tech.name} account created (${tech.email})`);
      } else {
        // Ensure existing technician has a technicianNumber assigned
        if (!exists.technicianNumber) {
          exists.technicianNumber = tech.technicianNumber;
          await exists.save();
          console.log(`ℹ️  Assigned technicianNumber ${tech.technicianNumber} to ${tech.email}`);
        } else {
          console.log(`ℹ️  ${tech.name} already exists (${tech.email})`);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating seed users:', error.message);
  }
};
