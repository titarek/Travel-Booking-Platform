import mongoose from 'mongoose';
import { env } from './env.js';
import { seedDatabase } from '../seed/seeder.js';

export const connectDB = async () => {
  // Reuse existing database connection in serverless warm invocations
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`\n✓ MongoDB Connected: ${conn.connection.host}`);
    await seedDatabase();
  } catch (error) {
    console.log('\n============================================================');
    console.log('[Notice] MongoDB online connection status: Offline / Standby');
    console.log('App running seamlessly with pre-seeded in-memory catalog.');
    console.log(`Reason: ${error.message}`);
    console.log('To use live MongoDB Atlas online, check your MONGODB_URI in backend/.env.');
    console.log('============================================================\n');
  }
};
