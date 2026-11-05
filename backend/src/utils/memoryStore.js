import bcrypt from 'bcryptjs';
import { sampleFlights, sampleHotels, samplePackages } from '../seed/seedData.js';

// Pre-seeded demo user
const demoPasswordHash = bcrypt.hashSync('Password123!', 12);

export const memoryStore = {
  users: [
    {
      _id: '64a1b2c3d4e5f67890123450',
      name: 'Demo Traveler',
      email: 'demo@travel.test',
      passwordHash: demoPasswordHash,
      role: 'user',
      phone: '+8801700000000',
      createdAt: new Date(),
    },
  ],
  flights: sampleFlights.map((f, i) => ({
    ...f,
    _id: `64a1b2c3d4e5f6789012340${i}`,
  })),
  hotels: sampleHotels.map((h, i) => ({
    ...h,
    _id: `64a1b2c3d4e5f6789012350${i}`,
  })),
  packages: samplePackages.map((p, i) => ({
    ...p,
    _id: `64a1b2c3d4e5f6789012360${i}`,
  })),
  bookings: [],
  auditLogs: [],
};
