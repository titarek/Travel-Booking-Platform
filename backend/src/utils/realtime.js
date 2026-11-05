/**
 * Real-time event broadcasting system for administrative dashboard
 * Uses standard Server-Sent Events (SSE) with heartbeat keep-alive
 */
const adminClients = new Set();

/**
 * Register a new admin client SSE connection
 */
export const registerAdminClient = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
  });

  // Initial connection handshake
  res.write('retry: 3000\n');
  res.write(`data: ${JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  adminClients.add(res);

  // Send periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeatInterval);
      adminClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    adminClients.delete(res);
  });
};

/**
 * Broadcast an event payload to all connected admin clients
 */
export const notifyAdminClients = (event, payload) => {
  if (adminClients.size === 0) return;
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  adminClients.forEach((client) => {
    try {
      client.write(message);
    } catch {
      adminClients.delete(client);
    }
  });
};
