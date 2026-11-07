import bcrypt from 'bcryptjs';
import { sampleFlights, sampleHotels, samplePackages } from '../seed/seedData.js';

// Pre-seeded hashed credentials
const customerPasswordHash = bcrypt.hashSync('Password123!', 12);
const adminPasswordHash = bcrypt.hashSync('Admin123!', 12);
const customerSecurityAnswerHash = bcrypt.hashSync("cox's bazar", 12);
const adminSecurityAnswerHash = bcrypt.hashSync('boss', 12);

export const memoryStore = {
  users: [
    {
      _id: '64a1b2c3d4e5f67890123450',
      id: 'usr-customer-01',
      name: 'Demo Customer',
      email: 'customer@travel.test',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+8801700000001',
      securityQuestion: 'What is your favorite travel destination?',
      securityAnswerHash: customerSecurityAnswerHash,
      createdAt: new Date(),
    },
    {
      _id: '64a1b2c3d4e5f67890123451',
      id: 'usr-admin-01',
      name: 'Super Admin',
      email: 'admin@travel.test',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '+8801700000002',
      securityQuestion: 'What was your childhood nickname?',
      securityAnswerHash: adminSecurityAnswerHash,
      createdAt: new Date(),
    },
    {
      _id: '64a1b2c3d4e5f67890123452',
      id: 'usr-customer-02',
      name: 'Demo Traveler',
      email: 'demo@travel.test',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+8801700000000',
      securityQuestion: 'What was the name of your first childhood pet?',
      securityAnswerHash: bcrypt.hashSync('tommy', 12),
      createdAt: new Date(),
    },
  ],
  flights: sampleFlights.map((f, i) => ({
    ...f,
    _id: `flt-${i + 1}`,
    id: `flt-${i + 1}`,
  })),
  hotels: sampleHotels.map((h, i) => ({
    ...h,
    _id: `htl-${i + 1}`,
    id: `htl-${i + 1}`,
  })),
  packages: samplePackages.map((p, i) => ({
    ...p,
    _id: `pkg-${i + 1}`,
    id: `pkg-${i + 1}`,
  })),
  bookings: [],
  auditLogs: [],
  settings: {
    banner: {
      active: true,
      text: 'Global Travel Sale: Enjoy up to 15% off with instant booking confirmation!',
      theme: 'indigo',
    },
    maintenanceMode: false,
    directConfirm: false,
    currencyRates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      BDT: 119.5,
      AED: 3.67,
      SAR: 3.75,
    },
  },
};
