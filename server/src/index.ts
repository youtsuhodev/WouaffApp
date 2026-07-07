import './services/logger.js';

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './config/migrate.js';
import pool from './config/database.js';
import { setupSocket } from './socket/index.js';
import { errorHandler, setupProcessHandlers } from './middleware/errorHandler.js';
import { requestTimeout } from './middleware/timeout.js';
import { rateLimit } from './middleware/rateLimit.js';
import { patchRouter } from './middleware/asyncHandler.js';
import { initColdStorage, archiveOldCalls, isColdStorageEnabled } from './services/coldStorage.js';
import { cleanExpiredEphemeralMessages } from './services/rtdb.js';
import authRouter from './routes/auth.js';
import messagesRouter from './routes/messages.js';
import conversationsRouter from './routes/conversations.js';
import profilesRouter from './routes/profiles.js';
import groupsRouter from './routes/groups.js';
import contactsRouter from './routes/contacts.js';
import storiesRouter from './routes/stories.js';
import notificationsRouter from './routes/notifications.js';
import searchRouter from './routes/search.js';
import adminRouter from './routes/admin.js';
import statusRouter from './routes/status.js';
import publicRouter from './routes/public.js';
import linkPreviewRouter from './routes/linkPreview.js';
import blocksRouter from './routes/blocks.js';
import callsRouter from './routes/calls.js';
import videosRouter from './routes/videos.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

/* Middleware */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

/* Rate limiting */
app.use('/api/auth/login', rateLimit({ windowMs: 60000, max: 20 }));
app.use('/api/auth/register', rateLimit({ windowMs: 60000, max: 10 }));
app.use('/api/auth/forgot-password', rateLimit({ windowMs: 60000, max: 5 }));
app.use('/api/contacts', rateLimit({ windowMs: 60000, max: 60 }));
app.use('/api/messages', rateLimit({ windowMs: 60000, max: 120 }));

/* Request timeout (30s for regular, 60s for uploads) */
app.use('/api', requestTimeout(30000));

/* Socket.IO */
const io = setupSocket(httpServer);
app.set('io', io);

/* REST API (all routers auto-wrap async handlers) */
app.use('/api/auth', patchRouter(authRouter));
app.use('/api/messages', patchRouter(messagesRouter));
app.use('/api/conversations', patchRouter(conversationsRouter));
app.use('/api/profiles', patchRouter(profilesRouter));
app.use('/api/groups', patchRouter(groupsRouter));
app.use('/api/contacts', patchRouter(contactsRouter));
app.use('/api/stories', patchRouter(storiesRouter));
app.use('/api/notifications', patchRouter(notificationsRouter));
app.use('/api/search', patchRouter(searchRouter));
app.use('/api/admin', patchRouter(adminRouter));
app.use('/api/status', patchRouter(statusRouter));
app.use('/api/public', patchRouter(publicRouter));
app.use('/api/link-preview', patchRouter(linkPreviewRouter));
app.use('/api/blocks', patchRouter(blocksRouter));
app.use('/api/calls', patchRouter(callsRouter));
app.use('/api/videos', patchRouter(videosRouter));

/* Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/* Frontend static files (built React app) */
const clientDist = resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

/* Downloads (installer, etc.) */
const downloadsDir = resolve(__dirname, '../downloads');
app.use('/downloads', express.static(downloadsDir));

/* Uploaded videos & thumbnails */
const uploadsDir = resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('*', (_req, res) => {
  res.sendFile(resolve(clientDist, 'index.html'));
});

/* Express error middleware (must be last) */
app.use(errorHandler);

/* Process handlers */
setupProcessHandlers(async () => {
  try { await pool.end(); } catch {}
  httpServer.close();
});

/* Run DB migrations then start */
const PORT = parseInt(process.env.PORT || '3000', 10);

runMigrations()
  .then(async () => {
    /* Init cold storage (GCS) */
    await initColdStorage();
    if (isColdStorageEnabled()) {
      await archiveOldCalls();
      setInterval(() => { archiveOldCalls().catch(() => {}); }, 21600000); /* every 6h */
    }
    /* Start ephemeral messages cleanup every 10 seconds */
    setInterval(async () => {
      try {
        const deleted = await cleanExpiredEphemeralMessages();
        if (deleted.length > 0) {
          for (const { type, convId, key } of deleted) {
            const room = type === 'dm' ? `dm:${convId}` : `group:${convId}`;
            io.to(room).emit('message:removed', { convId, key });
          }
        }
      } catch { /* silent */ }
    }, 10000);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🟢 Wouaff server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
