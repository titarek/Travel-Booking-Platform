import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const startServer = async () => {
  const serverStartTime = Date.now();
  const startIso = new Date().toISOString();

  console.log('\n============================================================');
  console.log(`[Startup] Server starting at ${startIso}`);
  console.log(`[Startup] Environment: ${env.NODE_ENV} | Target Port: ${env.PORT}`);
  console.log('============================================================');

  // Connect to PostgreSQL database
  const dbStartTime = Date.now();
  await connectDB();
  const dbDurationMs = Date.now() - dbStartTime;
  console.log(`[Startup] Database connected in ${dbDurationMs}ms at ${new Date().toISOString()}`);

  const server = app.listen(env.PORT, () => {
    const totalWakeupMs = Date.now() - serverStartTime;
    console.log('============================================================');
    console.log(`✓ [Startup] Server ready in ${totalWakeupMs}ms at ${new Date().toISOString()}`);
    console.log(`✓ [Health] Keep-alive endpoint: http://localhost:${env.PORT}/health`);
    console.log(`✓ [CORS] Whitelisted origins: ${env.CLIENT_ORIGIN}, ${env.ADMIN_ORIGIN}, *.vercel.app`);
    console.log('============================================================\n');
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
