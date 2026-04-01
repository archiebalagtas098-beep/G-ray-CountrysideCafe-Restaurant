import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { connectDB } from './config/database.js';

dotenv.config();

async function seedAdmin() {
    try {
        console.log('🌱 Starting Admin User Seed...');
        
        // Connect to database
        await connectDB();
        console.log('✅ Connected to MongoDB');
        
        // Admin user data
        const adminData = {
            username: 'admin',
            password: 'Admin12345',
            role: 'admin',
            isActive: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: adminData.username });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Role: ${existingAdmin.role}`);
            console.log(`   Status: ${existingAdmin.isActive ? 'Active' : 'Inactive'}`);
            console.log('⏭️  Skipped creating admin user');
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);
            
            // Create admin user
            const admin = new User({
                username: adminData.username,
                password: hashedPassword,
                role: adminData.role,
                isActive: adminData.isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await admin.save();
            console.log('✅ Admin user created successfully!');
            console.log(`   Username: ${admin.username}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message);
        if (error.code === 11000) {
            console.error('⚠️  Duplicate key error - admin user already exists');
        }
        process.exit(1);
    }
}

// Run the seed function
seedAdmin();