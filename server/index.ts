import fs from 'fs';
import path from 'path';

// Manual .env loader
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.error('[EnvLoader] Failed to read .env file', e);
}

import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './database/seed';

import requestsRouter from './routes/requests';
import patientsRouter from './routes/patients';
import ordersRouter from './routes/orders';
import pharmaciesRouter from './routes/pharmacies';
import hospitalsRouter from './routes/hospitals';
import logisticsRouter from './routes/logistics';
import adminRouter from './routes/admin';
import systemRouter from './routes/system';
import streamRouter from './routes/stream';
import workflowRouter from './routes/workflow';
import demoRouter from './routes/demo';
import authRouter from './routes/auth';
import commerceRouter from './routes/commerce';

const app = express();
const PORT = process.env.PORT || 3001;

// Seed database on startup
seedDatabase();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Mount sub-routers
app.use('/api/requests', requestsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/pharmacies', pharmaciesRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system', systemRouter);
app.use('/api/workflow/stream', streamRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/demo', demoRouter);
app.use('/api/auth', authRouter);
app.use('/api', commerceRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Backend] MedXNet Unified Data Server running on http://localhost:${PORT}`);
});
export default app;
// Hot-reload trigger: Seed update 6.4.15
