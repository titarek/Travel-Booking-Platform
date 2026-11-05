import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`✓ Travel API server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
    console.log(`✓ Allowed CORS origin: ${env.CLIENT_ORIGIN}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Error] Port ${env.PORT} is already in use by another running process.`);
      console.error(`Stop the process running on port ${env.PORT} or change PORT in backend/.env.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();
