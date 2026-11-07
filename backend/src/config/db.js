import pg from 'pg';
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { sampleFlights, sampleHotels, samplePackages } from '../seed/seedData.js';

const { Pool } = pg;

let pool = null;
let isConnected = false;

// Determine SSL requirement for PostgreSQL
const isLocalDb = !env.DATABASE_URL
  || env.DATABASE_URL.includes('localhost')
  || env.DATABASE_URL.includes('127.0.0.1');

const poolConfig = env.DATABASE_URL
  ? {
    connectionString: env.DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }
  : {
    host: env.PGHOST || '127.0.0.1',
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD || 'postgres',
    database: env.PGDATABASE || 'travel_db',
    port: Number(env.PGPORT) || 5432,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

/**
 * Execute a parameterized PostgreSQL query
 * @param {string} text - SQL statement
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params = []) => {
  if (!pool || !isConnected) {
    throw new Error('PostgreSQL pool is not connected.');
  }
  return pool.query(text, params);
};

export const isDbConnected = () => isConnected;

export const getPool = () => pool;

/**
 * Run PostgreSQL DDL Schema Migrations
 */
export const runMigrations = async () => {
  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
      phone VARCHAR(50) DEFAULT '',
      security_question VARCHAR(255) DEFAULT '',
      security_answer_hash VARCHAR(255) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS flights (
      id VARCHAR(64) PRIMARY KEY,
      flight_number VARCHAR(50) NOT NULL,
      airline VARCHAR(100) NOT NULL,
      origin JSONB NOT NULL,
      destination JSONB NOT NULL,
      departure_time TIMESTAMPTZ NOT NULL,
      arrival_time TIMESTAMPTZ NOT NULL,
      duration VARCHAR(50),
      price NUMERIC(10,2) NOT NULL,
      available_seats INT NOT NULL DEFAULT 100,
      aircraft VARCHAR(100),
      class_type VARCHAR(50) DEFAULT 'Economy',
      stops INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      address VARCHAR(255),
      rating NUMERIC(3,1) DEFAULT 4.5,
      price_per_night NUMERIC(10,2) NOT NULL,
      images JSONB DEFAULT '[]'::jsonb,
      amenities JSONB DEFAULT '[]'::jsonb,
      description TEXT,
      rooms_available INT DEFAULT 20,
      coordinates JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS packages (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      destination VARCHAR(100) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      discount_percent INT DEFAULT 0,
      image_url VARCHAR(500),
      highlights JSONB DEFAULT '[]'::jsonb,
      inclusions JSONB DEFAULT '[]'::jsonb,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(64) PRIMARY KEY,
      booking_reference VARCHAR(64) UNIQUE NOT NULL,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      booking_type VARCHAR(50) NOT NULL,
      item_details JSONB NOT NULL,
      travelers JSONB DEFAULT '[]'::jsonb,
      contact_info JSONB NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      payment JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      performed_by VARCHAR(64),
      details JSONB DEFAULT '{}'::jsonb,
      ip_address VARCHAR(50),
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  await pool.query(ddl);
  console.log('✓ PostgreSQL Schema Migrations verified successfully.');
};

/**
 * Seed initial administrative & catalog data in PostgreSQL
 */
export const seedPostgres = async () => {
  try {
    // 1. Seed Customer & Admin Users
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@travel.test']);
    if (adminCheck.rows.length === 0) {
      const adminPass = await bcrypt.hash('Admin123!', 12);
      const adminAns = await bcrypt.hash('boss', 12);
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, security_question, security_answer_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'usr-admin-01',
          'Super Admin',
          'admin@travel.test',
          adminPass,
          'ADMIN',
          '+8801700000002',
          'What was your childhood nickname?',
          adminAns,
        ],
      );
      console.log('✓ Seeded PostgreSQL user: admin@travel.test (ADMIN)');
    }

    const customerCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['customer@travel.test']);
    if (customerCheck.rows.length === 0) {
      const custPass = await bcrypt.hash('Password123!', 12);
      const custAns = await bcrypt.hash("cox's bazar", 12);
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, security_question, security_answer_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'usr-customer-01',
          'Demo Customer',
          'customer@travel.test',
          custPass,
          'CUSTOMER',
          '+8801700000001',
          'What is your favorite travel destination?',
          custAns,
        ],
      );
      console.log('✓ Seeded PostgreSQL user: customer@travel.test (CUSTOMER)');
    }

    // 2. Seed Flights if empty
    const flightsCount = await pool.query('SELECT COUNT(*) FROM flights');
    if (parseInt(flightsCount.rows[0].count, 10) === 0) {
      await Promise.all(
        sampleFlights.map((f, i) => {
          const id = `flt-${i + 1}`;
          return pool.query(
            `INSERT INTO flights (id, flight_number, airline, origin, destination, departure_time, arrival_time, duration, price, available_seats, aircraft, class_type, stops)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              id,
              f.flightNumber,
              f.airline,
              JSON.stringify(f.origin),
              JSON.stringify(f.destination),
              f.departureTime,
              f.arrivalTime,
              f.duration,
              f.price,
              f.availableSeats || 100,
              f.aircraft || 'Boeing 737-800',
              f.classType || 'Economy',
              f.stops || 0,
            ],
          );
        }),
      );
      console.log(`✓ Seeded ${sampleFlights.length} flights into PostgreSQL.`);
    }

    // 3. Seed Hotels if empty
    const hotelsCount = await pool.query('SELECT COUNT(*) FROM hotels');
    if (parseInt(hotelsCount.rows[0].count, 10) === 0) {
      await Promise.all(
        sampleHotels.map((h, i) => {
          const id = `htl-${i + 1}`;
          return pool.query(
            `INSERT INTO hotels (id, name, city, country, address, rating, price_per_night, images, amenities, description, rooms_available, coordinates)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              id,
              h.name,
              h.city,
              h.country,
              h.address,
              h.rating,
              h.pricePerNight,
              JSON.stringify(h.images || []),
              JSON.stringify(h.amenities || []),
              h.description,
              h.roomsAvailable || 20,
              JSON.stringify(h.coordinates || {}),
            ],
          );
        }),
      );
      console.log(`✓ Seeded ${sampleHotels.length} hotels into PostgreSQL.`);
    }

    // 4. Seed Packages if empty
    const packagesCount = await pool.query('SELECT COUNT(*) FROM packages');
    if (parseInt(packagesCount.rows[0].count, 10) === 0) {
      await Promise.all(
        samplePackages.map((p, i) => {
          const id = `pkg-${i + 1}`;
          return pool.query(
            `INSERT INTO packages (id, title, destination, duration, price, discount_percent, image_url, highlights, inclusions, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              id,
              p.title,
              p.destination,
              p.duration,
              p.price,
              p.discountPercent || 0,
              p.imageUrl,
              JSON.stringify(p.highlights || []),
              JSON.stringify(p.inclusions || []),
              Boolean(p.isFeatured),
            ],
          );
        }),
      );
      console.log(`✓ Seeded ${samplePackages.length} packages into PostgreSQL.`);
    }

    // 5. Seed default system settings
    const defaultSettings = [
      {
        key: 'banner',
        value: {
          active: true,
          text: 'Global Travel Sale: Enjoy up to 15% off with instant booking confirmation!',
          theme: 'indigo',
        },
      },
      { key: 'maintenanceMode', value: false },
      { key: 'directConfirm', value: false },
    ];

    await Promise.all(
      defaultSettings.map((setting) => pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, JSON.stringify(setting.value)],
      )),
    );
  } catch (err) {
    console.warn(`[Warning] Could not complete PostgreSQL initial seeding: ${err.message}`);
  }
};

/**
 * Initialize PostgreSQL connection, migrations, and seeding
 */
export const connectDB = async () => {
  if (isConnected) return;

  if (!env.DATABASE_URL && !process.env.PGHOST) {
    console.log('\n============================================================');
    console.log('[Notice] DATABASE_URL not set in environment.');
    console.log('App running seamlessly in resilient in-memory mode.');
    console.log('Set DATABASE_URL to your Render PostgreSQL connection string to persist data.');
    console.log('============================================================\n');
    return;
  }

  try {
    pool = new Pool(poolConfig);
    const testRes = await pool.query('SELECT NOW() as now');
    isConnected = true;
    console.log(`\n✓ PostgreSQL Connected successfully at: ${testRes.rows[0].now}`);
    await runMigrations();
    await seedPostgres();
  } catch (error) {
    isConnected = false;
    console.log('\n============================================================');
    console.log('[Notice] PostgreSQL connection attempt was unsuccessful:');
    console.log(`Reason: ${error.message}`);
    console.log('App operating seamlessly in local standby memoryStore mode.');
    console.log('============================================================\n');
  }
};
