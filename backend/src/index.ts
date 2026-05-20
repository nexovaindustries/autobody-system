import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import authRouter from './routes/auth';
import quotationsRouter from './routes/quotations';
import ordersRouter from './routes/orders';
import trackingRouter from './routes/tracking';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure PDF directory exists
const pdfDir = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve PDFs statically (auth should be added in production)
app.use('/pdfs', express.static(pdfDir));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Ruta no encontrada' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Autobody API corriendo en http://localhost:${PORT}`);
});

export default app;
