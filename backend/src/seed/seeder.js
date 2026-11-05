import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Flight } from '../models/flight.model.js';
import { Hotel } from '../models/hotel.model.js';
import { Package } from '../models/package.model.js';
import { sampleFlights, sampleHotels, samplePackages } from './seedData.js';

export const seedDatabase = async () => {
  try {
    console.log('Seeding travel database...');

    // 1. Seed demo customer and demo admin users if not exists
    const usersToSeed = [
      {
        name: 'Demo Customer',
        email: 'customer@travel.test',
        password: 'Password123!',
        phone: '+8801700000001',
        role: 'user',
        securityQuestion: 'What is your favorite travel destination?',
        securityAnswer: "cox's bazar",
      },
      {
        name: 'Super Admin',
        email: 'admin@travel.test',
        password: 'Admin123!',
        phone: '+8801700000002',
        role: 'admin',
        securityQuestion: 'What was your childhood nickname?',
        securityAnswer: 'boss',
      },
      {
        name: 'Demo Traveler',
        email: 'demo@travel.test',
        password: 'Password123!',
        phone: '+8801700000000',
        role: 'user',
        securityQuestion: 'What was the name of your first childhood pet?',
        securityAnswer: 'tommy',
      },
    ];

    await Promise.all(
      usersToSeed.map(async (u) => {
        const passwordHash = await bcrypt.hash(u.password, 12);
        const securityAnswerHash = await bcrypt.hash(u.securityAnswer.toLowerCase().trim(), 12);
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
          await User.create({
            name: u.name,
            email: u.email,
            passwordHash,
            phone: u.phone,
            role: u.role,
            securityQuestion: u.securityQuestion,
            securityAnswerHash,
          });
          console.log(`Seeded user: ${u.email} (${u.role})`);
        } else {
          existing.passwordHash = passwordHash;
          existing.securityQuestion = u.securityQuestion;
          existing.securityAnswerHash = securityAnswerHash;
          if (u.role === 'admin') existing.role = 'admin';
          await existing.save();
          console.log(`Synchronized demo user: ${u.email} (${u.role})`);
        }
      }),
    );

    // 2. Seed flights if empty
    const flightCount = await Flight.countDocuments();
    if (flightCount === 0) {
      await Flight.insertMany(sampleFlights);
      console.log(`Seeded ${sampleFlights.length} flights.`);
    }

    // 3. Seed hotels if empty
    const hotelCount = await Hotel.countDocuments();
    if (hotelCount === 0) {
      await Hotel.insertMany(sampleHotels);
      console.log(`Seeded ${sampleHotels.length} hotels.`);
    }

    // 4. Seed packages if empty
    const packageCount = await Package.countDocuments();
    if (packageCount === 0) {
      await Package.insertMany(samplePackages);
      console.log(`Seeded ${samplePackages.length} packages.`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// If run directly from CLI: node src/seed/seeder.js
if (process.argv[1]?.endsWith('seeder.js')) {
  mongoose.connect(env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB for direct seeding...');
      await seedDatabase();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB for seeding:', err.message);
      process.exit(1);
    });
}
